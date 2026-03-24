---
title: Request and Response DTOs
tags: dto, request, response, validation
---

## Request and Response DTOs

Separate request DTOs (validation) from response DTOs (serialization) for clean API contracts.

### Request DTOs

```typescript
// modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// modules/users/dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password']),
) {}
// Result: { name?: string; avatarUrl?: string }
```

### Response DTOs

```typescript
// modules/users/dto/user-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  role: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  // passwordHash is excluded by default (not listed with @Expose)
}

// Alternative: use plain mapping instead of class-transformer
export class UserResponseDto {
  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  static fromMany(users: User[]): UserResponseDto[] {
    return users.map(UserResponseDto.from);
  }
}
```

### Service Usage

```typescript
@Injectable()
export class UsersService {
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.from(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await hash(dto.password);
    const user = await this.usersRepository.create({
      ...dto,
      passwordHash,
    });
    return UserResponseDto.from(user);
  }
}
```

### Rules

- Request DTOs validate input with `class-validator` decorators
- Response DTOs control output shape — never return raw database entities
- Use `PartialType` and `OmitType` from `@nestjs/mapped-types` to derive update DTOs
- Never expose sensitive fields (passwordHash, tokens, internal IDs) in response DTOs
- Use a static `from()` method on response DTOs for explicit mapping — simpler than `class-transformer`
- Keep DTOs in the module's `dto/` directory with clear naming: `create-*.dto.ts`, `update-*.dto.ts`, `*-response.dto.ts`
