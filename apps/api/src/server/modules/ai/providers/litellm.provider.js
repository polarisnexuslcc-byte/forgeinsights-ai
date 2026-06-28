import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { AIProviderError, normalizeUsage } from '../ai.providers.js';

const client = new OpenAI({
  apiKey: env.LITELLM_API_KEY || 'dummy-key',
  baseURL: env.LITELLM_BASE_URL
});

export async function liteLLMChatCompletion({ messages, temperature = 0 }) {
  try {
    const response = await client.chat.completions.create({
      model: env.LITELLM_CHAT_MODEL,
      messages,
      temperature
    });

    const choice = response.choices?.[0];

    return {
      provider: 'litellm',
      model: response.model || env.LITELLM_CHAT_MODEL,
      text: choice?.message?.content || '',
      usage: normalizeUsage({
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }),
      raw: response
    };
  } catch (error) {
    throw new AIProviderError(error.message, {
      provider: 'litellm'
    });
  }
}

export async function liteLLMEmbedBatch({ texts }) {
  try {
    const response = await client.embeddings.create({
      model: env.LITELLM_EMBEDDING_MODEL,
      input: texts
    });

    return {
      provider: 'litellm',
      model: env.LITELLM_EMBEDDING_MODEL,
      embeddings: response.data.map((item) => item.embedding),
      raw: response
    };
  } catch (error) {
    throw new AIProviderError(error.message, {
      provider: 'litellm'
    });
  }
}
