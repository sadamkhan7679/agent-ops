---
title: Unit Test File Organization
tags: testing, unit, jest, structure
---

## Unit Test File Organization

Unit tests live next to the source file they test. Every service, controller, and repository should have a `.spec.ts` file.

### File Placement

```text
modules/
  users/
    users.controller.ts
    users.controller.spec.ts      # ← next to source
    users.service.ts
    users.service.spec.ts
    users.repository.ts
    users.repository.spec.ts
    dto/
      create-user.dto.ts
      create-user.dto.spec.ts     # ← validate DTO decorators
```

### Service Test Structure

```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test' };
      repository.findById.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Controller Test Structure

```typescript
// users.controller.spec.ts
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
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should delegate to service and return result', async () => {
    const dto = { email: 'test@example.com', name: 'Test' };
    const created = { id: '1', ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(result).toEqual(created);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
```

### Rules

- Place `.spec.ts` files next to the source file — not in a separate `test/` directory
- Mock only direct dependencies — use `jest.Mocked<T>` for type-safe mocks
- Test behavior, not implementation — assert on return values and thrown exceptions
- One `describe` block per method, `it` blocks for each scenario
- Controller tests should be thin — verify delegation to service, not business logic
- Use `Test.createTestingModule` to leverage NestJS DI in tests
