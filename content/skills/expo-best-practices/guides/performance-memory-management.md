---
title: Memory Leak Prevention
impact: CRITICAL
tags: memory, cleanup, subscriptions, useEffect, performance
---

## Memory Leak Prevention

Memory leaks in React Native cause gradual performance degradation, eventual crashes, and poor user experience. Every subscription, listener, and timer must be cleaned up.

**Incorrect (no cleanup — leaks on unmount):**

```tsx
function LocationTracker() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      (loc) => setLocation(loc)
    );
    // No cleanup — subscription leaks when component unmounts
  }, []);

  return <Text>{location?.coords.latitude}</Text>;
}
```

**Correct (proper cleanup for all subscription types):**

```tsx
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { AppState, type AppStateStatus } from "react-native";

function LocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startWatching() {
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );
    }

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, []);

  return <Text>{location?.coords.latitude}</Text>;
}
```

**Correct (AbortController for fetch requests):**

```tsx
function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      }
    }

    fetchProfile();

    return () => controller.abort();
  }, [userId]);

  return { profile, error };
}
```

**Correct (timer and event listener cleanup):**

```tsx
function useAppStateChange(onForeground: () => void) {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        onForeground();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [onForeground]);
}
```

Rules:
- Every `addEventListener` needs a matching `removeEventListener` or `subscription.remove()`
- Every `setTimeout`/`setInterval` needs `clearTimeout`/`clearInterval`
- Every `watchPositionAsync`, `watchHeadingAsync` etc. needs `subscription.remove()`
- Every `fetch` should use `AbortController` for cancellation
