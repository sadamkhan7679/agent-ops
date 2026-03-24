---
title: OpenAPI/Swagger Decorators
tags: openapi, swagger, documentation, decorators
---

## OpenAPI/Swagger Decorators

Auto-generate API documentation using NestJS Swagger decorators.

### Setup

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('My API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('users', 'User management')
      .addTag('auth', 'Authentication')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(3000);
}
```

### Controller Decorators

```typescript
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated user list', type: PaginatedUserResponse })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

### DTO Decorators

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Str0ng!Pass', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
```

### Swagger CLI Plugin (Auto-inference)

```json
// nest-cli.json — auto-generate ApiProperty from class-validator decorators
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

### Rules

- Use the Swagger CLI plugin to auto-infer `@ApiProperty` from class-validator decorators
- Add `@ApiTags` to every controller for organized documentation
- Document all response codes with `@ApiResponse` — especially error codes
- Use `@ApiBearerAuth()` on authenticated controllers
- Only enable Swagger in development — disable in production for security
- Import `PartialType`, `OmitType` from `@nestjs/swagger` (not `@nestjs/mapped-types`) when using Swagger
