---
title: Header-Based Versioning
tags: versioning, header, api-version, custom-header
---

## Header-Based Versioning

Version APIs using custom headers for clean URLs while supporting version negotiation.

### Setup

```typescript
// main.ts
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
  defaultVersion: '1',
});

// Clients send: X-API-Version: 2
// Routes stay clean: /users (no version in URL)
```

### Media Type Versioning

```typescript
// Alternative: version via Accept header
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
  defaultVersion: '1',
});

// Client sends: Accept: application/json;v=2
```

### Controller Usage

```typescript
@Controller('users')
export class UsersController {
  @Get()
  @Version('1')
  findAllV1(@Query() query: PaginationDto) {
    return this.usersService.findAllV1(query);
  }

  @Get()
  @Version('2')
  findAllV2(@Query() query: PaginationDto) {
    // V2 returns different response shape
    return this.usersService.findAllV2(query);
  }
}
```

### Version Deprecation Header

```typescript
// common/interceptors/deprecation.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  constructor(private readonly deprecatedVersions: string[]) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const version = request.headers['x-api-version'] ?? '1';

    if (this.deprecatedVersions.includes(version)) {
      response.setHeader('Sunset', 'Sat, 01 Jun 2026 00:00:00 GMT');
      response.setHeader('Deprecation', 'true');
      response.setHeader('Link', '</v2/docs>; rel="successor-version"');
    }

    return next.handle();
  }
}
```

### Rules

- Use header versioning for internal APIs — keeps URLs clean and stable
- Use media type versioning for APIs following strict REST/HATEOAS patterns
- Always set a `defaultVersion` for requests without version headers
- Add `Sunset` and `Deprecation` headers when deprecating old versions
- Document required headers clearly in API documentation
- Prefer URI versioning for public APIs — headers are less discoverable for third-party consumers
