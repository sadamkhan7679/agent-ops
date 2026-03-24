---
title: Partial Update DTOs
tags: dto, partial, patch, mapped-types
---

## Partial Update DTOs

Use NestJS mapped types to derive update DTOs from create DTOs without duplication.

### PartialType

```typescript
// dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// All fields from CreateUserDto become optional
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### Combining Mapped Types

```typescript
import { PartialType, OmitType, PickType, IntersectionType } from '@nestjs/mapped-types';

// Omit fields that shouldn't be updatable, then make the rest optional
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {}
// Result: { name?: string; avatarUrl?: string }

// Pick specific updatable fields
export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, ['name', 'avatarUrl'] as const),
) {}

// Combine two DTOs
export class CreateTeamMemberDto extends IntersectionType(
  PickType(CreateUserDto, ['email', 'name'] as const),
  CreateTeamRoleDto,
) {}
```

### Handling Partial Updates in Service

```typescript
@Injectable()
export class UsersService {
  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    // dto only contains fields the client sent
    // Empty objects are valid (no-op update)
    if (Object.keys(dto).length === 0) {
      return this.findById(id);
    }

    const updated = await this.usersRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.from(updated);
  }
}
```

### Handling Nullable Fields

```typescript
// Allow setting a field to null explicitly
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  // Allow null to clear the avatar
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  avatarUrl?: string | null;
}
```

### Rules

- Use `PartialType` for standard PATCH update DTOs — inherits all validators as optional
- Use `OmitType` to exclude immutable fields (email, id) from update DTOs
- Import from `@nestjs/mapped-types` (not `@nestjs/swagger`) unless using Swagger
- If using Swagger, import from `@nestjs/swagger` instead — it extends mapped-types with API metadata
- Handle empty update objects gracefully — don't error on no-op updates
- Use `@ValidateIf((_, value) => value !== null)` to allow explicit `null` for clearing fields
