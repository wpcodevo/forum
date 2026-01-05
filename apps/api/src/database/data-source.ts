import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { envSchema } from '../config/env.config';
import { env } from 'process';

config({ path: resolve(__dirname, '../../.env') });

const parsedEnv = envSchema.parse(process.env);

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: parsedEnv.DATABASE_URL,
  entities: [resolve(__dirname, 'entities/**/*.entity{.ts,.js}')],
  migrations: [resolve(__dirname, 'migrations/**/*{.ts,.js}')],
  synchronize: false,
  logging: env.NODE_ENV === 'development',
};

export const dataSource = new DataSource(dataSourceOptions);

