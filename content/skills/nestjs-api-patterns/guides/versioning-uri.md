---
title: URI Versioning
tags: versioning, uri, api-version, routes
---

## URI Versioning

Version APIs via URI prefix for clear, explicit version separation.

### Setup

```typescript
// main.ts
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
  prefix: 'v',
});

// Routes become: /v1/users, /v2/users
```

### Controller Versioning

```typescript
// modules/users/users-v1.controller.ts
@Controller('users')
@Version('1')
export class UsersV1Controller {
  @Get()
  findAll() {
    // Returns flat user object
    return this.usersService.findAllV1();
  }
}

// modules/users/users-v2.controller.ts
@Controller('users')
@Version('2')
export class UsersV2Controller {
  @Get()
  findAll() {
    // Returns user with nested profile
    return this.usersService.findAllV2();
  }
}
```

### Route-Level Versioning

```typescript
@Controller('users')
export class UsersController {
  // Available at /v1/users AND /v2/users
  @Get()
  @Version(['1', '2'])
  findAll() {
    return this.usersService.findAll();
  }

  // Only available at /v2/users/search
  @Get('search')
  @Version('2')
  search(@Query() query: SearchDto) {
    return this.usersService.search(query);
  }
}
```

### Version-Neutral Routes

```typescript
// Health check available at all versions
@Controller('health')
@Version(VERSION_NEUTRAL)
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### Rules

- Use URI versioning (`/v1/`, `/v2/`) for public APIs — most explicit and discoverable
- Set `defaultVersion: '1'` so unversioned routes map to v1
- Version at the controller level when most routes change between versions
- Version at the route level when only specific endpoints change
- Use `VERSION_NEUTRAL` for routes that don't change between versions (health, docs)
- Keep old versions working until clients migrate — deprecate with response headers before removing
