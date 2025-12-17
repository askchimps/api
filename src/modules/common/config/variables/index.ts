import { registerAs } from '@nestjs/config';

export const app = registerAs('APP', () => ({
  NODE_ENV: process.env['NODE_ENV'],
  PORT: parseInt(JSON.stringify(process.env['PORT']), 10),
}));

export const database = registerAs('DATABASE', () => ({
  PUBLIC_DATABASE_URL: process.env['PUBLIC_DATABASE_URL'],
  PUBLIC_DIRECT_URL: process.env['PUBLIC_DIRECT_URL'],
  MAGPIE_DATABASE_URL: process.env['MAGPIE_DATABASE_URL'],
  MAGPIE_DIRECT_URL: process.env['MAGPIE_DIRECT_URL'],
  SUNROOF_DATABASE_URL: process.env['SUNROOF_DATABASE_URL'],
  SUNROOF_DIRECT_URL: process.env['SUNROOF_DIRECT_URL'],
  // Legacy support
  DATABASE_URL: process.env['DATABASE_URL'] || process.env['PUBLIC_DATABASE_URL'],
}));

export const jwt = registerAs('JWT', () => ({
  JWT_SECRET: process.env['JWT_SECRET'],
  JWT_EXPIRATION: process.env['JWT_EXPIRATION'],
}));

export const openai = registerAs('OPENAI', () => ({
  OPENAI_SECRET_KEY: process.env['OPENAI_SECRET_KEY'],
}));

export const supabase = registerAs('SUPABASE', () => ({
  SUPABASE_URL: process.env['SUPABASE_URL'],
  SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'],
}));
