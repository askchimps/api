import { registerAs } from '@nestjs/config';

export const app = registerAs('APP', () => ({
  NODE_ENV: process.env['NODE_ENV'],
  PORT: parseInt(JSON.stringify(process.env['PORT']), 10),
}));

export const database = registerAs('DATABASE', () => ({
  DATABASE_URL: process.env['DATABASE_URL'],
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

export const websocket = registerAs('WEBSOCKET', () => ({
  WEBSOCKET_CORS_ORIGIN: process.env['WEBSOCKET_CORS_ORIGIN'] || 'http://localhost:3000',
}));
