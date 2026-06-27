import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  APP_NAME: process.env.APP_NAME || 'ForgeInsights AI API',
  APP_URL: process.env.APP_URL || 'http://localhost:3001',
  DATABASE_URL: process.env.DATABASE_URL || '../../storage/dev.sqlite',
  SESSION_TTL_DAYS: Number(process.env.SESSION_TTL_DAYS || 7),
  UPLOAD_DIR: process.env.UPLOAD_DIR || '../../storage/uploads',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  ANSWER_TOP_K: Number(process.env.ANSWER_TOP_K || 5),
  ANSWER_MIN_CHUNKS: Number(process.env.ANSWER_MIN_CHUNKS || 2),
  ANSWER_TEMPERATURE: Number(process.env.ANSWER_TEMPERATURE || 0),
  RETRIEVAL_ENABLE_QUERY_REWRITE:
    String(process.env.RETRIEVAL_ENABLE_QUERY_REWRITE || 'true') === 'true',
  RETRIEVAL_REWRITE_MODEL: process.env.RETRIEVAL_REWRITE_MODEL || 'gpt-4.1-mini',
  RETRIEVAL_MAX_CANDIDATES: Number(process.env.RETRIEVAL_MAX_CANDIDATES || 10)
};
