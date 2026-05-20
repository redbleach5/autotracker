import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.autotracker.app',
  appName: 'AutoTracker',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#10b981',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      androidScaleType: 'CENTER_CROP',
    },
  },
}

export default config
