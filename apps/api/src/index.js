import { app } from './server/app.js';
import { env } from './server/config/env.js';

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);
});
