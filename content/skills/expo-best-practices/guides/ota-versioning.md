---
title: Runtime Versioning for OTA Safety
impact: MEDIUM
tags: runtime-version, native-compatibility, ota, versioning
---

## Runtime Versioning for OTA Safety

OTA updates can only change JavaScript — not native code. Pushing a JS update that references a new native module crashes the app. Runtime versioning prevents this mismatch.

**Incorrect (no runtime version — OTA can break native compatibility):**

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/project-id"
    }
  }
}
```

**Correct (runtime version tied to app version):**

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

When `version` in app.json changes (e.g., `1.0.0` → `1.1.0`), OTA updates from the old version won't apply to the new binary. This is the safest policy.

**Correct (fingerprint policy for automatic detection):**

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "fingerprint"
    }
  }
}
```

Fingerprint policy hashes all native dependencies and config. If any native dependency changes (new Expo module, updated native library), the fingerprint changes automatically, isolating old OTA updates.

**Checking compatibility before applying:**

```tsx
import * as Updates from "expo-updates";
import Constants from "expo-constants";

async function safeCheckForUpdate() {
  if (__DEV__) return;

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      // Log the runtime versions for debugging
      console.log("Current runtime:", Constants.expoConfig?.runtimeVersion);
      console.log("Update manifest:", update.manifest);

      await Updates.fetchUpdateAsync();
      // Only reload if user consents
    }
  } catch (error) {
    // Common error: runtime version mismatch
    // This is expected when native binary is out of date
    if (error instanceof Error && error.message.includes("runtime version")) {
      console.log("Native update required — OTA skipped");
      return;
    }
    console.warn("Update check failed:", error);
  }
}
```

Rules:
- Always set a `runtimeVersion` policy — never ship without one
- Use `"appVersion"` for simple projects where you control version bumps
- Use `"fingerprint"` for projects with many native dependencies
- When adding a new native module, bump the app version or rebuild to update the fingerprint
- Test OTA updates against the correct runtime version before publishing
