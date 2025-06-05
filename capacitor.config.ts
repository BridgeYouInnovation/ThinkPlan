import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thinkplan.app',
  appName: 'ThinkPlan',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#7c3aed",
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  ios: {
    scheme: 'ThinkPlan'
  },
  android: {
    buildOptions: {
      keystorePath: 'app/thinkplan-key.keystore',
      keystorePassword: 'thinkplan123',
      keystoreAlias: 'thinkplan',
      keystoreAliasPassword: 'thinkplan123',
      releaseType: 'AAB'
    }
  }
};

export default config;
