---
title: Native API Hooks with Cleanup
impact: MEDIUM-HIGH
tags: hooks, camera, location, native-apis, cleanup
---

## Native API Hooks with Cleanup

Native APIs (camera, location, sensors) require subscriptions that must be cleaned up on unmount. Forgetting cleanup leaks native resources, drains battery, and eventually crashes the app.

**Correct (useLocation with loading, error, and cleanup):**

```tsx
import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface UseLocationResult {
  location: Location.LocationObject | null;
  error: string | null;
  isLoading: boolean;
}

function useLocation(options?: { watch?: boolean }): UseLocationResult {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let mounted = true;

    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (mounted) {
          setError("Location permission denied");
          setIsLoading(false);
        }
        return;
      }

      if (options?.watch) {
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
          (loc) => {
            if (mounted) {
              setLocation(loc);
              setIsLoading(false);
            }
          }
        );
      } else {
        const loc = await Location.getCurrentPositionAsync({});
        if (mounted) {
          setLocation(loc);
          setIsLoading(false);
        }
      }
    }

    init().catch((err) => {
      if (mounted) {
        setError(err instanceof Error ? err.message : "Location error");
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [options?.watch]);

  return { location, error, isLoading };
}
```

**Correct (useCamera with ref and permissions):**

```tsx
import { useRef, useState, useCallback } from "react";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";

function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = useCallback(async (): Promise<CameraCapturedPicture | null> => {
    if (!cameraRef.current || isCapturing) return null;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      return photo ?? null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    cameraRef,
    permission,
    requestPermission,
    takePicture,
    isCapturing,
  };
}
```

Rules:
- Always check and request permissions before accessing native APIs
- Use a `mounted` flag to prevent state updates after unmount
- Return cleanup functions from useEffect for every subscription
- Expose loading and error states alongside the data
- Use refs for imperative native APIs (camera, audio)
