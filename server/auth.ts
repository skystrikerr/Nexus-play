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
      secure: true,
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
        if (!user || user.provider !== 'local') {
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
        return done(error);
      }
    }
  ));

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
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



  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

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

  app.post('/api/auth/login', 
    passport.authenticate('local', { failureMessage: true }),
    (req, res) => {
      res.json({ message: 'Login successful', user: req.user });
    }
  );

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



  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
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