---
title: Error Boundaries for React Native
impact: MEDIUM
tags: error-boundary, crash, fallback, recovery, native
---

## Error Boundaries for React Native

Error boundaries in React Native prevent a single component crash from taking down the entire app. Critical for isolating screen-level and widget-level failures.

**Correct (reusable error boundary with recovery):**

```tsx
import { Component, type ReactNode, type ErrorInfo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error, this.reset)
          : this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  message: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  button: { backgroundColor: "#007AFF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
```

**Correct (screen-level isolation):**

```tsx
// app/(tabs)/feed.tsx
export default function FeedScreen() {
  return (
    <View style={{ flex: 1 }}>
      <FeedHeader />
      <ErrorBoundary
        fallback={(error, reset) => (
          <View style={styles.errorCard}>
            <Text>Feed failed to load</Text>
            <Button title="Retry" onPress={reset} />
          </View>
        )}
        onError={(error) => Sentry.captureException(error)}
      >
        <FeedList />
      </ErrorBoundary>
    </View>
  );
}
```

Rules:
- Wrap independent screen sections in separate error boundaries
- Always provide a reset/retry mechanism in the fallback UI
- Report errors to crash tracking (Sentry) in `onError`
- Don't wrap the entire app in a single boundary — wrap screen sections independently
- Error boundaries don't catch errors in event handlers or async code — handle those with try/catch
