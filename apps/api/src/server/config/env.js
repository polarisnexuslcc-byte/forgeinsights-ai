import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  APP_NAME: process.env.APP_NAME || 'ForgeInsights AI API',
  APP_URL: process.env.APP_URL || 'http://localhost:3001',
  DATABASE_URL: process.env.DATABASE_URL || '../../storage/dev.sqlite',
  SESSION_TTL_DAYS: Number(process.env.SESSION_TTL_DAYS || 7),
  UPLOAD_DIR: process.env.UPLOAD_DIR || '../../storage/uploads'
};
