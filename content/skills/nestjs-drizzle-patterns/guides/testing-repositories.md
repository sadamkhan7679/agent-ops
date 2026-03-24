---
title: Repository Testing Patterns
tags: testing, repositories, integration, fixtures
---

## Repository Testing Patterns

Test repositories against a real database to verify query correctness and constraint handling.

### Repository Integration Test

```typescript
// modules/users/users.repository.spec.ts
import { UsersRepository } from './users.repository';
import { setupTestDatabase, teardownTestDatabase, getTestDb } from '../../../test/helpers/test-database';
import { users } from '@/shared/database/schema';
import { DrizzleDB } from '@/shared/database/drizzle.provider';
import { sql } from 'drizzle-orm';

describe('UsersRepository (integration)', () => {
  let db: DrizzleDB;
  let repository: UsersRepository;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new UsersRepository(db);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await db.execute(sql`TRUNCATE users CASCADE`);
  });

  describe('create', () => {
    it('should insert and return the user', async () => {
      const user = await repository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw on duplicate email', async () => {
      await repository.create({
        email: 'dup@example.com',
        name: 'First',
        passwordHash: 'hashed',
      });

      await expect(
        repository.create({
          email: 'dup@example.com',
          name: 'Second',
          passwordHash: 'hashed',
        }),
      ).rejects.toThrow(); // unique constraint violation
    });
  });

  describe('findByEmail', () => {
    it('should return the user when found', async () => {
      await repository.create({
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'hashed',
      });

      const found = await repository.findByEmail('alice@example.com');

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Alice');
    });

    it('should return null when not found', async () => {
      const found = await repository.findByEmail('nobody@example.com');
      expect(found).toBeNull();
    });
  });

  describe('findPaginated', () => {
    beforeEach(async () => {
      const testUsers = Array.from({ length: 25 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        passwordHash: 'hashed',
      }));
      await db.insert(users).values(testUsers);
    });

    it('should return correct page and total', async () => {
      const result = await repository.findPaginated({ page: 2, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return partial last page', async () => {
      const result = await repository.findPaginated({ page: 3, limit: 10 });

      expect(result.data).toHaveLength(5);
    });
  });
});
```

### Test Data Factories

```typescript
// test/factories/user.factory.ts
import { NewUser } from '@/shared/database/schema';

let counter = 0;

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  counter++;
  return {
    email: `user${counter}@test.com`,
    name: `Test User ${counter}`,
    passwordHash: 'hashed_password',
    role: 'member',
    isActive: true,
    ...overrides,
  };
}

// Usage in tests
const admin = await repository.create(buildUser({ role: 'admin', email: 'admin@test.com' }));
const inactive = await repository.create(buildUser({ isActive: false }));
```

### Rules

- Repository tests are integration tests — they hit the real database, not mocks
- Truncate tables in `afterEach` to isolate tests
- Test both happy paths (found, created) and edge cases (duplicates, not found, pagination bounds)
- Use factory functions for test data — avoids repeating verbose insert objects
- Verify database constraints (unique, not null, foreign keys) are enforced correctly
- Keep repository tests focused on data access — don't test business logic here
