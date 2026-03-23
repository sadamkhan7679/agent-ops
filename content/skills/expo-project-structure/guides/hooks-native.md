---
title: Native Hooks
tags: hooks, native, permissions, platform, app-state
---

## Native Hooks

`hooks/native/` holds hooks that wrap React Native and Expo platform APIs. These abstract device capabilities into reusable, typed interfaces.

### Structure

```text
hooks/
  native/
    use-permissions.hook.ts
    use-app-state.hook.ts
    use-keyboard.hook.ts
    use-network.hook.ts
    use-device-info.hook.ts
    use-haptics.hook.ts
    use-notifications.hook.ts
    use-camera.hook.ts
    use-location.hook.ts
    use-biometrics.hook.ts
```

### Example: Permissions hook

```tsx
// hooks/native/use-permissions.hook.ts
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

type PermissionType = "camera" | "mediaLibrary" | "location" | "notifications";

export function usePermission(type: PermissionType) {
  const [status, setStatus] = useState<"undetermined" | "granted" | "denied">("undetermined");

  const request = useCallback(async () => {
    let requestFn: () => Promise<{ granted: boolean; canAskAgain: boolean }>;

    switch (type) {
      case "camera":
        requestFn = ImagePicker.requestCameraPermissionsAsync;
        break;
      case "mediaLibrary":
        requestFn = ImagePicker.requestMediaLibraryPermissionsAsync;
        break;
      default:
        throw new Error(`Permission type "${type}" not implemented`);
    }

    const result = await requestFn();
    setStatus(result.granted ? "granted" : "denied");

    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        "Permission Required",
        `Please enable ${type} access in your device settings.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    }

    return result.granted;
  }, [type]);

  return { status, request, isGranted: status === "granted" };
}
```

### Example: App state hook

```tsx
// hooks/native/use-app-state.hook.ts
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousState = useRef(appState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      previousState.current = appState;
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, [appState]);

  return {
    appState,
    previousState: previousState.current,
    isActive: appState === "active",
    isBackground: appState === "background",
    cameFromBackground:
      previousState.current.match(/inactive|background/) !== null && appState === "active",
  };
}
```

### Example: Keyboard hook

```tsx
// hooks/native/use-keyboard.hook.ts
import { useEffect, useState } from "react";
import { Keyboard, Platform, type KeyboardEvent } from "react-native";

export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setIsVisible(true);
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsVisible(false);
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { isVisible, height, dismiss: Keyboard.dismiss };
}
```

### Why a separate `native/` folder

Native hooks differ from domain hooks:

- They wrap platform APIs, not business logic
- They are used across many domains
- They deal with permissions, device state, and OS-level events
- They often require cleanup (subscriptions, listeners)

Keeping them in `hooks/native/` makes it clear which hooks have platform dependencies and helps during platform-specific testing.

### Rules

1. **One capability per hook.** Do not combine camera, location, and notifications in one hook.
2. **Handle permission flows gracefully.** Always provide a path to device settings when permissions are permanently denied.
3. **Clean up subscriptions.** Every `addEventListener` needs a corresponding cleanup in the effect's return.
4. **Type the return value.** Native hooks should return typed objects, not raw API responses.
