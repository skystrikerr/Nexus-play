import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexusplay.app',
  appName: 'NexusPlay',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0F172A",
      showSpinner: false
    },
    StatusBar: {
      style: "DARK"
    },
    Keyboard: {
      resize: "body"
    }
  }
};

export default config;
