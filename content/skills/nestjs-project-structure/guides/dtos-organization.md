---
title: DTO Organization and Validation
tags: dtos, validation, class-validator, request, response
---

## DTO Organization and Validation

DTOs validate input and shape output. Separate request DTOs (validation) from response DTOs (serialization) to prevent leaking internal fields.

### File Placement

```text
modules/users/dto/
  create-user.dto.ts        # POST body validation
  update-user.dto.ts        # PATCH body (partial of create)
  user-query.dto.ts         # GET query params
  user-response.dto.ts      # Response serialization
```

### Request DTO

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: ['user', 'admin'] })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: 'user' | 'admin';
}
```

### Update DTO (Partial)

```typescript
// dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// All fields optional, email excluded from updates
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email'])) {}
```

### Response DTO

```typescript
// dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() name: string;
  @Expose() role: string;
  @Expose() createdAt: Date;

  @Exclude() password: never;   // Never exposed
  @Exclude() deletedAt: never;

  static fromEntity(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.name = entity.name;
    dto.role = entity.role;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
```

Rules:
- One DTO per operation (create, update, query, response)
- Use `PartialType` and `OmitType` to derive update DTOs
- Never reuse request DTOs as response DTOs
- Response DTOs must explicitly exclude sensitive fields
- Place DTOs in `dto/` within the module, not in a global `dtos/` folder
