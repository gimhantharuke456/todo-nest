import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: 3000,
    nodeEnv: 'development',
  }),
);
