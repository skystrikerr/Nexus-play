import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";



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
        console.log('LocalStrategy attempting login for:', email);
        const user = await storage.getUserByEmail(email);
        if (!user) {
          console.log('User not found');
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        if (!user.password) {
          console.log('User has no password');
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          console.log('Password invalid for user:', email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        console.log('Login successful for user:', email);
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
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  // Passport deserialization - fetch user from database
  passport.deserializeUser(async (id: string | any, done) => {
    try {
      // Handle case where full user object was serialized instead of just ID
      const userId = typeof id === 'string' ? id : id.id;
      console.log('Deserializing user ID:', userId);
      
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
        console.log('Guest user deserialized');
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
        console.log('User deserialized successfully:', sessionUser.email);
        done(null, sessionUser);
      } else {
        console.log('User not found during deserialization:', userId);
        done(null, false);
      }
    } catch (error) {
      console.error('Error during deserialization:', error);
      done(error, null);
    }
  });

  // Auth Routes
  
  // Local auth routes
  app.post('/api/auth/register', async (req, res) => {
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

  app.post('/api/auth/login', (req, res, next) => {
    console.log('Login request body:', req.body);
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      if (!user) {
        console.log('Login failed - no user:', info);
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ message: 'Session failed' });
        }
        console.log('Login successful for user:', user.email);
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
  app.post('/api/auth/guest', async (req, res) => {
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
        console.log('Guest mode activated');
        res.json({ message: 'Guest mode activated', user: guestUser });
      });
    } catch (error) {
      console.error('Guest mode error:', error);
      res.status(500).json({ message: 'Guest mode failed' });
    }
  });







  // Change password route
  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
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

  // Reset password (for logged out users) 
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword, confirmPassword } = req.body;
      
      if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Email, new password, and confirmation are required' });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user || user.provider !== 'local') {
        return res.status(400).json({ message: 'No local account found with this email' });
      }
      
      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedNewPassword });
      
      res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
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
  console.log('isAuthenticated check - isAuthenticated():', req.isAuthenticated());
  console.log('isAuthenticated check - session ID:', req.sessionID);
  console.log('isAuthenticated check - user:', req.user);
  
  // Allow guest users
  if ((req.user as any)?.isGuest) {
    console.log('Guest mode access allowed');
    return next();
  }
  
  if (!req.isAuthenticated() || !req.user) {
    console.log('Authentication failed - no session or user');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log('Authentication successful for user:', (req.user as any)?.email);
  next();
};

