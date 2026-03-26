import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.operacoes.cafe',
  appName: 'Operações Café',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
