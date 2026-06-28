import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { AIProviderError, normalizeUsage } from '../ai.providers.js';

const client = new OpenAI({
  apiKey: env.AZURE_OPENAI_API_KEY,
  baseURL: `${env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${env.AZURE_OPENAI_CHAT_DEPLOYMENT}`,
  defaultQuery: { 'api-version': env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: { 'api-key': env.AZURE_OPENAI_API_KEY }
});

const embeddingsClient = new OpenAI({
  apiKey: env.AZURE_OPENAI_API_KEY,
  baseURL: `${env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}`,
  defaultQuery: { 'api-version': env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: { 'api-key': env.AZURE_OPENAI_API_KEY }
});

export async function azureOpenAIChatCompletion({ messages, temperature = 0 }) {
  try {
    const response = await client.chat.completions.create({
      model: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
      messages,
      temperature
    });

    const choice = response.choices?.[0];

    return {
      provider: 'azure-openai',
      model: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
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
      provider: 'azure-openai'
    });
  }
}

export async function azureOpenAIEmbedBatch({ texts }) {
  try {
    const response = await embeddingsClient.embeddings.create({
      model: env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      input: texts
    });

    return {
      provider: 'azure-openai',
      model: env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      embeddings: response.data.map((item) => item.embedding),
      raw: response
    };
  } catch (error) {
    throw new AIProviderError(error.message, {
      provider: 'azure-openai'
    });
  }
}
