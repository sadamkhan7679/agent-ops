---
title: Connection Pool Configuration
tags: performance, connection-pool, pg, tuning
---

## Connection Pool Configuration

Properly configure the PostgreSQL connection pool to balance throughput and resource usage.

### Pool Configuration

```typescript
// shared/database/drizzle.provider.ts
import { Pool } from 'pg';

export const DrizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.get<string>('database.url'),

      // Pool sizing
      max: config.get<number>('database.poolMax', 20),
      min: config.get<number>('database.poolMin', 2),

      // Timeouts
      idleTimeoutMillis: 30_000,          // close idle connections after 30s
      connectionTimeoutMillis: 5_000,     // fail if can't connect in 5s
      allowExitOnIdle: true,              // allow process to exit if pool is idle

      // SSL
      ssl: config.get<boolean>('database.ssl')
        ? { rejectUnauthorized: false }
        : false,
    });

    // Verify connection on startup
    const client = await pool.connect();
    client.release();

    // Monitor pool health
    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });

    return drizzle(pool, { schema });
  },
};
```

### Pool Sizing Guidelines

```text
# Formula: pool_max = (cpu_cores * 2) + disk_spindles
# For SSDs: pool_max = cpu_cores * 2 + 1

# Small app (1-2 vCPUs):    max: 5-10
# Medium app (4 vCPUs):     max: 10-20
# Large app (8+ vCPUs):     max: 20-50

# IMPORTANT: total connections across all app instances must not exceed
# PostgreSQL max_connections (default: 100)
# 3 app instances × 20 pool max = 60 connections (safe)
# 5 app instances × 30 pool max = 150 connections (exceeds default!)
```

### Health Check Endpoint

```typescript
// modules/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async check() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException('Database connection failed');
    }
  }
}
```

### Graceful Shutdown

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  await app.listen(3000);
}

// shared/database/database.module.ts
@Global()
@Module({
  providers: [
    DrizzleProvider,
    {
      provide: 'PG_POOL',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Pool({ connectionString: config.get('database.url') });
      },
    },
  ],
  exports: [DrizzleProvider],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Database pool closed');
  }
}
```

### Rules

- Set `max` based on vCPU count and total instance count — don't exceed PostgreSQL's `max_connections`
- Set `connectionTimeoutMillis` to fail fast (5s) rather than queue requests indefinitely
- Enable `allowExitOnIdle` for serverless/short-lived processes
- Verify the connection on startup — fail fast if the database is unreachable
- Implement graceful shutdown with `OnModuleDestroy` to drain the pool on process exit
- Use a connection pooler (PgBouncer, Supabase Pooler) in production for high-traffic apps
