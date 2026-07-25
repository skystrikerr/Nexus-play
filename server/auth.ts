import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./email";

// Shared limiter for credential endpoints: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

// Stricter limiter for account creation and password reset requests
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});



export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}



export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy (Email/Password)
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        if (!user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          provider: 'local'
        });
      } catch (error) {
        console.error('LocalStrategy error:', error);
        return done(error);
      }
    }
  ));







  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email returned from Google' });
        }

        // Check if user exists by google providerId
        let user = await storage.getUserByProviderId('google', profile.id);

        // If not found, check by email
        if (!user) {
          user = await storage.getUserByEmail(email);
        }

        if (user) {
          // Update provider info if not set
          if (!user.providerId) {
            await storage.updateUser(user.id, {
              provider: 'google',
              providerId: profile.id,
              profileImageUrl: user.profileImageUrl || profile.photos?.[0]?.value,
            });
          }
          return done(null, {
            id: user.id,
            email: user.email,
            firstName: user.firstName || profile.name?.givenName || '',
            lastName: user.lastName || profile.name?.familyName || '',
            provider: 'google',
          });
        }

        // Create new user from Google profile
        const username = email.split('@')[0] + '-' + profile.id.slice(0, 6);
        const newUser = await storage.createUser({
          email,
          username,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          provider: 'google',
          providerId: profile.id,
          profileImageUrl: profile.photos?.[0]?.value,
          password: undefined,
          isPublic: 0,
        });

        return done(null, {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          provider: 'google',
        });
      } catch (error) {
        console.error('GoogleStrategy error:', error);
        return done(error);
      }
    }));
  }

  // Passport serialization - store only user ID in session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Passport deserialization - fetch user from database
  passport.deserializeUser(async (id: string | any, done) => {
    try {
      // Handle case where full user object was serialized instead of just ID
      const userId = typeof id === 'string' ? id : id.id;
      
      // Handle guest users - they don't exist in database
      if (userId.startsWith('guest-')) {
        const guestUser = {
          id: userId,
          email: 'guest@nexusplay.app',
          firstName: 'Guest',
          lastName: 'User',
          provider: 'guest',
          isGuest: true
        };
        return done(null, guestUser);
      }
      
      const user = await storage.getUser(userId);
      if (user) {
        const sessionUser = { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          provider: user.provider
        };
        done(null, sessionUser);
      } else {
        done(null, false);
      }
    } catch (error) {
      console.error('Error during deserialization:', error);
      done(error, null);
    }
  });

  // Auth Routes
  
  // Local auth routes
  app.post('/api/auth/register', sensitiveLimiter, async (req, res) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !username) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate username format
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: 'Username must be 3-20 characters long' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with private profile by default
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName: lastName || '',
        provider: 'local',
        isPublic: 0, // Private by default for security
      });

      // Log in the user
      req.login({ 
        id: user.id, 
        email: user.email, 
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: 'local'
      }, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        res.json({ message: 'Registration successful', user: { id: user.id, email: user.email, username: user.username } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', authLimiter, (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ message: 'Session failed' });
        }
        res.json({ message: 'Login successful', user });
      });
    })(req, res, next);
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
    })(req, res, next);
  });

  app.get('/api/auth/google/callback',
    (req, res, next) => {
      passport.authenticate('google', {
        failureRedirect: '/auth',
        failureMessage: true,
      }, (err: any, user: any, info: any) => {
        if (err) {
          console.error('Google auth error:', err);
          return res.redirect('/auth');
        }
        if (!user) {
          console.error('Google auth failed:', info);
          return res.redirect('/auth');
        }
        req.login(user, (err) => {
          if (err) {
            console.error('Google session error:', err);
            return res.redirect('/auth');
          }
          res.redirect('/');
        });
      })(req, res, next);
    }
  );

  // Guest mode - browse without account
  app.post('/api/auth/guest', authLimiter, async (req, res) => {
    try {
      // Create a temporary guest session with demo user
      const guestUser = {
        id: 'guest-' + Date.now(),
        email: 'guest@nexusplay.app',
        firstName: 'Guest',
        lastName: 'User',
        provider: 'guest',
        isGuest: true
      };

      req.login(guestUser, (err) => {
        if (err) {
          console.error('Guest session error:', err);
          return res.status(500).json({ message: 'Guest mode failed' });
        }
        res.json({ message: 'Guest mode activated', user: guestUser });
      });
    } catch (error) {
      console.error('Guest mode error:', error);
      res.status(500).json({ message: 'Guest mode failed' });
    }
  });







  // Change password route
  app.post('/api/auth/change-password', authLimiter, isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.user as any).id;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      
      // Get user and verify current password
      const user = await storage.getUser(userId);
      if (!user || !user.password || user.provider !== 'local') {
        return res.status(400).json({ message: 'Cannot change password for this account type' });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedNewPassword });
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // Step 1 of password reset: request a reset link by email.
  // Always responds with the same message so it can't be used to probe
  // which emails have accounts.
  app.post('/api/auth/request-password-reset', sensitiveLimiter, async (req, res) => {
    const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.provider !== 'local') {
        return res.json(genericResponse);
      }

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      });

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${baseUrl}/auth?reset=${token}`;
      await sendPasswordResetEmail(user.email!, resetUrl);

      res.json(genericResponse);
    } catch (error) {
      // Still return the generic response (no email enumeration), but log the
      // real reason so delivery problems are debuggable from server logs.
      console.error('Request password reset error:', error);
      res.json(genericResponse);
    }
  });

  // Step 2 of password reset: submit the token from the emailed link along
  // with the new password.
  app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || typeof token !== 'string' || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Reset token, new password, and confirmation are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await storage.getUserByResetTokenHash(tokenHash);
      if (!user) {
        return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, {
        password: hashedNewPassword,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      });

      res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error');
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Gaming platform connection routes
  app.post('/api/gaming/connect/steam', isAuthenticated, async (req, res) => {
    try {
      const { steamId, apiKey } = req.body;
      if (!steamId) {
        return res.status(400).json({ message: 'Steam ID required' });
      }

      const userId = (req.user as any).id;
      
      // Update user with Steam info
      await storage.updateUser(userId, {
        steamId,
        steamApiKey: apiKey || undefined
      });

      res.json({ 
        message: 'Steam account connected successfully', 
        steamId 
      });
    } catch (error) {
      console.error('Steam connection error:', error);
      res.status(500).json({ message: 'Failed to connect Steam account' });
    }
  });

  app.post('/api/gaming/connect/xbox', isAuthenticated, async (req, res) => {
    try {
      const { gamertag, accessToken } = req.body;
      if (!gamertag || !accessToken) {
        return res.status(400).json({ message: 'Xbox gamertag and access token required' });
      }

      const userId = (req.user as any).id;
      
      // Update user with Xbox info
      await storage.updateUser(userId, {
        xboxLiveId: gamertag,
        xboxAccessToken: accessToken
      });

      res.json({ 
        message: 'Xbox account connected successfully', 
        gamertag 
      });
    } catch (error) {
      console.error('Xbox connection error:', error);
      res.status(500).json({ message: 'Failed to connect Xbox account' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  
  // Allow guest users
  if ((req.user as any)?.isGuest) {
    return next();
  }
  
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

