import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  PORT: Joi.number().default(4022),
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'production', 'test')
    .default('development'),

  // Database - Public Schema
  PUBLIC_DATABASE_URL: Joi.string().required(),
  PUBLIC_DIRECT_URL: Joi.string().optional(),

  // Database - Magpie Schema
  MAGPIE_DATABASE_URL: Joi.string().required(),
  MAGPIE_DIRECT_URL: Joi.string().optional(),

  // Database - Sunroof Schema
  SUNROOF_DATABASE_URL: Joi.string().required(),
  SUNROOF_DIRECT_URL: Joi.string().optional(),

  // Legacy support
  DATABASE_URL: Joi.string().optional(),

  // Jwt
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().required(),

  // Openai
  OPENAI_SECRET_KEY: Joi.string().required(),

  // Supabase
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
});
