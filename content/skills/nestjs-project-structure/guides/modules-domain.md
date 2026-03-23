---
title: Domain Module Structure
tags: modules, domain, controller, service, repository
---

## Domain Module Structure

Every domain module follows the same internal structure: module definition, controller, service, repository, DTOs, and entities.

### Standard Module Layout

```text
modules/users/
  users.module.ts           # Module definition with imports/providers/exports
  users.controller.ts       # HTTP layer — routes, params, response codes
  users.service.ts          # Business logic — validation, orchestration
  users.repository.ts       # Data access — Drizzle queries
  dto/
    create-user.dto.ts      # Request validation
    update-user.dto.ts
    user-response.dto.ts    # Response serialization
    user-query.dto.ts       # Query params validation
  entities/
    user.entity.ts          # Domain entity (if different from schema)
  users.controller.spec.ts  # Controller unit tests
  users.service.spec.ts     # Service unit tests
```

### Module Definition

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { DatabaseModule } from '@/shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Only export what other modules need
})
export class UsersModule {}
```

### Layer Flow

```text
Request → Controller → Service → Repository → Database
                         ↓
                     Validation
                     Authorization
                     Business rules
```

- **Controller**: HTTP concerns only — parsing params, calling service, returning response
- **Service**: Business logic — validation, authorization checks, orchestrating multiple repositories
- **Repository**: Data access only — Drizzle queries, no business logic

```typescript
// Controller — thin, delegates to service
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneOrFail(id);
  }
}

// Service — business logic
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOneOrFail(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserResponseDto.fromEntity(user);
  }
}

// Repository — data access
@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }
}
```
