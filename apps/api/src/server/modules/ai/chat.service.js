import { env } from '../../config/env.js';
import { getChatProvider } from './ai.registry.js';

export async function generateChatCompletion({
  messages,
  temperature = env.ANSWER_TEMPERATURE
}) {
  const provider = getChatProvider();
  return provider({ messages, temperature });
}
