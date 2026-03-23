---
title: Typed Configuration Module
tags: config, environment, nestjs-config, typed
---

## Typed Configuration Module

Use `@nestjs/config` with typed factory functions for type-safe, validated configuration.

### Structure

```text
config/
  config.module.ts          # ConfigModule.forRoot setup
  app.config.ts             # App-wide config (port, cors, name)
  database.config.ts        # Database connection config
  auth.config.ts            # JWT secrets, token expiry
  mail.config.ts            # SMTP/API config
```

### Typed Config Factory

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().default(20),
  DATABASE_SSL: z.coerce.boolean().default(false),
});

export const databaseConfig = registerAs('database', () => {
  const env = schema.parse(process.env);
  return {
    url: env.DATABASE_URL,
    poolMax: env.DATABASE_POOL_MAX,
    ssl: env.DATABASE_SSL,
  };
});

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
```

### Config Module Setup

```typescript
// config/config.module.ts
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';

export const ConfigModule = NestConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, databaseConfig, authConfig],
  envFilePath: ['.env.local', '.env'],
});
```

### Usage with Type Safety

```typescript
@Injectable()
export class AuthService {
  constructor(
    @Inject(authConfig.KEY) private readonly config: AuthConfig,
  ) {}

  generateToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.jwtSecret,
        expiresIn: this.config.jwtExpiresIn,
      },
    );
  }
}
```

Rules:
- Validate environment variables with Zod at startup — fail fast on missing config
- Use `registerAs` for namespaced, typed configuration
- Set `isGlobal: true` to avoid importing ConfigModule in every feature module
- Never access `process.env` directly in services — always go through ConfigService or typed config
