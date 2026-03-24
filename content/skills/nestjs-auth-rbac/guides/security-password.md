---
title: Password Hashing and Validation
tags: security, password, argon2, hashing
---

## Password Hashing and Validation

Securely hash and validate passwords using argon2.

### Password Utility

```typescript
// common/utils/password.util.ts
import { hash, verify, Options } from 'argon2';

const ARGON2_OPTIONS: Options & { raw?: false } = {
  type: 2,          // argon2id (recommended)
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}
```

### Password Validation DTO

```typescript
// common/dto/password.dto.ts
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class PasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
  newPassword: string;
}
```

### Password Change Service

```typescript
@Injectable()
export class AuthService {
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException();

    const isValid = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent reuse of current password
    const isSame = await verifyPassword(user.passwordHash, dto.newPassword);
    if (isSame) {
      throw new BadRequestException('New password must be different from current');
    }

    const newHash = await hashPassword(dto.newPassword);
    await this.usersRepo.update(userId, { passwordHash: newHash });

    // Revoke all sessions/refresh tokens after password change
    await this.refreshTokenService.revokeAllForUser(userId);

    return { message: 'Password changed successfully' };
  }
}
```

### Rules

- Use `argon2id` (type 2) — resistant to both GPU and side-channel attacks
- Set memory cost to at least 64MB and time cost to at least 3 iterations
- Never store passwords in plain text, MD5, SHA-256, or unsalted hashes
- Cap password length at 128 characters — argon2 is intentionally slow on long inputs
- Revoke all sessions after password change — prevents stolen tokens from remaining valid
- Return generic "Invalid credentials" on login failure — don't reveal whether email or password was wrong
