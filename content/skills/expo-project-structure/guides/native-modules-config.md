---
title: Native Config & Plugins
tags: native, config, plugins, app-config, eas
---

## Native Config & Plugins

Expo managed workflow uses `app.config.ts` and config plugins to modify native project files without ejecting. Keeping configuration organized prevents build-time surprises.

### Configuration file structure

```text
app.config.ts               # Main Expo config (dynamic)
app.json                    # Static Expo config (optional, can coexist)
eas.json                    # EAS Build and Submit config
plugins/
  with-camera-config.plugin.js
  with-splash-screen.plugin.js
  with-deep-linking.plugin.js
```

### app.config.ts

Use `app.config.ts` over `app.json` when you need dynamic values (environment variables, conditional config):

```tsx
// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyApp",
  slug: "my-app",
  version: "1.0.0",
  scheme: "myapp",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    bundleIdentifier: "com.example.myapp",
    supportsTablet: true,
  },
  android: {
    package: "com.example.myapp",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    ["expo-camera", { cameraPermission: "Allow $(PRODUCT_NAME) to access your camera." }],
    ["expo-location", { locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location." }],
    "./plugins/with-deep-linking.plugin.js",
  ],
  extra: {
    apiUrl: process.env.API_URL ?? "https://api.example.com",
    eas: {
      projectId: "your-project-id",
    },
  },
});
```

### Custom config plugins

Config plugins modify native iOS and Android project files during prebuild. Place custom plugins in `plugins/`:

```js
// plugins/with-camera-config.plugin.js
const { withInfoPlist } = require("expo/config-plugins");

module.exports = function withCameraConfig(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      config.modResults.NSCameraUsageDescription ||
      "This app uses the camera to scan barcodes.";
    return config;
  });
};
```

### eas.json

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "API_URL": "https://dev-api.example.com" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "API_URL": "https://staging-api.example.com" }
    },
    "production": {
      "env": { "API_URL": "https://api.example.com" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Environment variables

Access environment variables through `app.config.ts` using `extra`:

```tsx
import Constants from "expo-constants";

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

For build-time secrets, use EAS Secrets:

```bash
eas secret:create --name API_SECRET --value "supersecret" --scope project
```

### Config organization rules

1. **One source of truth.** Use `app.config.ts` as the primary config. If `app.json` exists, let `app.config.ts` extend it.
2. **Custom plugins in `plugins/`.** Do not inline complex native modifications in `app.config.ts`.
3. **Environment-specific config in `eas.json`.** Keep dev/staging/production differences in EAS build profiles.
4. **Never commit secrets.** Use EAS Secrets or `.env` files excluded from version control.
5. **Document permission strings.** Every native permission should have a clear, user-facing description.
