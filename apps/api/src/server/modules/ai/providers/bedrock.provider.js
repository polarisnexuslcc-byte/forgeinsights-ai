import { AIProviderError } from '../ai.providers.js';

export async function bedrockChatCompletion() {
  throw new AIProviderError('Bedrock provider not implemented yet', {
    provider: 'bedrock'
  });
}

export async function bedrockEmbedBatch() {
  throw new AIProviderError('Bedrock provider not implemented yet', {
    provider: 'bedrock'
  });
}
