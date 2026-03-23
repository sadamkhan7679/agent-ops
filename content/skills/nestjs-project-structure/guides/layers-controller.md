---
title: Controller Layer Boundaries
tags: layers, controller, http, routing
---

## Controller Layer Boundaries

Controllers handle HTTP concerns only: routing, request parsing, response formatting, and status codes. No business logic.

### What belongs in controllers

- Route definitions (`@Get`, `@Post`, `@Put`, `@Delete`)
- Parameter extraction (`@Param`, `@Query`, `@Body`)
- Response status codes (`@HttpCode`)
- OpenAPI decorators (`@ApiTags`, `@ApiResponse`)
- Calling the service and returning the result

### What does NOT belong in controllers

- Database queries
- Business validation rules
- Authorization logic (use guards)
- Error message formatting (use exception filters)
- Data transformation (use interceptors or DTOs)

### Example

```typescript
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOneOrFail(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: User): Promise<UserResponseDto> {
    return this.usersService.create(dto, actor);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
```

Each method is 1-3 lines: extract params, call service, return. If a controller method is more than 5 lines, logic probably belongs in the service.
