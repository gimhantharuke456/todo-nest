import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DatabaseOptionsFactory,
  DatabaseModuleOptions,
} from './database.module';

@Injectable()
export class DatabaseConfigFactory implements DatabaseOptionsFactory {
  constructor(private configService: ConfigService) {}

  createDatabaseOptions(): DatabaseModuleOptions {
    return {
      uri: this.configService.get<string>('DATABASE_URL')!,
      retryWrites: true,
    };
  }
}
