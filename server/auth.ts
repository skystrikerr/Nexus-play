import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as SteamStrategy } from "passport-steam";

import axios from "axios";
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
        if (!user || user.provider !== 'local') {
          console.log('User not found or not local provider:', user?.provider);
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

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
      : "/api/auth/google/callback";
      
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        const userData = {
          email,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value,
          provider: 'google' as const,
          providerId: profile.id,
        };

        const user = await storage.upsertUser(userData);
        return done(null, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          provider: 'google'
        });
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Steam Strategy
  if (process.env.STEAM_API_KEY) {
    passport.use(new SteamStrategy({
      returnURL: `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/steam/callback`,
      realm: process.env.BASE_URL || 'http://localhost:5000',
      apiKey: process.env.STEAM_API_KEY
    }, async (identifier, profile, done) => {
      try {
        const steamId = identifier.split('/').pop();
        if (!steamId) {
          return done(new Error('No Steam ID found'));
        }

        // Check if user exists by steamId first
        let user = await storage.getUserBySteamId(steamId);
        
        if (!user) {
          // Create new user with Steam data
          const userData = {
            steamId,
            firstName: profile.displayName || 'Steam User',
            lastName: '',
            profileImageUrl: profile.photos?.[0]?.value,
            provider: 'steam' as const,
            providerId: steamId,
          };
          user = await storage.createUser(userData);
        }

        return done(null, {
          id: user.id,
          steamId: user.steamId,
          firstName: user.firstName,
          lastName: user.lastName,
          provider: 'steam'
        });
      } catch (error) {
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
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName: lastName || '',
        provider: 'local',
      });

      // Log in the user
      req.login({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        provider: 'local'
      }, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        res.json({ message: 'Registration successful', user: { id: user.id, email: user.email } });
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

  // Google auth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=google_auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Steam auth routes
  app.get('/api/auth/steam',
    passport.authenticate('steam')
  );

  app.get('/api/auth/steam/callback',
    passport.authenticate('steam', { failureRedirect: '/?error=steam_auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Xbox Live connection (separate from auth since Xbox doesn't have OAuth like Steam)
  app.post('/api/auth/connect/xbox', isAuthenticated, async (req, res) => {
    try {
      const { accessToken, gamertag } = req.body;
      if (!accessToken || !gamertag) {
        return res.status(400).json({ message: 'Xbox access token and gamertag required' });
      }

      const userId = (req.user as any).id || (req.user as any).claims?.sub;
      
      // Verify Xbox Live token and get user info
      const xboxProfile = await verifyXboxToken(accessToken);
      if (!xboxProfile) {
        return res.status(400).json({ message: 'Invalid Xbox Live token' });
      }

      // Update user with Xbox Live info
      await storage.updateUserXboxInfo(userId, {
        xboxLiveId: gamertag,
        xboxAccessToken: accessToken
      });

      res.json({ message: 'Xbox Live account connected successfully', gamertag });
    } catch (error) {
      console.error('Xbox connection error:', error);
      res.status(500).json({ message: 'Failed to connect Xbox Live account' });
    }
  });

  // Steam connection (for existing users to link Steam)
  app.post('/api/auth/connect/steam', isAuthenticated, async (req, res) => {
    try {
      const { steamId, apiKey } = req.body;
      if (!steamId) {
        return res.status(400).json({ message: 'Steam ID required' });
      }

      const userId = (req.user as any).id || (req.user as any).claims?.sub;
      
      // Verify Steam profile exists
      const steamProfile = await getSteamProfile(steamId, apiKey || process.env.STEAM_API_KEY);
      if (!steamProfile) {
        return res.status(400).json({ message: 'Invalid Steam ID or profile not found' });
      }

      // Update user with Steam info
      await storage.updateUserSteamInfo(userId, {
        steamId,
        steamApiKey: apiKey || undefined
      });

      res.json({ 
        message: 'Steam account connected successfully', 
        profile: steamProfile 
      });
    } catch (error) {
      console.error('Steam connection error:', error);
      res.status(500).json({ message: 'Failed to connect Steam account' });
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
  
  if (!req.isAuthenticated() || !req.user) {
    console.log('Authentication failed - no session or user');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log('Authentication successful for user:', (req.user as any)?.email);
  next();
};

// Xbox Live token verification
async function verifyXboxToken(accessToken: string) {
  try {
    // Step 1: Get Xbox Live user token
    const userTokenResponse = await axios.post('https://user.auth.xboxlive.com/user/authenticate', {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${accessToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const userToken = userTokenResponse.data.Token;
    const userHash = userTokenResponse.data.DisplayClaims.xui[0].uhs;

    // Step 2: Get XSTS token
    const xstsResponse = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [userToken]
      },
      RelyingParty: 'http://xboxlive.com',
      TokenType: 'JWT'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const xstsToken = xstsResponse.data.Token;

    // Step 3: Get Xbox profile
    const profileResponse = await axios.get('https://profile.xboxlive.com/users/me/profile/settings', {
      headers: {
        'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
        'x-xbl-contract-version': '2',
        'Accept': 'application/json'
      },
      params: {
        settings: 'GameDisplayName,Gamertag,GameDisplayPicRaw'
      }
    });

    return profileResponse.data;
  } catch (error) {
    console.error('Xbox token verification failed:', error);
    return null;
  }
}

// Steam profile verification
async function getSteamProfile(steamId: string, apiKey?: string) {
  try {
    if (!apiKey) {
      throw new Error('Steam API key not provided');
    }

    const response = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/', {
      params: {
        key: apiKey,
        steamids: steamId,
        format: 'json'
      }
    });

    const players = response.data.response.players;
    return players && players.length > 0 ? players[0] : null;
  } catch (error) {
    console.error('Steam profile verification failed:', error);
    return null;
  }
}