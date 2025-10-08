import {
  Module,
  DynamicModule,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';

export interface DatabaseModuleOptions extends MongooseModuleOptions {
  uri: string;
}

export interface DatabaseOptionsFactory {
  createDatabaseOptions():
    | Promise<DatabaseModuleOptions>
    | DatabaseModuleOptions;
}

export interface DatabaseModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<DatabaseOptionsFactory>;
  useClass?: Type<DatabaseOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
  inject?: any[];
  extraProviders?: Provider[];
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRoot(options.uri, {
          ...options,
          uri: undefined, // Remove uri from options to avoid duplication
        }),
      ],
      exports: [MongooseModule],
    };
  }

  static forRootAsync(options: DatabaseModuleAsyncOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ...(options.imports || []),
        MongooseModule.forRootAsync({
          useFactory: async (...args: any[]) => {
            const dbOptions = await this.createAsyncOptions(options)(...args);
            const { uri, ...mongooseOptions } = dbOptions;
            return {
              uri,
              ...mongooseOptions,
            };
          },
          inject: options.inject || [],
        }),
      ],
      providers: this.createAsyncProviders(options),
      exports: [MongooseModule],
    };
  }

  private static createAsyncOptions(options: DatabaseModuleAsyncOptions) {
    if (options.useFactory) {
      return options.useFactory;
    }

    if (options.useClass) {
      return async (optionsFactory: DatabaseOptionsFactory) =>
        optionsFactory.createDatabaseOptions();
    }

    if (options.useExisting) {
      return async (optionsFactory: DatabaseOptionsFactory) =>
        optionsFactory.createDatabaseOptions();
    }

    throw new Error('Invalid DatabaseModuleAsyncOptions');
  }

  private static createAsyncProviders(
    options: DatabaseModuleAsyncOptions,
  ): Provider[] {
    const providers: Provider[] = [];

    if (options.useClass) {
      providers.push({
        provide: options.useClass,
        useClass: options.useClass,
      });
    }

    if (options.extraProviders) {
      providers.push(...options.extraProviders);
    }

    return providers;
  }
}
