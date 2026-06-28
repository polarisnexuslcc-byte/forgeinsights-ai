import { app } from './server/app.js';
import { env } from './server/config/env.js';
import { initializeDatabase } from './server/db/init.js';
import { validateAIConfiguration } from './server/modules/ai/ai.config.js';

validateAIConfiguration();
initializeDatabase();

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);
  console.log(`[api] AI provider: ${env.AI_PROVIDER} | embedding: ${env.AI_EMBEDDING_PROVIDER}`);
});
