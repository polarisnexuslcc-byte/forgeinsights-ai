import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';

import { env } from '../../../config/env.js';
import { AIProviderError, normalizeUsage } from '../ai.providers.js';

const client = new BedrockRuntimeClient({
  region: env.AWS_REGION
});

function mapMessages(messages) {
  const systemMessages = [];
  const conversation = [];

  for (const message of messages) {
    if (message.role === 'system') {
      systemMessages.push({
        text: String(message.content || '')
      });
      continue;
    }

    conversation.push({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: [
        {
          text: String(message.content || '')
        }
      ]
    });
  }

  return {
    system: systemMessages,
    messages: conversation
  };
}

export async function bedrockChatCompletion({ messages, temperature = 0 }) {
  try {
    const payload = mapMessages(messages);

    const command = new ConverseCommand({
      modelId: env.BEDROCK_CHAT_MODEL_ID,
      system: payload.system,
      messages: payload.messages,
      inferenceConfig: {
        temperature
      }
    });

    const response = await client.send(command);

    const outputText = response.output?.message?.content?.[0]?.text || '';

    return {
      provider: 'bedrock',
      model: env.BEDROCK_CHAT_MODEL_ID,
      text: outputText,
      usage: normalizeUsage({
        inputTokens: response.usage?.inputTokens || 0,
        outputTokens: response.usage?.outputTokens || 0,
        totalTokens: response.usage?.totalTokens || 0
      }),
      raw: response
    };
  } catch (error) {
    throw new AIProviderError(error.message, {
      provider: 'bedrock'
    });
  }
}

export async function bedrockEmbedBatch({ texts }) {
  try {
    const embeddings = [];

    for (const text of texts) {
      const command = new InvokeModelCommand({
        modelId: env.BEDROCK_EMBEDDING_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: text
        })
      });

      const response = await client.send(command);
      const decoded = JSON.parse(new TextDecoder().decode(response.body));
      embeddings.push(decoded.embedding || decoded.embeddings?.[0] || []);
    }

    return {
      provider: 'bedrock',
      model: env.BEDROCK_EMBEDDING_MODEL_ID,
      embeddings,
      raw: null
    };
  } catch (error) {
    throw new AIProviderError(error.message, {
      provider: 'bedrock'
    });
  }
}
