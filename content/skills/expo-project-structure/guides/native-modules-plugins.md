---
title: Native Module Wrappers
tags: native, modules, wrappers, expo-packages
---

## Native Module Wrappers

When using native modules (Expo packages or community libraries), wrap them in service or hook abstractions. This isolates platform dependencies and makes testing easier.

### Structure

```text
services/
  app/
    camera.service.ts
    notifications.service.ts
    sharing.service.ts
hooks/
  native/
    use-camera.hook.ts
    use-location.hook.ts
    use-notifications.hook.ts
lib/
  native/
    haptics.lib.ts
    linking.lib.ts
```

### Example: Camera service wrapper

```tsx
// services/app/camera.service.ts
import * as ImagePicker from "expo-image-picker";

export type CapturedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
};

export async function takePhoto(): Promise<CapturedImage | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

export async function pickImage(): Promise<CapturedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}
```

### Example: Camera hook using the service

```tsx
// hooks/native/use-camera.hook.ts
import { useState, useCallback } from "react";
import { usePermission } from "./use-permissions.hook";
import { takePhoto, pickImage, type CapturedImage } from "@/services/app/camera.service";

export function useCamera() {
  const permission = usePermission("camera");
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    setError(null);
    const granted = await permission.request();
    if (!granted) {
      setError("Camera permission is required.");
      return;
    }

    try {
      const result = await takePhoto();
      if (result) setPhoto(result);
    } catch {
      setError("Failed to capture photo.");
    }
  }, [permission]);

  const pick = useCallback(async () => {
    setError(null);
    try {
      const result = await pickImage();
      if (result) setPhoto(result);
    } catch {
      setError("Failed to pick image.");
    }
  }, []);

  return { photo, capture, pick, error, clearPhoto: () => setPhoto(null) };
}
```

### Example: Notifications service

```tsx
// services/app/notifications.service.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
```

### Why wrap native modules

1. **Testability.** Mock `camera.service.ts` instead of mocking `expo-image-picker` internals.
2. **API stability.** When Expo updates a package API, you update one wrapper — not every consumer.
3. **Type safety.** Return your own typed domain objects instead of raw SDK types.
4. **Permission handling.** Centralize permission flows so every consumer handles denial consistently.
5. **Platform abstraction.** Hide iOS vs Android differences behind a single interface.

### Choosing service vs hook vs lib

| Wrapper type | Use when |
|-------------|----------|
| Service (`services/`) | The module performs async operations, has side effects, or communicates externally |
| Hook (`hooks/native/`) | The wrapper manages React state, subscriptions, or lifecycle |
| Lib (`lib/native/`) | The wrapper is a pure synchronous utility (e.g., haptics trigger, linking helper) |

### Rules

1. **One module, one wrapper.** Do not combine camera and location in a single service.
2. **Return domain types, not SDK types.** Consumers should not import from `expo-image-picker` or `expo-notifications` directly.
3. **Handle errors in the wrapper.** Return `null` or throw typed errors — do not let raw SDK exceptions propagate.
4. **Keep wrappers thin.** They should delegate, not add business logic.
