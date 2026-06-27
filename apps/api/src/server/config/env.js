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
  RETRIEVAL_MAX_CANDIDATES: Number(process.env.RETRIEVAL_MAX_CANDIDATES || 10),
  RETRIEVAL_MAX_CHUNKS_PER_DOCUMENT: Number(
    process.env.RETRIEVAL_MAX_CHUNKS_PER_DOCUMENT || 2
  ),
  RETRIEVAL_ENABLE_DIVERSITY_RERANK:
    String(process.env.RETRIEVAL_ENABLE_DIVERSITY_RERANK || 'true') === 'true',
  RETRIEVAL_DIVERSITY_LAMBDA: Number(process.env.RETRIEVAL_DIVERSITY_LAMBDA || 0.7),
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  HYBRID_ENABLE_SEMANTIC:
    String(process.env.HYBRID_ENABLE_SEMANTIC || 'true') === 'true',
  HYBRID_RRF_K: Number(process.env.HYBRID_RRF_K || 60),
  HYBRID_SEMANTIC_CANDIDATES: Number(process.env.HYBRID_SEMANTIC_CANDIDATES || 10),
  ALERT_P95_LATENCY_MS: Number(process.env.ALERT_P95_LATENCY_MS || 4000),
  ALERT_AVG_COST_USD: Number(process.env.ALERT_AVG_COST_USD || 0.01),
  ALERT_ERROR_RATE: Number(process.env.ALERT_ERROR_RATE || 0.05),
  ALERT_MIN_RUNS: Number(process.env.ALERT_MIN_RUNS || 20),
  ALERT_REGRESSION_WINDOW_HOURS: Number(process.env.ALERT_REGRESSION_WINDOW_HOURS || 24),
  CACHE_ENABLE_EXACT_QUERY:
    String(process.env.CACHE_ENABLE_EXACT_QUERY || 'true') === 'true',
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS || 900),
  CACHE_MAX_ENTRIES: Number(process.env.CACHE_MAX_ENTRIES || 500),
  RETRIEVAL_SEMANTIC_TIMEOUT_MS: Number(process.env.RETRIEVAL_SEMANTIC_TIMEOUT_MS || 1200),
  RETRIEVAL_FORCE_LEXICAL_ON_TIMEOUT:
    String(process.env.RETRIEVAL_FORCE_LEXICAL_ON_TIMEOUT || 'true') === 'true'
};
