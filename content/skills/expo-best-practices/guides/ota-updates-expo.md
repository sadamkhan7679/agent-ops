---
title: EAS Update Configuration
impact: MEDIUM
tags: eas-update, ota, expo-updates, channels, rollback
---

## EAS Update Configuration

EAS Update delivers JavaScript bundle updates without app store review. Proper channel configuration and update checking prevent broken deployments.

**Correct (app.config.ts with update channels):**

```tsx
// app.config.ts
import { type ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MyApp",
  slug: "my-app",
  version: "1.0.0",
  runtimeVersion: {
    policy: "appVersion", // Ties OTA updates to native binary version
  },
  updates: {
    url: "https://u.expo.dev/your-project-id",
    fallbackToCacheTimeout: 0, // Don't block launch waiting for updates
  },
  extra: {
    eas: { projectId: "your-project-id" },
  },
};

export default config;
```

**Correct (check for updates on app launch):**

```tsx
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert } from "react-native";

function useOTAUpdates() {
  useEffect(() => {
    if (__DEV__) return; // Skip in development

    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();

          Alert.alert(
            "Update Available",
            "A new version has been downloaded. Restart to apply?",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Restart",
                onPress: () => Updates.reloadAsync(),
              },
            ]
          );
        }
      } catch (error) {
        // Silent fail — don't block the app for update failures
        console.warn("OTA update check failed:", error);
      }
    }

    checkForUpdates();
  }, []);
}

// Usage in root layout
export default function RootLayout() {
  useOTAUpdates();
  return <Stack />;
}
```

**Publishing updates by channel:**

```bash
# Preview channel — for internal testing
eas update --branch preview --message "Fix login bug"

# Production channel — for all users
eas update --branch production --message "Fix login bug"

# Rollback — publish previous known-good bundle
eas update:rollback --branch production
```

Rules:
- Set `fallbackToCacheTimeout: 0` to never block app launch waiting for updates
- Use `runtimeVersion.policy: "appVersion"` to prevent OTA updates from breaking native code
- Check for updates after launch, not before — don't delay first render
- Always provide a "Later" option — don't force-restart the app
- Test updates on preview channel before publishing to production
- Use `eas update:rollback` immediately if a bad update ships
