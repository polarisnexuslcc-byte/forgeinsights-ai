export class AIProviderError extends Error {
  constructor(message, metadata = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.metadata = metadata;
  }
}

export function normalizeUsage(raw = {}) {
  return {
    promptTokens: raw.promptTokens || raw.inputTokens || 0,
    completionTokens: raw.completionTokens || raw.outputTokens || 0,
    totalTokens: raw.totalTokens || 0
  };
}
