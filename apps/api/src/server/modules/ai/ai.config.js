import { env } from '../../config/env.js';

export function validateAIConfiguration() {
  if (env.AI_PROVIDER === 'bedrock' && !env.BEDROCK_CHAT_MODEL_ID) {
    throw new Error('BEDROCK_CHAT_MODEL_ID is required when AI_PROVIDER=bedrock');
  }

  if (env.AI_EMBEDDING_PROVIDER === 'bedrock' && !env.BEDROCK_EMBEDDING_MODEL_ID) {
    throw new Error('BEDROCK_EMBEDDING_MODEL_ID is required when AI_EMBEDDING_PROVIDER=bedrock');
  }

  if (env.AI_PROVIDER === 'azure-openai' && !env.AZURE_OPENAI_ENDPOINT) {
    throw new Error('AZURE_OPENAI_ENDPOINT is required when AI_PROVIDER=azure-openai');
  }

  if (env.AI_PROVIDER === 'azure-openai' && !env.AZURE_OPENAI_CHAT_DEPLOYMENT) {
    throw new Error('AZURE_OPENAI_CHAT_DEPLOYMENT is required when AI_PROVIDER=azure-openai');
  }

  if (env.AI_PROVIDER === 'nvidia' && !env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is required when AI_PROVIDER=nvidia');
  }

  if (env.AI_PROVIDER === 'nvidia' && !env.NVIDIA_BASE_URL) {
    throw new Error('NVIDIA_BASE_URL is required when AI_PROVIDER=nvidia');
  }

  if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
  }
}
