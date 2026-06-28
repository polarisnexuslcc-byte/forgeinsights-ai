import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { AIProviderError, normalizeUsage } from '../ai.providers.js';

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export async function openAIChatCompletion({ messages, temperature = 0 }) {
  try {
    const response = await client.chat.completions.create({
      model: env.AI_CHAT_MODEL,
      messages,
      temperature
    });

    const choice = response.choices?.[0];

    return {
      provider: 'openai',
      model: response.model || env.AI_CHAT_MODEL,
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
      provider: 'openai'
    });
  }
}

export async function openAIEmbedBatch({ texts }) {
  try {
    const response = await client.embeddings.create({
      model: env.AI_EMBEDDING_MODEL,
      input: texts
    });

    return {
      provider: 'openai',
      model: env.AI_EMBEDDING_MODEL,
      embeddings: response.data.map((item) => item.embedding),
      raw: response
    };
  } catch (error) {
    throw new AIProviderError(error.message, {
      provider: 'openai'
    });
  }
}
