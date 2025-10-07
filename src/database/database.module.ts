import { Module, DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig, { DatabaseConfig } from '../config/database.config';

@Module({})
export class DatabaseModule {
  static registerAsync(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule.forFeature(databaseConfig),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get<DatabaseConfig>('database');
            const uri = configService.get<string>('DATABASE_URL');

            return {
              uri,
              retryWrites: dbConfig?.retryWrites,
            };
          },
        }),
      ],
      exports: [MongooseModule],
    };
  }
}
