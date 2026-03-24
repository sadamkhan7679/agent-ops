---
title: Tenant Data Isolation
tags: multi-tenancy, isolation, row-level, security
---

## Tenant Data Isolation

Ensure tenants can only access their own data using row-level filtering or schema-level separation.

### Row-Level Security (Application Layer)

```typescript
// shared/database/base-tenant.repository.ts
@Injectable()
export abstract class BaseTenantRepository<TTable extends PgTable> {
  constructor(
    @Inject(DRIZZLE) protected readonly db: DrizzleDB,
    @Inject(REQUEST) protected readonly request: Request,
    protected readonly table: TTable,
  ) {}

  private get tenantId(): string {
    return (this.request as any).tenantId;
  }

  async findAll(where?: SQL): Promise<any[]> {
    const tenantCondition = eq((this.table as any).tenantId, this.tenantId);
    const fullWhere = where ? and(tenantCondition, where) : tenantCondition;

    return this.db.select().from(this.table).where(fullWhere);
  }

  async findById(id: string): Promise<any | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(and(
        eq((this.table as any).id, id),
        eq((this.table as any).tenantId, this.tenantId),
      ));
    return record ?? null;
  }

  async create(data: any): Promise<any> {
    const [record] = await this.db
      .insert(this.table)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return record;
  }

  async update(id: string, data: any): Promise<any | null> {
    const [record] = await this.db
      .update(this.table)
      .set(data)
      .where(and(
        eq((this.table as any).id, id),
        eq((this.table as any).tenantId, this.tenantId),
      ))
      .returning();
    return record ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(this.table)
      .where(and(
        eq((this.table as any).id, id),
        eq((this.table as any).tenantId, this.tenantId),
      ));
  }
}
```

### Tenant-Scoped Repository Usage

```typescript
@Injectable({ scope: Scope.REQUEST })
export class ProjectsRepository extends BaseTenantRepository<typeof projects> {
  constructor(
    @Inject(DRIZZLE) db: DrizzleDB,
    @Inject(REQUEST) request: Request,
  ) {
    super(db, request, projects);
  }

  async findByStatus(status: string) {
    return this.findAll(eq(projects.status, status));
    // Automatically scoped to current tenant
  }
}
```

### PostgreSQL Row-Level Security (Database Layer)

```sql
-- Migration: enable RLS on tenant tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Force RLS even for table owners
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
```

```typescript
// Set tenant context before each query
@Injectable()
export class TenantDatabaseInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (tenantId) {
      await this.db.execute(
        sql`SET LOCAL app.current_tenant_id = ${tenantId}`,
      );
    }

    return next.handle();
  }
}
```

### Rules

- Application-layer filtering: every query must include `WHERE tenant_id = ?` — use a base repository
- Database-layer RLS: PostgreSQL enforces isolation regardless of application bugs (defense in depth)
- Use `Scope.REQUEST` for tenant repositories — they need the current request's tenant ID
- Always inject `tenantId` automatically — never rely on developers remembering to filter
- Test isolation: verify that Tenant A cannot access Tenant B's data
- Add `tenantId` column with an index on every tenant-scoped table
