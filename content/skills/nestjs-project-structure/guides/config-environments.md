---
title: Environment-Specific Configuration
tags: config, environments, env, validation
---

## Environment-Specific Configuration

Separate environment files prevent accidental production deployments with development settings.

### Environment Files

```text
.env                # Default values (committed, no secrets)
.env.local          # Local overrides (gitignored)
.env.test           # Test environment
.env.production     # Production values reference (no actual secrets)
```

### Validation at Startup

```typescript
// config/app.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(',').map((o) => o.trim()))
    .default('http://localhost:3000'),
  API_PREFIX: z.string().default('api'),
});

export const appConfig = registerAs('app', () => {
  const env = schema.parse(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS,
    apiPrefix: env.API_PREFIX,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  };
});
```

### Environment-Specific Behavior

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const appConf = config.get('app');

  // Swagger only in development
  if (appConf.isDev) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  // CORS
  app.enableCors({ origin: appConf.corsOrigins });

  app.setGlobalPrefix(appConf.apiPrefix);
  await app.listen(appConf.port);
}
```

Rules:
- Validate ALL environment variables at startup with Zod
- Crash immediately if required variables are missing — don't discover at runtime
- Use `.default()` for optional values with sensible defaults
- Never commit secrets — use `.env.local` (gitignored) or environment injection
