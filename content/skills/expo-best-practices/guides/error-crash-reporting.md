---
title: Crash Reporting with Sentry
impact: MEDIUM
tags: sentry, crash-reporting, error-tracking, breadcrumbs
---

## Crash Reporting with Sentry

Without crash reporting, you only learn about crashes from 1-star reviews. Sentry captures native crashes, JS exceptions, and breadcrumbs for reproduction.

**Correct (Sentry setup with Expo):**

```tsx
// app/_layout.tsx
import * as Sentry from "@sentry/react-native";
import { useNavigationContainerRef } from "expo-router";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
  attachStacktrace: true,
  environment: __DEV__ ? "development" : "production",
});

export default Sentry.wrap(function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  return (
    <Sentry.TouchEventBoundary>
      <Stack />
    </Sentry.TouchEventBoundary>
  );
});
```

**Correct (error boundary with Sentry reporting):**

```tsx
import * as Sentry from "@sentry/react-native";
import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  error: Error | null;
}

class CrashBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === "function"
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

**Correct (breadcrumbs for context):**

```tsx
import * as Sentry from "@sentry/react-native";

function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({ category, message, data, level: "info" });
}

// Usage in API calls
async function fetchProducts(categoryId: string) {
  addBreadcrumb("api", "Fetching products", { categoryId });
  const res = await fetch(`/api/products?category=${categoryId}`);
  addBreadcrumb("api", `Products response: ${res.status}`, { categoryId });
  return res.json();
}
```

Rules:
- Initialize Sentry in root layout before any rendering
- Wrap root component with `Sentry.wrap` for automatic native crash capture
- Use error boundaries with Sentry reporting for React component crashes
- Add breadcrumbs for API calls, navigation, and user actions
- Set `tracesSampleRate` low in production (0.1-0.2) to control costs
