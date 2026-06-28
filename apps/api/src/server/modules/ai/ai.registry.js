import { env } from '../../config/env.js';
import {
  azureOpenAIChatCompletion,
  azureOpenAIEmbedBatch
} from './providers/azure-openai.provider.js';
import {
  bedrockChatCompletion,
  bedrockEmbedBatch
} from './providers/bedrock.provider.js';
import {
  liteLLMChatCompletion,
  liteLLMEmbedBatch
} from './providers/litellm.provider.js';
import {
  nvidiaChatCompletion,
  nvidiaEmbedBatch
} from './providers/nvidia.provider.js';
import {
  openAIChatCompletion,
  openAIEmbedBatch
} from './providers/openai.provider.js';

const chatProviders = {
  openai: openAIChatCompletion,
  'azure-openai': azureOpenAIChatCompletion,
  bedrock: bedrockChatCompletion,
  nvidia: nvidiaChatCompletion,
  litellm: liteLLMChatCompletion
};

const embeddingProviders = {
  openai: openAIEmbedBatch,
  'azure-openai': azureOpenAIEmbedBatch,
  bedrock: bedrockEmbedBatch,
  nvidia: nvidiaEmbedBatch,
  litellm: liteLLMEmbedBatch
};

export function getChatProvider(providerName = env.AI_PROVIDER) {
  const provider = chatProviders[providerName];

  if (!provider) {
    throw new Error(`Unsupported chat provider: ${providerName}`);
  }

  return provider;
}

export function getEmbeddingProvider(providerName = env.AI_EMBEDDING_PROVIDER) {
  const provider = embeddingProviders[providerName];

  if (!provider) {
    throw new Error(`Unsupported embedding provider: ${providerName}`);
  }

  return provider;
}
