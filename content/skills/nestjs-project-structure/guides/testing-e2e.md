---
title: E2E Test Organization
tags: testing, e2e, integration, supertest
---

## E2E Test Organization

E2E tests live in a top-level `test/` directory and test full HTTP request/response cycles against a running application.

### File Structure

```text
test/
  jest-e2e.json               # E2E-specific Jest config
  setup.ts                    # Global setup (database, app bootstrap)
  teardown.ts                 # Global teardown (cleanup)
  helpers/
    test-app.helper.ts        # Shared app creation
    auth.helper.ts            # Token generation for authenticated requests
    database.helper.ts        # Seed/reset database
  users/
    users.e2e-spec.ts         # Users endpoint tests
    users.fixtures.ts         # Test data factories
  auth/
    auth.e2e-spec.ts
    auth.fixtures.ts
```

### Test App Helper

```typescript
// test/helpers/test-app.helper.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply the same pipes/interceptors as production
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  return app;
}
```

### E2E Test Structure

```typescript
// test/users/users.e2e-spec.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, seedUsers } from '../helpers/database.helper';
import { getAuthToken } from '../helpers/auth.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase();
    await seedUsers();
    authToken = await getAuthToken(app, 'admin@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(10);
          expect(res.body.meta.total).toBeDefined();
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('POST /users', () => {
    it('should create a user and return 201', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'new@example.com', name: 'New User', password: 'Str0ng!Pass' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('new@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'not-an-email', name: 'Bad' })
        .expect(400);
    });
  });
});
```

### Rules

- E2E tests go in `test/` at the project root — separate from unit tests
- Mirror the module structure inside `test/` (e.g., `test/users/`, `test/auth/`)
- Use a real database (test instance) — don't mock at the E2E level
- Apply the same global pipes, interceptors, and guards as production
- Reset database state in `beforeAll` or `beforeEach` — tests must not depend on order
- Keep fixture/helper files in `test/helpers/` for reuse across test suites
