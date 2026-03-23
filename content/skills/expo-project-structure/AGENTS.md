# Expo Project Structure — Complete Guide

**Version:** 1.0.0
**Stack:** Expo SDK 52+, Expo Router v4, React Native 0.76+, TypeScript 5.x

## Abstract

This document defines an opinionated architecture for Expo + React Native + TypeScript projects. It covers folder structure, component organization, naming conventions, navigation patterns, state management, service layers, and splitting guidelines. The default approach is layer-first with domain folders, adapted for mobile constraints including navigation coupling, native module dependencies, and offline support.

## Table of Contents

1. [Architecture: Layer-First](#1-architecture-layer-first)
2. [Architecture: Feature Boundaries](#2-architecture-feature-boundaries)
3. [App Directory: Expo Router](#3-app-directory-expo-router)
4. [App Directory: Layouts](#4-app-directory-layouts)
5. [Components: UI Primitives](#5-components-ui-primitives)
6. [Components: Shared](#6-components-shared)
7. [Components: Domain](#7-components-domain)
8. [Components: Screen Sections](#8-components-screen-sections)
9. [Hooks: Domain](#9-hooks-domain)
10. [Hooks: Native](#10-hooks-native)
11. [Services: API](#11-services-api)
12. [Services: Storage](#12-services-storage)
13. [Store: Global vs Local State](#13-store-global-vs-local-state)
14. [Store: Offline Sync](#14-store-offline-sync)
15. [Navigation: File-Based Routing](#15-navigation-file-based-routing)
16. [Navigation: Type-Safe](#16-navigation-type-safe)
17. [Naming Conventions](#17-naming-conventions)
18. [Naming: Suffix Reference](#18-naming-suffix-reference)
19. [Splitting: Screens](#19-splitting-screens)
20. [Splitting: Components](#20-splitting-components)
21. [Native Modules: Config & Plugins](#21-native-modules-config--plugins)
22. [Native Modules: Wrappers](#22-native-modules-wrappers)
23. [Complete Structure Reference](#23-complete-structure-reference)
24. [Placement Rules](#24-placement-rules)
25. [Anti-Patterns](#25-anti-patterns)
26. [Decision Checklist](#26-decision-checklist)

---

## 1. Architecture: Layer-First

Organize an Expo project by **responsibility first** and **domain second**. Each top-level folder represents a technical layer. Inside each layer, domain folders group related files.

### Why layer-first for mobile

Mobile apps have tighter coupling between navigation, native APIs, and platform behavior. Layer-first keeps these concerns separated so a change to navigation does not ripple into business logic, and a change to a native module does not force UI edits.

### The default structure

```text
app/                    # Expo Router file-based routes
components/
  ui/                   # Primitives: Button, Input, Card
  shared/               # Cross-domain composites
  screens/              # Screen composition sections
  <domain>/             # Domain-owned components
hooks/
  <domain>/
  native/               # Platform-specific hooks
services/
  <domain>/
  app/                  # Shared services
store/
  <domain>/
  app/                  # App-wide state
constants/
  <domain>/
types/
  <domain>/
lib/
  <concern>/
assets/
  images/
  fonts/
plugins/                # Expo config plugins
```

### Layer responsibilities

| Layer | Owns | Does not own |
|-------|------|-------------|
| `app/` | Routes, layouts, route-level composition | Business logic, reusable UI |
| `components/` | All UI components by category | Data fetching, state management |
| `hooks/` | Stateful logic, side effects | Direct API calls (delegate to services) |
| `services/` | External communication, API clients | UI rendering, state storage |
| `store/` | Client state that spans components | API calls, UI rendering |
| `lib/` | Pure helpers, formatters, parsers | Side effects, state |

### Domain folders inside layers

Every layer except `app/` and `assets/` uses domain subfolders when files accumulate:

```text
hooks/
  auth/
    use-auth.hook.ts
    use-session.hook.ts
  profile/
    use-profile.hook.ts
  native/
    use-permissions.hook.ts
    use-app-state.hook.ts
```

### Decision flow

1. What kind of thing is this file? (component, hook, service, type, constant, helper)
2. Which domain owns it? (auth, profile, orders, app-wide)
3. Is it route-local, domain-local, shared, or global?
4. Place it in the narrowest valid scope.

If a file could live in two layers, pick the one that matches its **primary responsibility**.

---

## 2. Architecture: Feature Boundaries

Layer-first is the default. Feature folders are an alternative when a domain grows large enough that navigating across layers becomes painful.

### When to stay layer-first

- The app has fewer than 8-10 domains
- Most domains have 3-5 files per layer
- Team members work across domains regularly
- You want maximum consistency and discoverability

### When to consider feature folders

- A domain has 15+ files spread across 5+ layers
- A dedicated team owns the entire feature end-to-end
- The feature ships independently
- The feature has its own navigation stack and rarely shares components

### Feature folder structure

```text
features/
  checkout/
    components/
      checkout-summary.tsx
      checkout-item-row.tsx
    hooks/
      use-checkout.hook.ts
    services/
      checkout.service.ts
    store/
      checkout.store.ts
    types/
      checkout.types.ts
```

### Hybrid approach

Most Expo apps benefit from a hybrid: layer-first for most code, feature folders for one or two large bounded contexts.

### Rules for feature folders

1. A feature folder must be self-contained. It should not import from another feature folder.
2. Features may import from shared layers: `components/ui/`, `components/shared/`, `lib/`, `types/`, `constants/`.
3. If two features need the same code, promote it to the shared layer.
4. Feature folders still use the same naming conventions and file suffixes.

### Mobile-specific boundary concerns

- **Navigation coupling**: Screen components are tightly bound to navigator configuration. Isolating a feature means isolating its navigation stack.
- **Native module dependencies**: A feature that uses the camera or location pulls in native configuration. Bundling that configuration with the feature makes it easier to manage.
- **Bundle size**: React Native bundles everything. Feature boundaries help identify what can be lazy-loaded.
- **Platform forks**: A feature may need `.ios.tsx` and `.android.tsx` variants. Keeping these inside the feature folder prevents scattering.

---

## 3. App Directory: Expo Router

Expo Router v4 uses the `app/` directory for file-based routing. Every file in `app/` becomes a route.

### Basic conventions

```text
app/
  _layout.tsx           # Root layout (wraps all routes)
  index.tsx             # "/" — home screen
  settings.tsx          # "/settings"
  [id].tsx              # "/123" — dynamic segment
  [...missing].tsx      # Catch-all for 404
```

### Route groups

Parenthesized folders create **groups** without affecting the URL path:

```text
app/
  (tabs)/
    _layout.tsx         # Tab navigator layout
    index.tsx           # "/"
    explore.tsx         # "/explore"
    profile.tsx         # "/profile"
  (auth)/
    _layout.tsx         # Auth stack layout
    login.tsx           # "/login"
    register.tsx        # "/register"
    forgot-password.tsx # "/forgot-password"
  (modals)/
    _layout.tsx         # Modal presentation stack
    confirm.tsx         # "/confirm"
```

### Dynamic routes

```text
app/
  products/
    [id].tsx            # "/products/123"
    [id]/
      reviews.tsx       # "/products/123/reviews"
  users/
    [userId]/
      posts/
        [postId].tsx    # "/users/42/posts/7"
```

Access params with `useLocalSearchParams`:

```tsx
import { useLocalSearchParams } from "expo-router";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // ...
}
```

### What belongs in route files

Route files should:
- Compose screen sections from `components/screens/`
- Apply route-level data fetching or suspense boundaries
- Define route-specific metadata
- Wire up route params to domain hooks

Route files should **not**:
- Contain 200+ lines of inline UI markup
- Define reusable components
- Contain business logic or API calls directly

### Keep routes lean

```tsx
import { ProfileHeader } from "@/components/screens/profile-header.screen";
import { ProfileActivity } from "@/components/screens/profile-activity.screen";
import { ProfileStats } from "@/components/screens/profile-stats.screen";
import { ScreenContainer } from "@/components/ui/screen-container";

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ProfileHeader />
      <ProfileStats />
      <ProfileActivity />
    </ScreenContainer>
  );
}
```

### API routes

```text
app/
  api/
    auth+api.ts         # POST /api/auth
    users/[id]+api.ts   # GET /api/users/123
```

---

## 4. App Directory: Layouts

Every route group and the root of `app/` can have a `_layout.tsx` file that defines the navigator wrapping its child routes.

### Root layout

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
          <Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
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
    <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF", headerShown: false }}>
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
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
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
2. **Providers go in the root layout** unless scoped to a specific group.
3. **Screen options belong in the layout**, not in the screen component.
4. **Keep layouts focused.** Navigation structure and shared chrome only — not business logic.

### Conditional routing

```tsx
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/hooks/auth/use-auth.hook";

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <Stack />;
}
```

---

## 5. Components: UI Primitives

`components/ui/` holds domain-agnostic building blocks wrapping React Native core components.

### What belongs in `components/ui/`

- `button.tsx` — Wraps `Pressable` with variants, loading state, haptic feedback
- `text.tsx` — Themed `Text` with typography presets
- `input.tsx` — Styled `TextInput` with label, error, and helper text
- `card.tsx` — Surface container with shadow and border radius
- `screen-container.tsx` — Safe area wrapper with consistent padding
- `icon-button.tsx` — Circular pressable icon
- `separator.tsx` — Themed divider
- `badge.tsx` — Status/count indicator
- `avatar.tsx` — Image with fallback initials
- `skeleton.tsx` — Animated placeholder for loading states

### Example: Button primitive

```tsx
// components/ui/button.tsx
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title, onPress, variant = "primary", size = "md", loading = false, disabled = false,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base, styles[variant], styles[size],
        pressed && styles.pressed, disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#007AFF"} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </Pressable>
  );
}
```

### Example: Screen container

```tsx
// components/ui/screen-container.tsx
import { ScrollView, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenContainerProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
};

export function ScreenContainer({ children, scrollable = true, style }: ScreenContainerProps) {
  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (children);

  return <SafeAreaView style={[styles.container, style]}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
});
```

### Rules for UI primitives

1. **No domain logic.** A `Button` should never know about users or orders.
2. **Accessibility by default.** Include `accessibilityRole`, `accessibilityLabel`, and state props.
3. **Themeable.** Accept style overrides or use a theme context.
4. **Platform-aware.** Use `Platform.select` only when platform behavior genuinely differs.
5. **Tested in isolation.** UI primitives should work in Storybook or a preview screen.

---

## 6. Components: Shared

`components/shared/` holds reusable composites that serve multiple domains.

### What belongs in `components/shared/`

- `empty-state.shared.tsx` — Generic empty state with icon, title, description, action
- `loading-overlay.shared.tsx` — Full-screen or section-level loading indicator
- `error-fallback.shared.tsx` — Error boundary fallback with retry
- `list-footer-loader.shared.tsx` — Infinite scroll loading indicator
- `section-header.shared.tsx` — Reusable section title with optional action
- `confirmation-sheet.shared.tsx` — Bottom sheet for destructive actions
- `offline-banner.shared.tsx` — Network status banner

### Example: Empty state

```tsx
// components/shared/empty-state.shared.tsx
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}
```

### Example: Error fallback

```tsx
// components/shared/error-fallback.shared.tsx
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";

type ErrorFallbackProps = { message?: string; onRetry?: () => void };

export function ErrorFallback({ message = "Something went wrong.", onRetry }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button title="Try Again" onPress={onRetry} variant="secondary" />}
    </View>
  );
}
```

### Promotion rules

1. Do not create shared components speculatively. Earn shared status through real multi-domain use.
2. Name with `.shared.tsx` suffix.
3. Keep shared components generic. If domain-specific props accumulate, split or move to a domain folder.
4. Shared components may use UI primitives but should not import from domain folders.

### Shared vs UI

| `components/ui/` | `components/shared/` |
|-------------------|----------------------|
| Low-level primitives | Composed patterns |
| No layout opinions | Has layout and content structure |
| `Button`, `Input`, `Card` | `EmptyState`, `ErrorFallback`, `OfflineBanner` |

---

## 7. Components: Domain

`components/<domain>/` is the default home for components owned by a specific business domain.

### Structure

```text
components/
  profile/
    profile-header.tsx
    profile-stats-card.tsx
    profile-activity-list.tsx
    profile-edit-form.tsx
  orders/
    order-card.tsx
    order-status-badge.tsx
    order-timeline.tsx
  products/
    product-card.tsx
    product-gallery.tsx
    product-variant-picker.tsx
```

### Example: Domain component

```tsx
// components/orders/order-card.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/orders/order.types";

type OrderCardProps = { order: Order };

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/orders/${order.id}`)}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.orderId}>#{order.number}</Text>
          <Badge label={order.status} variant={statusVariant(order.status)} />
        </View>
        <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
        <Text style={styles.total}>${order.total.toFixed(2)}</Text>
      </Card>
    </Pressable>
  );
}
```

### Naming

Use kebab-case with the domain as prefix: `profile-header.tsx`, `order-status-badge.tsx`, `product-gallery.tsx`.

### When to promote to shared

Move to `components/shared/` when two or more unrelated domains use the exact same component and the props have been generalized.

### Platform variants

```text
components/profile/
  profile-header.tsx          # Shared logic
  profile-header.ios.tsx      # iOS-specific rendering
  profile-header.android.tsx  # Android-specific rendering
```

Use platform files sparingly — only when `Platform.select` is insufficient.

---

## 8. Components: Screen Sections

`components/screens/` holds screen composition sections — large UI blocks extracted from route files to keep `app/` lean.

### Example: Composing a screen

```tsx
// app/(tabs)/index.tsx
import { ScreenContainer } from "@/components/ui/screen-container";
import { HomeHero } from "@/components/screens/home-hero.screen";
import { HomeFeaturedProducts } from "@/components/screens/home-featured-products.screen";
import { HomeCategories } from "@/components/screens/home-categories.screen";

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <HomeHero />
      <HomeFeaturedProducts />
      <HomeCategories />
    </ScreenContainer>
  );
}
```

### Example: Screen section with loading and error states

```tsx
// components/screens/home-featured-products.screen.tsx
import { View, FlatList, StyleSheet } from "react-native";
import { SectionHeader } from "@/components/shared/section-header.shared";
import { ProductCard } from "@/components/products/product-card";
import { useFeaturedProducts } from "@/hooks/products/use-featured-products.hook";
import { ErrorFallback } from "@/components/shared/error-fallback.shared";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeFeaturedProducts() {
  const { products, isLoading, error, refetch } = useFeaturedProducts();

  if (isLoading) return <FeaturedProductsSkeleton />;
  if (error) return <ErrorFallback message="Could not load products." onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <SectionHeader title="Featured" actionLabel="See All" onAction={() => {}} />
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="40%" height={24} />
      <View style={styles.skeletonRow}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width={160} height={200} borderRadius={12} />
        ))}
      </View>
    </View>
  );
}
```

### Screen sections vs domain components

| `components/screens/` | `components/<domain>/` |
|------------------------|------------------------|
| Keeps route files lean | Domain-owned reusable UI |
| Named with `.screen.tsx` | Named with domain prefix |
| Typically one route consumer | Used across multiple screens |
| Manages own data fetching | Receives data via props |

### Naming convention

Pattern: `<screen>-<section>.screen.tsx` — e.g., `home-hero.screen.tsx`, `profile-header.screen.tsx`.

---

## 9. Hooks: Domain

`hooks/<domain>/` holds stateful logic owned by a specific business domain.

### Structure

```text
hooks/
  auth/
    use-auth.hook.ts
    use-session.hook.ts
  profile/
    use-profile.hook.ts
  products/
    use-product-search.hook.ts
    use-featured-products.hook.ts
  orders/
    use-orders.hook.ts
    use-order-tracking.hook.ts
  cart/
    use-cart.hook.ts
```

### Example: Domain hook

```tsx
// hooks/products/use-product-search.hook.ts
import { useState, useCallback } from "react";
import { searchProducts } from "@/services/products/product.service";
import type { Product } from "@/types/products/product.types";

export function useProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchProducts(searchQuery);
      setResults(data);
    } catch { setError("Failed to search products."); setResults([]); }
    finally { setIsLoading(false); }
  }, []);

  return { query, setQuery, results, isLoading, error, clearSearch: () => { setQuery(""); setResults([]); } };
}
```

### Example: Hook with TanStack Query

```tsx
// hooks/orders/use-orders.hook.ts
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/services/orders/order.service";

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 1000 * 60 * 5,
  });
}
```

### Hook responsibilities

Hooks should: manage state and side effects, delegate API calls to services, return a clean interface, handle loading/error/empty states.

Hooks should not: render UI, import components, access navigation directly, become god-objects.

### Shared hooks

Cross-domain hooks like `useDebounce` belong in `lib/<concern>/`, not in `hooks/shared/`.

---

## 10. Hooks: Native

`hooks/native/` holds hooks that wrap React Native and Expo platform APIs.

### Structure

```text
hooks/native/
  use-permissions.hook.ts
  use-app-state.hook.ts
  use-keyboard.hook.ts
  use-network.hook.ts
  use-haptics.hook.ts
  use-notifications.hook.ts
  use-camera.hook.ts
  use-location.hook.ts
```

### Example: Permissions hook

```tsx
// hooks/native/use-permissions.hook.ts
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

export function usePermission(type: "camera" | "mediaLibrary") {
  const [status, setStatus] = useState<"undetermined" | "granted" | "denied">("undetermined");

  const request = useCallback(async () => {
    const requestFn = type === "camera"
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const result = await requestFn();
    setStatus(result.granted ? "granted" : "denied");

    if (!result.granted && !result.canAskAgain) {
      Alert.alert("Permission Required", `Enable ${type} access in Settings.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
    }
    return result.granted;
  }, [type]);

  return { status, request, isGranted: status === "granted" };
}
```

### Example: App state hook

```tsx
// hooks/native/use-app-state.hook.ts
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousState = useRef(appState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      previousState.current = appState;
      setAppState(next);
    });
    return () => sub.remove();
  }, [appState]);

  return {
    appState,
    isActive: appState === "active",
    isBackground: appState === "background",
    cameFromBackground: previousState.current.match(/inactive|background/) !== null && appState === "active",
  };
}
```

### Example: Keyboard hook

```tsx
// hooks/native/use-keyboard.hook.ts
import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(show, (e) => { setIsVisible(true); setHeight(e.endCoordinates.height); });
    const hideSub = Keyboard.addListener(hide, () => { setIsVisible(false); setHeight(0); });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return { isVisible, height, dismiss: Keyboard.dismiss };
}
```

### Rules

1. One capability per hook.
2. Handle permission flows gracefully with settings fallback.
3. Clean up all subscriptions.
4. Return typed objects, not raw SDK responses.

---

## 11. Services: API

`services/<domain>/` holds functions that communicate with external APIs.

### Example: Shared API client

```tsx
// services/app/api-client.service.ts
import { getAuthToken } from "@/store/auth/auth.store";
import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? "https://api.example.com";

export async function apiClient<T>(endpoint: string, options: {
  method?: string; body?: unknown; headers?: Record<string, string>;
} = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message ?? "Request failed");
  }
  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}
```

### Example: Domain service with response transformation

```tsx
// services/orders/order.service.ts
type ApiOrder = { order_id: string; order_number: number; created_at: string; total_cents: number; status: string };

function toOrder(raw: ApiOrder): Order {
  return {
    id: raw.order_id,
    number: raw.order_number,
    createdAt: new Date(raw.created_at),
    total: raw.total_cents / 100,
    status: raw.status as Order["status"],
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const raw = await apiClient<ApiOrder[]>("/orders");
  return raw.map(toOrder);
}
```

### Service rules

1. Services own the API contract — accept and return domain types.
2. One service file per domain.
3. No UI imports.
4. Throw typed errors; let consumers decide display.
5. Testable without React.

---

## 12. Services: Storage

Mobile apps use multiple storage backends. Abstract them behind service layers.

### Example: MMKV storage

```tsx
// services/app/storage.service.ts
import { MMKV } from "react-native-mmkv";
const storage = new MMKV();

export const StorageService = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getObject: <T>(key: string): T | undefined => {
    const json = storage.getString(key);
    return json ? JSON.parse(json) : undefined;
  },
  setObject: <T>(key: string, value: T) => storage.set(key, JSON.stringify(value)),
  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
};
```

### Example: Secure storage

```tsx
// services/app/secure-storage.service.ts
import * as SecureStore from "expo-secure-store";

export const SecureStorageService = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};
```

### Choosing a backend

| Backend | Use case | Sync/Async | Encrypted |
|---------|----------|------------|-----------|
| MMKV | Preferences, cache, flags | Sync | Optional |
| AsyncStorage | Legacy compatibility | Async | No |
| SecureStore | Tokens, credentials, PII | Async | Yes |
| SQLite | Structured relational data | Async | No |

### Rules

1. Never access storage from components directly.
2. Use SecureStore for tokens and credentials.
3. Type storage keys with enums or constants.
4. Domain services wrap app-level services.

---

## 13. Store: Global vs Local State

### State placement decision tree

1. One component? `useState`.
2. Parent and children? Props or composition.
3. Siblings within one screen? Hook or scoped Context.
4. Multiple screens in one domain? Domain store (`store/<domain>/`).
5. Truly app-wide? Global store (`store/app/`).

### Example: Zustand domain store

```tsx
// store/cart/cart.store.ts
import { create } from "zustand";
import type { CartItem } from "@/types/cart/cart.types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existing = state.items.find((i) => i.id === item.id);
    if (existing) return { items: state.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
```

### When to use Context vs Zustand

**Context**: theme values, auth state, feature flags, screen-scoped state.
**Zustand/Jotai**: cross-screen state, outside-React access, fine-grained subscriptions, persistence.

### Anti-patterns

- Global store for form state
- Context for high-frequency updates
- Stores importing from components
- Putting API cache in a store (use TanStack Query)

---

## 14. Store: Offline Sync

### Persisted Zustand with MMKV

```tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();
const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({ items: [], addItem: (item) => set((s) => ({ items: [...s.items, item] })), clearCart: () => set({ items: [] }) }),
    { name: "cart-store", storage: createJSONStorage(() => mmkvStorage) }
  )
);
```

### Mutation queue

Queue mutations offline and flush when connected:

```tsx
// store/app/mutation-queue.store.ts
import NetInfo from "@react-native-community/netinfo";

// Enqueue mutations with endpoint, method, body
// Flush by iterating queue and calling fetch, dequeuing on success
// Stop on first failure to preserve ordering
```

### Optimistic updates

Use TanStack Query's `onMutate` to update the cache optimistically and rollback `onError`.

### Rules

1. Persist only client-owned state, not server cache.
2. Queue only idempotent-safe mutations.
3. Show offline status with `OfflineBanner`.
4. Version persisted store schemas for migration.

---

## 15. Navigation: File-Based Routing

### Route file types

| Pattern | Purpose |
|---------|---------|
| `index.tsx` | Index route |
| `about.tsx` | Static route |
| `[id].tsx` | Dynamic segment |
| `[...rest].tsx` | Catch-all |
| `+not-found.tsx` | 404 handler |
| `_layout.tsx` | Layout wrapper |

### Route groups

```text
app/
  (tabs)/     # Tab navigation — URLs unchanged
  (auth)/     # Auth stack — URLs unchanged
  (modals)/   # Modal presentation — URLs unchanged
```

### Modal routes

```tsx
// app/(modals)/_layout.tsx
import { Stack } from "expo-router";

export default function ModalLayout() {
  return <Stack screenOptions={{ presentation: "modal", headerShown: false }} />;
}
```

### Deep linking

Expo Router generates deep links automatically. Configure schemes in `app.json`:

```json
{ "expo": { "scheme": "myapp" } }
```

### Rules

1. Keep `app/` shallow — max 3 levels of nesting.
2. Groups separate navigation paradigms, not domains.
3. Route files should be thin — delegate to `components/screens/`.
4. Name dynamic segments descriptively.

---

## 16. Navigation: Type-Safe

### Typed route params

```tsx
const { id } = useLocalSearchParams<{ id: string }>();
```

### Typed navigation

```tsx
router.push({ pathname: "/products/[id]", params: { id: productId } });
```

### Typed Link

```tsx
<Link href={{ pathname: "/products/[id]", params: { id } }}>{name}</Link>
```

### Centralized route types

```tsx
// types/navigation/routes.types.ts
export type RouteParams = {
  "/products/[id]": { id: string };
  "/users/[userId]/posts/[postId]": { userId: string; postId: string };
  "/search": { q?: string; category?: string };
};
```

### Parsing params

Route params are always strings. Parse explicitly:

```tsx
export function useOrderParams() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const parsed = Number(orderId);
  if (Number.isNaN(parsed)) throw new Error("Invalid order ID");
  return { orderId: parsed };
}
```

### Rules

1. Always type `useLocalSearchParams`.
2. Parse numeric params explicitly.
3. Use `pathname` + `params` format for `router.push` and `Link`.
4. Validate params in hooks, not screen components.

---

## 17. Naming Conventions

### File naming rules

| Type | Pattern | Example |
|------|---------|---------|
| Component | `<name>.tsx` | `product-card.tsx` |
| Screen section | `<screen>-<section>.screen.tsx` | `home-hero.screen.tsx` |
| Shared component | `<name>.shared.tsx` | `empty-state.shared.tsx` |
| Hook | `use-<name>.hook.ts` | `use-auth.hook.ts` |
| Service | `<name>.service.ts` | `product.service.ts` |
| Store | `<name>.store.ts` | `cart.store.ts` |
| Types | `<name>.types.ts` | `product.types.ts` |
| Constants | `<name>.constants.ts` | `app.constants.ts` |
| Lib helper | `<name>.lib.ts` | `format-date.lib.ts` |
| Config plugin | `<name>.plugin.js` | `with-camera.plugin.js` |

### Directory naming

Directories use kebab-case: `order-history/`, `push-notifications/`.

### Component naming

Files: kebab-case. Exports: PascalCase.

```tsx
// File: components/profile/profile-header.tsx
export function ProfileHeader() { /* ... */ }
```

### Domain prefix

```text
components/orders/
  order-card.tsx           # Not "card.tsx"
  order-status-badge.tsx   # Not "status-badge.tsx"
```

### Avoid these names

`utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`, `temp.ts` — these hide responsibility.

---

## 18. Naming: Suffix Reference

| Suffix | Extension | Purpose |
|--------|-----------|---------|
| `.screen` | `.tsx` | Screen composition section |
| `.shared` | `.tsx` | Cross-domain reusable component |
| `.hook` | `.ts` | Custom React hook |
| `.service` | `.ts` | External communication / API |
| `.store` | `.ts` | State management module |
| `.types` | `.ts` | Type definitions |
| `.constants` | `.ts` | Static constant values |
| `.lib` | `.ts` | Pure utility / helper |
| `.schema` | `.ts` | Validation schema |
| `.plugin` | `.js` | Expo config plugin |
| `.test` | `.ts`/`.tsx` | Test file |
| `.mock` | `.ts` | Test mock / fixture |

### Suffix decision guide

```text
Component?
  ui/         → No suffix (button.tsx)
  shared/     → .shared.tsx
  screens/    → .screen.tsx
  <domain>/   → No suffix (order-card.tsx)

Logic?
  Hook        → .hook.ts
  API call    → .service.ts
  State       → .store.ts
  Utility     → .lib.ts

Data/Config?
  Types       → .types.ts
  Constants   → .constants.ts
  Validation  → .schema.ts
  Expo plugin → .plugin.js
```

---

## 19. Splitting: Screens

### When to split

- Screen exceeds 150-200 lines
- 3+ visually distinct sections
- Mixes data fetching, state, and rendering
- Contains inline helper components
- Multiple developers work on different parts

### How to split

1. Identify visual sections.
2. Extract to `components/screens/` as `.screen.tsx` files.
3. Move data fetching into each section or into domain hooks.
4. Keep the route file as a composition root under 30 lines.

### Before

```tsx
// app/(tabs)/profile.tsx — 400+ lines with header, stats, tabs, content
```

### After

```tsx
// app/(tabs)/profile.tsx — 15 lines
export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ProfileHeader />
      <ProfileTabs />
    </ScreenContainer>
  );
}
```

### Rules

1. Each section owns its loading and error states.
2. Sections receive minimal props — fetch their own data via hooks.
3. Name by screen + role: `profile-header.screen.tsx`.
4. Co-locate loading skeletons inside the same screen section file.
5. Do not split prematurely.

---

## 20. Splitting: Components

Split by **responsibility**, not line count.

### When to split

- Multiple visual regions with distinct purposes
- Logic obscures rendering
- Loading/error/success states create large conditional trees
- 10+ props serving different sub-concerns

### When not to split

- Child would wrap <15 lines with no meaningful boundary
- Abstraction name is weaker than inline code
- Component is already single-responsibility

### After splitting

```text
components/products/
  product-detail.tsx           # Compositor
  product-gallery.tsx          # Image carousel
  product-info.tsx             # Title, price, description
  product-variant-picker.tsx   # Size/color selector
  product-reviews.tsx          # Reviews list
```

### Extract logic to hooks

```tsx
// hooks/products/use-product-actions.hook.ts
export function useProductActions(product: Product) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const addToCart = useCallback(async () => {
    addItem({ ...selectedVariant, quantity });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedVariant, quantity, addItem]);

  return { selectedVariant, setSelectedVariant, quantity, setQuantity, addToCart };
}
```

### Prop drilling solutions

1. Try composition (children, render props).
2. Try a domain hook.
3. Last resort: domain store with selectors.

---

## 21. Native Modules: Config & Plugins

### app.config.ts

```tsx
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyApp",
  slug: "my-app",
  scheme: "myapp",
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    ["expo-camera", { cameraPermission: "Allow $(PRODUCT_NAME) to access your camera." }],
    "./plugins/with-deep-linking.plugin.js",
  ],
  extra: {
    apiUrl: process.env.API_URL ?? "https://api.example.com",
    eas: { projectId: "your-project-id" },
  },
});
```

### Custom config plugins

```js
// plugins/with-camera-config.plugin.js
const { withInfoPlist } = require("expo/config-plugins");

module.exports = function withCameraConfig(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      config.modResults.NSCameraUsageDescription || "This app uses the camera to scan barcodes.";
    return config;
  });
};
```

### eas.json

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "env": { "API_URL": "https://dev-api.example.com" } },
    "preview": { "distribution": "internal", "env": { "API_URL": "https://staging-api.example.com" } },
    "production": { "env": { "API_URL": "https://api.example.com" } }
  }
}
```

### Rules

1. Use `app.config.ts` as primary config for dynamic values.
2. Custom plugins in `plugins/`.
3. Environment-specific config in `eas.json` build profiles.
4. Never commit secrets — use EAS Secrets.
5. Document every permission string.

---

## 22. Native Modules: Wrappers

Wrap native modules in service or hook abstractions to isolate platform dependencies.

### Example: Camera service

```tsx
// services/app/camera.service.ts
import * as ImagePicker from "expo-image-picker";

export type CapturedImage = { uri: string; width: number; height: number; mimeType: string };

export async function takePhoto(): Promise<CapturedImage | null> {
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height, mimeType: asset.mimeType ?? "image/jpeg" };
}

export async function pickImage(): Promise<CapturedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height, mimeType: asset.mimeType ?? "image/jpeg" };
}
```

### Example: Camera hook using the service

```tsx
// hooks/native/use-camera.hook.ts
import { useState, useCallback } from "react";
import { usePermission } from "./use-permissions.hook";
import { takePhoto, pickImage, type CapturedImage } from "@/services/app/camera.service";

export function useCamera() {
  const permission = usePermission("camera");
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    const granted = await permission.request();
    if (!granted) { setError("Camera permission required."); return; }
    try { const result = await takePhoto(); if (result) setPhoto(result); }
    catch { setError("Failed to capture photo."); }
  }, [permission]);

  return { photo, capture, pick: () => pickImage().then(setPhoto), error, clearPhoto: () => setPhoto(null) };
}
```

### Choosing wrapper type

| Type | Use when |
|------|----------|
| Service | Async operations, side effects, external communication |
| Hook | React state, subscriptions, lifecycle management |
| Lib | Pure synchronous utility (haptics trigger, linking helper) |

### Rules

1. One module, one wrapper.
2. Return domain types, not SDK types.
3. Handle errors in the wrapper.
4. Keep wrappers thin — delegate, do not add business logic.

---

## 23. Complete Structure Reference

```text
app/
  _layout.tsx
  index.tsx
  +not-found.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    explore.tsx
    profile.tsx
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
    forgot-password.tsx
  (modals)/
    _layout.tsx
    confirm-delete.tsx
    image-viewer.tsx
  products/
    _layout.tsx
    index.tsx
    [id].tsx
    [id]/
      reviews.tsx
  orders/
    index.tsx
    [orderId].tsx
  api/
    auth+api.ts
components/
  ui/
    button.tsx
    input.tsx
    text.tsx
    card.tsx
    badge.tsx
    avatar.tsx
    separator.tsx
    skeleton.tsx
    icon-button.tsx
    screen-container.tsx
  shared/
    empty-state.shared.tsx
    error-fallback.shared.tsx
    loading-overlay.shared.tsx
    section-header.shared.tsx
    offline-banner.shared.tsx
    confirmation-sheet.shared.tsx
    list-footer-loader.shared.tsx
  screens/
    home-hero.screen.tsx
    home-featured-products.screen.tsx
    home-categories.screen.tsx
    profile-header.screen.tsx
    profile-activity.screen.tsx
    profile-stats.screen.tsx
    settings-account.screen.tsx
    settings-notifications.screen.tsx
  profile/
    profile-header.tsx
    profile-stats-card.tsx
    profile-edit-form.tsx
    profile-avatar-picker.tsx
  products/
    product-card.tsx
    product-gallery.tsx
    product-variant-picker.tsx
    product-review-item.tsx
    product-detail.tsx
  orders/
    order-card.tsx
    order-status-badge.tsx
    order-timeline.tsx
    order-summary.tsx
  cart/
    cart-item-row.tsx
    cart-summary.tsx
hooks/
  auth/
    use-auth.hook.ts
    use-session.hook.ts
    use-biometric-auth.hook.ts
  profile/
    use-profile.hook.ts
    use-profile-edit.hook.ts
  products/
    use-product-search.hook.ts
    use-product-filter.hook.ts
    use-featured-products.hook.ts
    use-product-actions.hook.ts
  orders/
    use-orders.hook.ts
    use-order-tracking.hook.ts
    use-cancel-order.hook.ts
  cart/
    use-cart.hook.ts
    use-cart-actions.hook.ts
  native/
    use-permissions.hook.ts
    use-app-state.hook.ts
    use-keyboard.hook.ts
    use-network.hook.ts
    use-camera.hook.ts
    use-location.hook.ts
    use-notifications.hook.ts
    use-haptics.hook.ts
    use-biometrics.hook.ts
services/
  app/
    api-client.service.ts
    storage.service.ts
    secure-storage.service.ts
    analytics.service.ts
    camera.service.ts
    notifications.service.ts
    push-notifications.service.ts
  auth/
    auth.service.ts
    auth-storage.service.ts
  profile/
    profile.service.ts
  products/
    product.service.ts
  orders/
    order.service.ts
store/
  app/
    theme.store.ts
    app.store.ts
    mutation-queue.store.ts
  auth/
    auth.store.ts
    auth-provider.tsx
  cart/
    cart.store.ts
  notifications/
    notifications.store.ts
constants/
  app/
    app.constants.ts
  products/
    product.constants.ts
  orders/
    order.constants.ts
types/
  app/
    app.types.ts
  auth/
    auth.types.ts
  products/
    product.types.ts
  orders/
    order.types.ts
  cart/
    cart.types.ts
  navigation/
    routes.types.ts
lib/
  dates/
    format-date.lib.ts
  analytics/
    track-event.lib.ts
  timing/
    use-debounce.lib.ts
  native/
    haptics.lib.ts
    linking.lib.ts
assets/
  images/
    icon.png
    splash.png
    adaptive-icon.png
  fonts/
    Inter-Regular.ttf
    Inter-Bold.ttf
plugins/
  with-camera-config.plugin.js
  with-deep-linking.plugin.js
  with-splash-screen.plugin.js
app.config.ts
eas.json
tsconfig.json
package.json
```

---

## 24. Placement Rules

### By artifact type

| Artifact | Location | Notes |
|----------|----------|-------|
| Route files | `app/` | Compose, do not implement |
| Layouts | `app/` with `_layout.tsx` | One navigator per layout |
| Screen sections | `components/screens/` | Keep routes lean |
| UI primitives | `components/ui/` | Domain-agnostic |
| Shared composites | `components/shared/` | Multi-domain only |
| Domain components | `components/<domain>/` | Default for app components |
| Domain hooks | `hooks/<domain>/` | Stateful domain logic |
| Native hooks | `hooks/native/` | Platform API wrappers |
| API services | `services/<domain>/` | External communication |
| App-wide services | `services/app/` | API client, analytics |
| Storage services | `services/app/` or `services/<domain>/` | MMKV, SecureStore |
| Domain stores | `store/<domain>/` | Cross-screen client state |
| App-wide stores | `store/app/` | Theme, global state |
| Types | `types/<domain>/` | Domain-owned types |
| Constants | `constants/<domain>/` | Domain-owned constants |
| Lib helpers | `lib/<concern>/` | Pure utilities |
| Config plugins | `plugins/` | Expo native mods |
| Loading skeletons | Same file as loaded state | Co-located in screen sections |
| Error fallbacks | `components/shared/` or domain | Promote only if truly shared |

### Keep local vs promote shared

**Keep local when:** one consumer, one domain, unstable abstraction.
**Promote to domain folder when:** multiple files in one domain need it.
**Promote to shared when:** multiple domains actually use it, the concern is stable and generic.

Do not move code to shared because it "might be reused later."

---

## 25. Anti-Patterns

- **Giant `components/` folder with no domain subfolders.** Creates discovery problems.
- **Bloated route files.** If `app/.../index.tsx` contains most UI and logic, the route has become the app.
- **`utils.ts` junk drawer.** Hides intent. Name the specific concern.
- **Premature promotion to shared.** Shared code should come from real repeated use.
- **Global state for local concerns.** Increases coupling.
- **Excessive fragmentation.** Ten tiny files with weak names can be worse than one focused file.
- **Flat layer folders.** If every file sits directly in `components/` or `hooks/`, navigation degrades.
- **Context for high-frequency updates.** Use Zustand with selectors.
- **API cache in a store.** Use TanStack Query for server state.
- **Direct native SDK imports in components.** Wrap in services or hooks.

---

## 26. Decision Checklist

Before placing or moving a file:

1. Is this route-local, domain-local, shared, or app-global?
2. Is this UI, logic, integration, static data, validation, state, or a pure helper?
3. Does this component do more than one job?
4. Should this logic become a hook, service, or helper?
5. Is the code actually reused enough to move to shared?
6. Are loading, error, and empty states accounted for?
7. Does the file name reveal the responsibility clearly?
8. Does this file need native permissions or device APIs? (If yes, wrap in `hooks/native/` or `services/app/`.)
9. Will this file need platform-specific variants?
10. Is offline behavior handled appropriately?
