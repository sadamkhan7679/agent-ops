---
title: AsyncStorage vs MMKV
impact: HIGH
tags: async-storage, mmkv, persistence, storage, state
---

## AsyncStorage vs MMKV

AsyncStorage is async, JSON-serialized, and slow for frequent reads. MMKV is synchronous, binary-serialized, and 30x faster — use it for anything accessed during render.

**Incorrect (AsyncStorage with JSON.parse in component):**

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Async read causes flash of default state
    AsyncStorage.getItem("settings").then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  const update = async (next: Settings) => {
    setSettings(next);
    await AsyncStorage.setItem("settings", JSON.stringify(next));
  };

  return { settings, update };
}
```

**Correct (MMKV with typed synchronous access):**

```tsx
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

// Typed storage helpers
function getItem<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (raw === undefined) return null;
  return JSON.parse(raw) as T;
}

function setItem<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  storage.delete(key);
}

// Hook with synchronous initial value — no flash
function useMMKVStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    return getItem<T>(key) ?? defaultValue;
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        setItem(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update] as const;
}
```

**Correct (MMKV as Zustand persistence layer):**

```tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}));

interface SettingsStore {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleNotifications: () => void;
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "system",
      notifications: true,
      setTheme: (theme) => set({ theme }),
      toggleNotifications: () => set((s) => ({ notifications: !s.notifications })),
    }),
    { name: "settings", storage: mmkvStorage }
  )
);
```

Rules:
- Use MMKV for anything read during render (settings, tokens, user preferences)
- Use AsyncStorage only for large, infrequently-accessed blobs
- Always provide synchronous initial values to prevent layout flash
- Wrap MMKV in typed helpers to avoid raw string keys
