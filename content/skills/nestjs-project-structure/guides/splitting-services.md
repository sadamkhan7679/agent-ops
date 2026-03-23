---
title: When to Split Services
tags: splitting, services, refactoring, single-responsibility
---

## When to Split Services

A service that does too much becomes hard to test, hard to understand, and a merge conflict magnet.

### Split Signals

```text
Split a service when:
✓ More than ~300 lines
✓ Constructor has more than 5 dependencies
✓ Methods group into distinct clusters with separate concerns
✓ Some methods are reused by other modules, others are internal
✓ Test setup requires mocking 6+ dependencies
✓ The class name needs "And" to describe what it does
```

### Before: God Service

```typescript
// BAD: users.service.ts — authentication + profile + notifications
@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly argon: ArgonService,
    private readonly mailer: MailService,
    private readonly s3: S3Service,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto) { /* hash password, create user, send welcome email */ }
  async login(dto: LoginDto) { /* verify password, generate tokens */ }
  async refreshToken(token: string) { /* validate, rotate */ }
  async updateProfile(id: string, dto: UpdateProfileDto) { /* update fields */ }
  async uploadAvatar(id: string, file: Buffer) { /* upload to S3, update URL */ }
  async changePassword(id: string, dto: ChangePasswordDto) { /* verify old, hash new */ }
  async sendPasswordReset(email: string) { /* generate token, send email */ }
  async getNotificationPreferences(id: string) { /* read from cache or DB */ }
  async updateNotificationPreferences(id: string, dto: NotifPrefsDto) { /* update, bust cache */ }
}
```

### After: Focused Services

```typescript
// GOOD: auth.service.ts — authentication only
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly argon: ArgonService,
  ) {}

  async register(dto: RegisterDto) { /* ... */ }
  async login(dto: LoginDto) { /* ... */ }
  async refreshToken(token: string) { /* ... */ }
  async changePassword(userId: string, dto: ChangePasswordDto) { /* ... */ }
  async sendPasswordReset(email: string) { /* ... */ }
}

// GOOD: users-profile.service.ts — profile management
@Injectable()
export class UsersProfileService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly s3: S3Service,
  ) {}

  async updateProfile(id: string, dto: UpdateProfileDto) { /* ... */ }
  async uploadAvatar(id: string, file: Buffer) { /* ... */ }
}

// GOOD: notification-preferences.service.ts
@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly cache: CacheService,
  ) {}

  async get(userId: string) { /* ... */ }
  async update(userId: string, dto: NotifPrefsDto) { /* ... */ }
}
```

### Extraction Strategy

```text
1. Identify clusters — group methods by which dependencies they use
2. Name the new service — if you can't find a clear name, the split may be wrong
3. Move methods — extract to new service class
4. Update the module — register new providers, update exports
5. Update dependents — other services/controllers now inject the specific service
6. Verify tests — each new service should be independently testable with fewer mocks
```

### Rules

- Split by responsibility, not by size alone — a 400-line service with one clear responsibility is fine
- Each service should be describable in one sentence without "and"
- After splitting, the original module registers all resulting services
- If a split creates a service useful to multiple modules, consider moving it to a shared module
- Constructor injection count is a smell indicator: 3-4 is healthy, 6+ warrants review
- Prefer composition over inheritance — services call each other, don't extend each other
