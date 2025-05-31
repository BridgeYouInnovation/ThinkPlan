
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.759c9db5ec8342a9bee07ff61ad201af',
  appName: 'kind-word-society',
  webDir: 'dist',
  server: {
    url: 'https://759c9db5-ec83-42a9-bee0-7ff61ad201af.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#7c3aed",
      showSpinner: false
    }
  }
};

export default config;
