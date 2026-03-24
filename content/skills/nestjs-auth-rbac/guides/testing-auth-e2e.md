---
title: E2E Testing Protected Endpoints
tags: testing, e2e, auth, integration
---

## E2E Testing Protected Endpoints

Test authenticated endpoints with real JWT tokens in E2E tests.

### Auth Test Helper

```typescript
// test/helpers/auth.helper.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function getAuthToken(
  app: INestApplication,
  email: string = 'admin@test.com',
  password: string = 'TestPass123!',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.data.accessToken;
}

export async function registerAndLogin(
  app: INestApplication,
  user: { email: string; name: string; password: string },
): Promise<{ token: string; userId: string }> {
  const registerRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send(user)
    .expect(201);

  return {
    token: registerRes.body.data.accessToken,
    userId: registerRes.body.data.user.id,
  };
}

// Helper for making authenticated requests
export function authRequest(app: INestApplication, token: string) {
  const server = app.getHttpServer();
  return {
    get: (url: string) => request(server).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(server).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(server).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(server).delete(url).set('Authorization', `Bearer ${token}`),
  };
}
```

### E2E Test with Authentication

```typescript
// test/users/users.e2e-spec.ts
describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase();
    await seedTestUsers();

    adminToken = await getAuthToken(app, 'admin@test.com', 'TestPass123!');
    const member = await registerAndLogin(app, {
      email: 'member@test.com',
      name: 'Member',
      password: 'TestPass123!',
    });
    memberToken = member.token;
    memberId = member.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return users for admin', () => {
      return authRequest(app, adminToken)
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should return 403 for member', () => {
      return authRequest(app, memberToken)
        .get('/users')
        .expect(403);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should allow user to update own profile', () => {
      return authRequest(app, memberToken)
        .patch(`/users/${memberId}`)
        .send({ name: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe('Updated Name');
        });
    });

    it('should prevent member from updating other users', () => {
      return authRequest(app, memberToken)
        .patch('/users/other-user-id')
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('should allow admin to update any user', () => {
      return authRequest(app, adminToken)
        .patch(`/users/${memberId}`)
        .send({ name: 'Admin Updated' })
        .expect(200);
    });
  });
});
```

### Testing Auth Flows

```typescript
describe('Auth (e2e)', () => {
  it('should register, login, and access protected route', async () => {
    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@test.com', name: 'New', password: 'TestPass123!' })
      .expect(201);

    const { accessToken } = registerRes.body.data;

    // Access protected route
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.email).toBe('new@test.com');
      });
  });

  it('should return 401 for invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' })
      .expect(401);
  });

  it('should refresh tokens', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'TestPass123!' })
      .expect(200);

    const { refreshToken } = loginRes.body.data;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
      });
  });
});
```

### Rules

- Use real token generation in E2E tests — don't mock auth at this level
- Create helper functions for common auth operations (login, register, authenticated requests)
- Test all permission levels: unauthenticated (401), unauthorized (403), and authorized (200)
- Test resource ownership: user can access own resources, can't access others'
- Test complete auth flows: register → login → access → refresh → logout
- Seed test users with known credentials in `beforeAll` — don't rely on pre-existing data
