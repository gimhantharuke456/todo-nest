import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    url:
      process.env.DATABASE_URL ||
      'mongodb+srv://root:root@cluster0.spmcifx.mongodb.net/tod-test',
  }),
);
