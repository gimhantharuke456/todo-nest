import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  retryWrites: boolean;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    url: '',
    retryWrites: true,
  }),
);
