---
title: App Lifecycle Hooks
impact: MEDIUM-HIGH
tags: appstate, lifecycle, background, foreground, hooks
---

## App Lifecycle Hooks

React Native apps transition between active, background, and inactive states. Detecting these transitions is critical for pausing work, refreshing data, and saving state.

**Correct (useAppState hook with proper cleanup):**

```tsx
import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";

function useAppState(callbacks: {
  onForeground?: () => void;
  onBackground?: () => void;
}) {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;

        if (prev.match(/inactive|background/) && nextState === "active") {
          callbacks.onForeground?.();
        }

        if (prev === "active" && nextState.match(/inactive|background/)) {
          callbacks.onBackground?.();
        }

        appStateRef.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [callbacks]);

  return appStateRef;
}

// Usage — refresh data on foreground, save draft on background
function EditorScreen() {
  useAppState({
    onForeground: () => {
      refreshDocument();
    },
    onBackground: () => {
      saveDraft();
    },
  });

  return <Editor />;
}
```

**Correct (useKeepAwake for preventing sleep during critical operations):**

```tsx
import { useKeepAwake } from "expo-keep-awake";

function VideoRecordingScreen() {
  // Prevents screen from sleeping while recording
  useKeepAwake();

  return <CameraView recording />;
}
```

Rules:
- Use `AppState.addEventListener` with cleanup via `subscription.remove()`
- Track previous state with a ref to detect specific transitions
- Save unsaved work on background transition
- Refresh stale data on foreground transition
- Use `useKeepAwake` for long-running operations (recording, downloads)
