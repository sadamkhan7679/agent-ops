---
title: Mocking Auth in Unit Tests
tags: testing, mocks, guards, unit
---

## Mocking Auth in Unit Tests

Override auth guards and inject mock users for isolated unit testing.

### Override Global Guard

```typescript
// modules/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should return users', async () => {
    const mockUsers = [{ id: '1', name: 'Alice', email: 'alice@test.com' }];
    service.findAll.mockResolvedValue({ data: mockUsers, meta: { total: 1 } });

    const result = await controller.findAll({});
    expect(result.data).toEqual(mockUsers);
  });
});
```

### Mock User Factory

```typescript
// test/factories/auth.factory.ts
import { AuthUser } from '@/common/decorators/current-user.decorator';

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'member',
    ...overrides,
  };
}

export const mockAdmin = buildAuthUser({ id: 'admin-1', role: 'admin' });
export const mockMember = buildAuthUser({ id: 'member-1', role: 'member' });
```

### Testing Service Authorization

```typescript
describe('PostsService', () => {
  it('should allow admin to delete any post', async () => {
    const post = { id: 'post-1', authorId: 'other-user', title: 'Test' };
    postsRepo.findById.mockResolvedValue(post);
    postsRepo.delete.mockResolvedValue(post);

    const result = await service.remove('post-1', mockAdmin);
    expect(postsRepo.delete).toHaveBeenCalledWith('post-1');
  });

  it('should prevent member from deleting others post', async () => {
    const post = { id: 'post-1', authorId: 'other-user', title: 'Test' };
    postsRepo.findById.mockResolvedValue(post);

    await expect(service.remove('post-1', mockMember)).rejects.toThrow(ForbiddenException);
  });
});
```

### Testing Guards Directly

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext({ user: { role: 'member' } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockExecutionContext({ user: { role: 'member' } });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

### Rules

- Use `.overrideGuard()` to bypass auth in controller unit tests — focus on business logic
- Test authorization logic in services independently with mock users
- Test guards in isolation with mock execution contexts
- Create user factories for consistent test data: `mockAdmin`, `mockMember`
- Don't mock auth in E2E tests — use real token generation instead
- Test both positive (allowed) and negative (forbidden) authorization paths
