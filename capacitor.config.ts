import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.debojitsantra.backlogtracker',
  appName: 'Backlog Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',

  },
  android: {

    backgroundColor: '#111318'
  }
};

export default config;
