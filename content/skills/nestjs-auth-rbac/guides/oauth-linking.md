---
title: Account Linking
tags: oauth, linking, providers, multiple
---

## Account Linking

Allow users to connect multiple OAuth providers to a single account.

### Linking Service

```typescript
// modules/auth/account-linking.service.ts
@Injectable()
export class AccountLinkingService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async linkProvider(userId: string, provider: string, providerId: string) {
    // Check if this provider account is already linked to someone
    const existing = await this.db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerId, providerId),
      ),
    });

    if (existing && existing.userId !== userId) {
      throw new ConflictException(
        `This ${provider} account is already linked to another user`,
      );
    }

    if (existing && existing.userId === userId) {
      return; // Already linked
    }

    await this.db.insert(oauthAccounts).values({
      userId,
      provider,
      providerId,
    });
  }

  async unlinkProvider(userId: string, provider: string) {
    // Ensure user has at least one auth method remaining
    const userAccounts = await this.db.query.oauthAccounts.findMany({
      where: eq(oauthAccounts.userId, userId),
    });

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const hasPassword = !!user?.passwordHash;
    const otherProviders = userAccounts.filter((a) => a.provider !== provider);

    if (!hasPassword && otherProviders.length === 0) {
      throw new BadRequestException(
        'Cannot unlink — set a password or link another provider first',
      );
    }

    await this.db
      .delete(oauthAccounts)
      .where(and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, provider),
      ));
  }

  async getLinkedProviders(userId: string) {
    const accounts = await this.db.query.oauthAccounts.findMany({
      where: eq(oauthAccounts.userId, userId),
      columns: { provider: true, createdAt: true },
    });

    return accounts;
  }
}
```

### Controller

```typescript
@Controller('auth/providers')
export class ProvidersController {
  @Get()
  getLinkedProviders(@CurrentUser('id') userId: string) {
    return this.linkingService.getLinkedProviders(userId);
  }

  // Initiate linking flow (user must be authenticated)
  @Get('google/link')
  @UseGuards(AuthGuard('google'))
  linkGoogle() {}

  @Get('google/link/callback')
  @UseGuards(AuthGuard('google'))
  async googleLinkCallback(@CurrentUser('id') userId: string, @Req() req: Request) {
    await this.linkingService.linkProvider(userId, 'google', req.user.providerId);
    return { message: 'Google account linked' };
  }

  @Delete(':provider')
  unlinkProvider(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: string,
  ) {
    return this.linkingService.unlinkProvider(userId, provider);
  }
}
```

### Rules

- Prevent linking a provider account that's already linked to a different user
- Prevent unlinking the last auth method — user must have a password or another provider
- Linking requires an authenticated session — user initiates it from their settings
- Keep the OAuth accounts table separate from users — clean separation of concerns
- Return linked providers in the user profile API for the frontend settings UI
- Handle the edge case where a user tries to link the same provider twice (idempotent)
