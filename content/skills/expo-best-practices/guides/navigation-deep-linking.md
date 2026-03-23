---
title: Deep Linking and Universal Links
impact: HIGH
tags: deep-linking, universal-links, url-schemes, expo-router
---

## Deep Linking and Universal Links

Deep linking lets users open specific screens from URLs, push notifications, or other apps. Without proper setup, links either fail silently or crash the app.

**Incorrect (manual URL parsing with no error handling):**

```tsx
import { Linking } from "react-native";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        const parts = url.split("/");
        // Fragile manual parsing, no validation
        navigateToScreen(parts[3], parts[4]);
      }
    });
  }, []);
}
```

**Correct (Expo Router handles deep linking automatically):**

```tsx
// app.json — configure URL scheme and universal links
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "associatedDomains": ["applinks:myapp.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [{ "scheme": "https", "host": "myapp.com", "pathPrefix": "/" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

```tsx
// app/products/[id].tsx — Expo Router maps URLs to routes automatically
// myapp://products/123 → this screen
// https://myapp.com/products/123 → this screen
import { useLocalSearchParams } from "expo-router";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id is "123" from the URL
  return <ProductDetail productId={id} />;
}
```

**Correct (handling incoming URLs with useURL):**

```tsx
import { useURL } from "expo-linking";
import { router } from "expo-router";
import { useEffect } from "react";

function DeepLinkHandler() {
  const url = useURL();

  useEffect(() => {
    if (url) {
      // Expo Router handles most cases automatically,
      // but you can intercept for custom logic
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/invite/")) {
        const code = parsed.pathname.split("/invite/")[1];
        handleInviteCode(code).then(() => {
          router.replace("/(tabs)");
        });
      }
    }
  }, [url]);

  return null;
}
```

Rules:
- Use Expo Router file-based routes — deep linking works automatically based on file structure
- Configure `scheme` in app.json for custom URL schemes (`myapp://`)
- Configure `associatedDomains` (iOS) and `intentFilters` (Android) for universal links
- Test deep links with `npx uri-scheme open myapp://products/123 --ios`
