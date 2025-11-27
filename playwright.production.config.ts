import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'https://scam-dunk-production.vercel.app',
    headless: true,
    screenshot: 'only-on-failure',
  },
};
export default config;

