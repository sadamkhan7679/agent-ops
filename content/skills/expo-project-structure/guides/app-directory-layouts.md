---
title: Layout Patterns
tags: expo-router, layouts, navigation, stack, tabs, drawer
---

## Layout Patterns

Every route group and the root of `app/` can have a `_layout.tsx` file that defines the navigator wrapping its child routes.

### Root layout

The root `_layout.tsx` is the entry point for the entire app. Use it for global providers and the top-level navigator.

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "@/store/app/theme-provider";
import { AuthProvider } from "@/store/auth/auth-provider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="(modals)"
            options={{ presentation: "modal" }}
          />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### Tab layout

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Home, Search, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

### Stack layout for auth flow

```tsx
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: "#f8f9fa" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Create Account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset Password" }} />
    </Stack>
  );
}
```

### Drawer layout

```tsx
// app/(drawer)/_layout.tsx
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{ title: "Dashboard" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
      <Drawer.Screen name="help" options={{ title: "Help & Support" }} />
    </Drawer>
  );
}
```

### Layout rules

1. **One navigator per layout.** Do not nest navigators inside a single `_layout.tsx`.
2. **Providers go in the root layout** unless a provider is scoped to a specific group.
3. **Screen options belong in the layout**, not in the screen component. Screens can override with `useNavigation` or `<Stack.Screen>` from within, but defaults live in layouts.
4. **Keep layouts focused.** A layout file should define navigation structure and shared chrome — not business logic.

### Conditional routing

Use redirect-based auth gating in layouts:

```tsx
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/hooks/auth/use-auth.hook";

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Stack />;
}
```
