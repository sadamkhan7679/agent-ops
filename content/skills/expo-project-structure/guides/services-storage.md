---
title: Storage Services
tags: services, storage, mmkv, async-storage, secure-store
---

## Storage Services

`services/<domain>/` or `services/app/` holds storage abstractions. Mobile apps use multiple storage backends — MMKV for fast sync access, AsyncStorage for simple key-value persistence, and SecureStore for sensitive data.

### Structure

```text
services/
  app/
    storage.service.ts          # Unified storage interface
    secure-storage.service.ts   # Expo SecureStore wrapper
  auth/
    auth-storage.service.ts     # Token persistence
  preferences/
    preferences-storage.service.ts
```

### Example: MMKV storage service

```tsx
// services/app/storage.service.ts
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const StorageService = {
  getString(key: string): string | undefined {
    return storage.getString(key);
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
  getObject<T>(key: string): T | undefined {
    const json = storage.getString(key);
    if (!json) return undefined;
    try { return JSON.parse(json) as T; }
    catch { return undefined; }
  },
  setObject<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
  delete(key: string): void {
    storage.delete(key);
  },
  clearAll(): void {
    storage.clearAll();
  },
};
```

### Example: Secure storage service

```tsx
// services/app/secure-storage.service.ts
import * as SecureStore from "expo-secure-store";

export const SecureStorageService = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
```

### Example: Domain storage service

```tsx
// services/auth/auth-storage.service.ts
import { SecureStorageService } from "@/services/app/secure-storage.service";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export const AuthStorageService = {
  async getToken(): Promise<string | null> {
    return SecureStorageService.get(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await SecureStorageService.set(TOKEN_KEY, token);
  },
  async clearTokens(): Promise<void> {
    await SecureStorageService.delete(TOKEN_KEY);
    await SecureStorageService.delete(REFRESH_TOKEN_KEY);
  },
};
```

### Choosing a storage backend

| Backend | Use case | Sync/Async | Encrypted |
|---------|----------|------------|-----------|
| MMKV | App preferences, cache, feature flags | Sync | Optional |
| AsyncStorage | Legacy compatibility, simple key-value | Async | No |
| SecureStore | Tokens, credentials, sensitive PII | Async | Yes |
| SQLite (expo-sqlite) | Structured relational data | Async | No |

### Rules

1. **Never access storage directly from components.** Always go through a service.
2. **Use SecureStore for tokens and credentials.** MMKV and AsyncStorage are not encrypted by default.
3. **Type your storage keys.** Use an enum or constants file to prevent key typos.
4. **Domain services wrap app-level services.** `auth-storage.service.ts` uses `SecureStorageService`, not `SecureStore` directly.
5. **Handle missing values gracefully.** Storage reads can return `undefined` or `null`.
