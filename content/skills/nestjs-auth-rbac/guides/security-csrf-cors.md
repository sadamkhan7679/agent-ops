---
title: CSRF and CORS Configuration
tags: security, csrf, cors, headers
---

## CSRF and CORS Configuration

Configure CORS and CSRF protection for secure cross-origin communication.

### CORS Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string[]>('app.corsOrigins'),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Tenant-Id'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,       // required for cookies
    maxAge: 86400,           // preflight cache: 24 hours
  });

  await app.listen(3000);
}
```

### CSRF Protection (for Cookie-Based Auth)

```typescript
// modules/auth/csrf.service.ts
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class CsrfService {
  constructor(private readonly config: ConfigService) {}

  generateToken(sessionId: string): string {
    const secret = this.config.get('csrf.secret');
    const salt = randomBytes(16).toString('hex');
    const hmac = createHmac('sha256', secret)
      .update(`${sessionId}:${salt}`)
      .digest('hex');
    return `${salt}:${hmac}`;
  }

  validateToken(token: string, sessionId: string): boolean {
    const secret = this.config.get('csrf.secret');
    const [salt, hmac] = token.split(':');
    if (!salt || !hmac) return false;

    const expected = createHmac('sha256', secret)
      .update(`${sessionId}:${salt}`)
      .digest('hex');
    return hmac === expected;
  }
}

// CSRF Guard
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfService: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;

    // Skip for Bearer token auth (not vulnerable to CSRF)
    if (request.headers.authorization?.startsWith('Bearer ')) return true;

    const token = request.headers['x-csrf-token'];
    const sessionId = request.session?.id;

    if (!token || !sessionId) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!this.csrfService.validateToken(token, sessionId)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
```

### Security Headers

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // may break some third-party integrations
}));
```

### CSRF Token Endpoint

```typescript
@Controller('auth')
export class AuthController {
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    const token = this.csrfService.generateToken(req.session.id);
    return { csrfToken: token };
  }
}
```

### Rules

- CORS: whitelist specific origins — never use `origin: '*'` with `credentials: true`
- CORS: set `credentials: true` only when using cookie-based auth
- CSRF protection is needed for cookie-based auth — not for Bearer token auth (tokens aren't auto-sent)
- Use `helmet` middleware for security headers (CSP, X-Frame-Options, HSTS)
- Include `X-CSRF-Token` in `allowedHeaders` when using CSRF protection
- Skip CSRF validation for GET/HEAD/OPTIONS — they should be safe (no side effects)
