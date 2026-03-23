---
title: Permission Request Patterns
impact: MEDIUM-HIGH
tags: permissions, camera, location, notifications, rationale
---

## Permission Request Patterns

Mobile permissions require explaining why you need access before prompting. A cold permission request with no context has significantly lower grant rates.

**Incorrect (requesting permission with no context):**

```tsx
function CameraScreen() {
  useEffect(() => {
    // Cold request — user sees system dialog with no explanation
    Camera.requestCameraPermissionsAsync();
  }, []);
}
```

**Correct (pre-prompt rationale then system dialog):**

```tsx
import { useState, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Camera from "expo-camera";

type PermissionStatus = "undetermined" | "granted" | "denied";

function usePermission(config: {
  check: () => Promise<{ status: string }>;
  request: () => Promise<{ status: string }>;
  rationale: { title: string; message: string };
}) {
  const [status, setStatus] = useState<PermissionStatus>("undetermined");

  const checkPermission = useCallback(async () => {
    const result = await config.check();
    const mapped = result.status === "granted" ? "granted" : result.status === "denied" ? "denied" : "undetermined";
    setStatus(mapped);
    return mapped;
  }, [config]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const current = await config.check();

    if (current.status === "granted") {
      setStatus("granted");
      return true;
    }

    // Show rationale before system prompt
    return new Promise((resolve) => {
      Alert.alert(config.rationale.title, config.rationale.message, [
        { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Continue",
          onPress: async () => {
            const result = await config.request();
            if (result.status === "granted") {
              setStatus("granted");
              resolve(true);
            } else {
              setStatus("denied");
              // On iOS, after denial, must open Settings
              Alert.alert(
                "Permission Required",
                "Please enable this permission in Settings.",
                [
                  { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      Linking.openSettings();
                      resolve(false);
                    },
                  },
                ]
              );
            }
          },
        },
      ]);
    });
  }, [config]);

  return { status, checkPermission, requestPermission };
}

// Usage
function ScannerScreen() {
  const camera = usePermission({
    check: Camera.getCameraPermissionsAsync,
    request: Camera.requestCameraPermissionsAsync,
    rationale: {
      title: "Camera Access Needed",
      message: "We need camera access to scan barcodes and QR codes.",
    },
  });

  if (camera.status !== "granted") {
    return (
      <View style={styles.center}>
        <Text>Camera access is required to scan items.</Text>
        <Button title="Grant Access" onPress={camera.requestPermission} />
      </View>
    );
  }

  return <CameraView style={styles.camera} />;
}
```

Rules:
- Always show a rationale dialog before the system permission prompt
- Handle the "denied" state by offering to open Settings
- Check permission status on mount, don't assume it's unchanged
- On iOS, permissions can only be requested once — after denial, redirect to Settings
- Group related permissions (camera + microphone for video) in a single flow
