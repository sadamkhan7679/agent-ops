---
title: Authentication Gate HOC
impact: MEDIUM
tags: hoc, auth, authentication, screen-wrapper, redirect
---

## Authentication Gate HOC

A HOC that wraps screens requiring authentication. Shows loading while checking auth, redirects to login if unauthenticated, renders the screen with user prop if authenticated.

### Implementation

```tsx
import { type ComponentType } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/auth/use-auth.hook";

interface WithAuthProps {
  user: User;
}

function withAuthGate<P extends WithAuthProps>(WrappedComponent: ComponentType<P>) {
  type OuterProps = Omit<P, keyof WithAuthProps>;

  function AuthGatedComponent(props: OuterProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (!user) {
      return <Redirect href="/(auth)/login" />;
    }

    return <WrappedComponent {...(props as P)} user={user} />;
  }

  AuthGatedComponent.displayName = `withAuthGate(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthGatedComponent;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
```

### Usage

```tsx
interface ProfileScreenProps extends WithAuthProps {
  showSettings?: boolean;
}

function ProfileScreen({ user, showSettings }: ProfileScreenProps) {
  return (
    <View>
      <Text>Welcome, {user.name}</Text>
      {showSettings && <SettingsPanel userId={user.id} />}
    </View>
  );
}

export default withAuthGate(ProfileScreen);
// user prop is injected automatically — consumer only passes showSettings
```

Use this pattern for screens that must be gated. For conditional UI within a screen, prefer checking auth state inline instead of using the HOC.
