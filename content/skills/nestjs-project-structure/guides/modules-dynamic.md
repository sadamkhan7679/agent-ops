---
title: Dynamic Modules
tags: modules, dynamic, configurable, providers
---

## Dynamic Modules

Dynamic modules accept configuration at import time, enabling reusable modules with different settings per consumer.

### Implementation

```typescript
// shared/mail/mail.module.ts
import { Module, type DynamicModule } from '@nestjs/common';
import { MailService } from './mail.service';

interface MailModuleOptions {
  apiKey: string;
  from: string;
  templateDir?: string;
}

@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      module: MailModule,
      global: true, // Available everywhere without importing
      providers: [
        { provide: 'MAIL_OPTIONS', useValue: options },
        MailService,
      ],
      exports: [MailService],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => MailModuleOptions | Promise<MailModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MailModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: 'MAIL_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        MailService,
      ],
      exports: [MailService],
    };
  }
}

// Usage in AppModule
@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.get('MAIL_API_KEY'),
        from: config.get('MAIL_FROM'),
      }),
    }),
  ],
})
export class AppModule {}
```

Rules:
- Use `forRoot()` for synchronous configuration
- Use `forRootAsync()` when configuration depends on other modules (ConfigModule)
- Set `global: true` for infrastructure modules used everywhere (database, mail, logger)
- Keep `forRoot` and `forRootAsync` as the only two static methods
