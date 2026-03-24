# Expo Project Structure — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

Opinionated Expo + React Native + TypeScript project structure and screen-splitting guidance. Use this whenever the user asks how to organize a mobile codebase, where files should live, how to split large screens or components, how to structure components, hooks, services, store, constants, types, or navigation, or when an Expo app feels messy and needs a consistent architecture.

## Table of Contents

1. [Architecture Principles: Feature Boundaries](#1-feature-boundaries)
2. [Architecture Principles: Layer-First Architecture](#2-layer-first-architecture)
3. [App Directory & Routing: Expo Router File-Based Routing](#3-expo-router-file-based-routing)
4. [App Directory & Routing: Layout Patterns](#4-layout-patterns)
5. [Components Organization: Domain Components](#5-domain-components)
6. [Components Organization: Screen Sections](#6-screen-sections)
7. [Components Organization: Shared Components](#7-shared-components)
8. [Components Organization: UI Primitives](#8-ui-primitives)
9. [Hooks Organization: Domain Hooks](#9-domain-hooks)
10. [Hooks Organization: Native Hooks](#10-native-hooks)
11. [Services Layer: API Services](#11-api-services)
12. [Services Layer: Storage Services](#12-storage-services)
13. [State Management: Global vs Local State](#13-global-vs-local-state)
14. [State Management: Offline Sync Patterns](#14-offline-sync-patterns)
15. [Navigation Patterns: File-Based Routing Conventions](#15-file-based-routing-conventions)
16. [Navigation Patterns: Type-Safe Navigation](#16-type-safe-navigation)
17. [Naming Conventions: Naming Conventions](#17-naming-conventions)
18. [Naming Conventions: Suffix Reference](#18-suffix-reference)
19. [Splitting Guidelines: Splitting Components](#19-splitting-components)
20. [Splitting Guidelines: Splitting Screens](#20-splitting-screens)
21. [Native Modules & Config: Native Config & Plugins](#21-native-config-plugins)
22. [Native Modules & Config: Native Module Wrappers](#22-native-module-wrappers)

---

## 1. Feature Boundaries

Layer-first is the default. Feature folders are an alternative when a domain grows large enough that navigating across layers becomes painful.

### When to stay layer-first

Stay layer-first when:

- The app has fewer than 8-10 domains
- Most domains have 3-5 files per layer
- Team members work across domains regularly
- You want maximum consistency and discoverability

### When to consider feature folders

Consider feature folders when:

- A domain has 15+ files spread across 5+ layers
- A dedicated team owns the entire feature end-to-end
- The feature ships independently (e.g., a standalone module in a super-app)
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
    screens/
      checkout-review.screen.tsx
```

### Hybrid approach

Most Expo apps benefit from a hybrid: layer-first for most code, feature folders for one or two large bounded contexts.

```text
app/
components/
  ui/
  shared/
  screens/
  profile/
  settings/
hooks/
  auth/
  profile/
services/
  auth/
  profile/
features/
  checkout/           # Large enough to warrant isolation
    components/
    hooks/
    services/
    store/
    types/
```

### Rules for feature folders

1. A feature folder must be self-contained. It should not import from another feature folder.
2. Features may import from shared layers: `components/ui/`, `components/shared/`, `lib/`, `types/`, `constants/`.
3. If two features need the same code, promote it to the shared layer — do not create cross-feature imports.
4. Feature folders still use the same naming conventions and file suffixes.

### Mobile-specific boundary concerns

React Native apps have stricter boundary needs than web apps because:

- **Navigation coupling**: Screen components are tightly bound to navigator configuration. Isolating a feature means isolating its navigation stack.
- **Native module dependencies**: A feature that uses the camera, location, or notifications pulls in native configuration. Bundling that configuration with the feature makes it easier to add or remove.
- **Bundle size**: Unlike web apps with route-based code splitting, React Native bundles everything. Feature boundaries help identify what can be lazy-loaded with `React.lazy` or deferred.
- **Platform forks**: A feature may need `.ios.tsx` and `.android.tsx` variants. Keeping these inside the feature folder prevents platform files from scattering.

### Do not over-isolate

Creating a feature folder for every domain leads to the same discovery problems as a giant `features/` bucket on the web. Reserve feature folders for genuinely large, self-contained domains.

---

## 2. Layer-First Architecture

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
store/
  <domain>/
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

### When a file does not belong to a domain

Place it in a general-purpose subfolder that names the concern:

- `lib/dates/format-date.lib.ts`
- `lib/analytics/track-event.lib.ts`
- `constants/app/app.constants.ts`

### Decision flow

1. What kind of thing is this file? (component, hook, service, type, constant, helper)
2. Which domain owns it? (auth, profile, orders, app-wide)
3. Is it route-local, domain-local, shared, or global?
4. Place it in the narrowest valid scope.

If a file could live in two layers, pick the one that matches its **primary responsibility**. A function that fetches data is a service, even if a hook calls it.

---

## 3. Expo Router File-Based Routing

Expo Router v4 uses the `app/` directory for file-based routing. Every file in `app/` becomes a route. This is the primary navigation mechanism for Expo SDK 52+.

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
    index.tsx           # "/" — first tab
    explore.tsx         # "/explore" — second tab
    profile.tsx         # "/profile" — third tab
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
- Define route-specific metadata or head elements
- Wire up route params to domain hooks

Route files should **not**:

- Contain 200+ lines of inline UI markup
- Define reusable components
- Contain business logic or API calls directly
- Export shared hooks or utilities

### Keep routes lean

A well-structured route file looks like:

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

Expo Router supports API routes for server-side logic when using Expo with server output:

```text
app/
  api/
    auth+api.ts         # POST /api/auth
    users/[id]+api.ts   # GET /api/users/123
```

Keep API route logic thin — delegate to services.

---

## 4. Layout Patterns

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

---

## 5. Domain Components

`components/<domain>/` is the default home for components owned by a specific business domain. This is where most app components live.

### Structure

```text
components/
  profile/
    profile-header.tsx
    profile-stats-card.tsx
    profile-activity-list.tsx
    profile-edit-form.tsx
    profile-avatar-picker.tsx
  orders/
    order-card.tsx
    order-status-badge.tsx
    order-timeline.tsx
    order-summary.tsx
  products/
    product-card.tsx
    product-gallery.tsx
    product-variant-picker.tsx
    product-review-item.tsx
```

### What makes a component domain-owned

A component is domain-owned when:

- It renders data from a specific domain model (user, order, product)
- It contains domain-specific interaction logic (add to cart, follow user)
- Its prop types reference domain types
- It is not meaningful outside its domain context

### Example: Domain component

```tsx
// components/orders/order-card.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/orders/order.types";

type OrderCardProps = {
  order: Order;
};

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

### Naming conventions

Use kebab-case with the domain as prefix:

- `profile-header.tsx` (not `ProfileHeader.tsx` or `header.tsx`)
- `order-status-badge.tsx` (not `status-badge.tsx`)

The domain prefix prevents naming collisions and makes imports self-documenting:

```tsx
import { OrderCard } from "@/components/orders/order-card";
import { ProductCard } from "@/components/products/product-card";
```

### When to promote to shared

Move a domain component to `components/shared/` when:

- Two or more unrelated domains use the exact same component
- The component's props have been generalized to remove domain types
- The name still makes sense without a domain prefix

Do not promote because "it might be reused someday."

### Platform variants

When a component needs different behavior per platform:

```text
components/
  profile/
    profile-header.tsx          # Shared logic
    profile-header.ios.tsx      # iOS-specific rendering
    profile-header.android.tsx  # Android-specific rendering
```

React Native's module resolution automatically picks the correct platform file. Use this sparingly — most components should work cross-platform with `Platform.select` for minor differences.

### Co-located styles

Keep styles in the same file using `StyleSheet.create`. Extract to a separate file only when multiple components in the same domain share identical style tokens:

```text
components/
  profile/
    profile-header.tsx
    profile-stats-card.tsx
    profile.styles.ts           # Only if styles are genuinely shared
```

---

## 6. Screen Sections

`components/screens/` holds screen composition sections — large UI blocks extracted from route files to keep `app/` lean.

### Purpose

A route file in `app/` should compose, not implement. When a screen has multiple visual sections (header, content, footer, sidebar), each section becomes a component in `components/screens/`.

### Structure

```text
components/
  screens/
    home-hero.screen.tsx
    home-featured-products.screen.tsx
    home-categories.screen.tsx
    profile-header.screen.tsx
    profile-activity.screen.tsx
    profile-stats.screen.tsx
    settings-account.screen.tsx
    settings-notifications.screen.tsx
    settings-privacy.screen.tsx
```

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

### Example: Screen section component

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

const styles = StyleSheet.create({
  container: { gap: 12, paddingVertical: 16 },
  list: { gap: 12 },
  skeletonRow: { flexDirection: "row", gap: 12 },
});
```

### Screen sections vs domain components

| `components/screens/` | `components/<domain>/` |
|------------------------|------------------------|
| Exists to keep route files lean | Exists for domain-owned reusable UI |
| Named with `.screen.tsx` suffix | Named without suffix or with domain prefix |
| Typically used by one route | Used across multiple screens |
| Manages its own data fetching and states | Receives data via props |

### Naming convention

Use the pattern `<screen>-<section>.screen.tsx`:

- `home-hero.screen.tsx`
- `profile-header.screen.tsx`
- `settings-notifications.screen.tsx`

### Co-located skeletons

Define loading skeletons as private functions inside the same screen section file. This keeps the loading state visually consistent with the loaded state and avoids separate skeleton files that drift.

---

## 7. Shared Components

`components/shared/` holds reusable composites that serve multiple domains. These are more opinionated than UI primitives but not owned by a single domain.

### What belongs in `components/shared/`

- `empty-state.shared.tsx` — Generic empty state with icon, title, description, and optional action
- `loading-overlay.shared.tsx` — Full-screen or section-level loading indicator
- `error-fallback.shared.tsx` — Error boundary fallback with retry action
- `list-footer-loader.shared.tsx` — Infinite scroll loading indicator
- `pull-to-refresh.shared.tsx` — Wrapper adding pull-to-refresh behavior
- `section-header.shared.tsx` — Reusable section title with optional action link
- `confirmation-sheet.shared.tsx` — Bottom sheet for destructive action confirmation
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

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
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

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 32, gap: 12 },
  icon: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  description: { fontSize: 14, color: "#666", textAlign: "center" },
});
```

### Example: Error fallback

```tsx
// components/shared/error-fallback.shared.tsx
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";

type ErrorFallbackProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorFallback({
  message = "Something went wrong.",
  onRetry,
}: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button title="Try Again" onPress={onRetry} variant="secondary" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  message: { fontSize: 16, color: "#333", textAlign: "center" },
});
```

### Promotion rules

1. **Do not create shared components speculatively.** A component earns shared status when two or more domains actually use it.
2. **Name with `.shared.tsx` suffix** to signal cross-domain ownership.
3. **Keep shared components generic.** If a shared component accumulates domain-specific props, it should be split or moved to a domain folder.
4. **Shared components may use UI primitives** from `components/ui/` but should not import from domain folders.

### Shared vs UI

| `components/ui/` | `components/shared/` |
|-------------------|----------------------|
| Low-level primitives | Composed patterns |
| No layout opinions | Has layout and content structure |
| Domain-agnostic | Domain-agnostic but opinionated |
| `Button`, `Input`, `Card` | `EmptyState`, `ErrorFallback`, `OfflineBanner` |

---

## 8. UI Primitives

`components/ui/` holds domain-agnostic building blocks. These wrap React Native core components with consistent styling, theming, and accessibility defaults.

### What belongs in `components/ui/`

- `button.tsx` — Wraps `Pressable` with size variants, loading state, haptic feedback
- `text.tsx` — Themed `Text` with typography presets
- `input.tsx` — Styled `TextInput` with label, error, and helper text
- `card.tsx` — Surface container with shadow and border radius
- `screen-container.tsx` — Safe area wrapper with consistent padding
- `icon-button.tsx` — Circular pressable icon
- `separator.tsx` — Themed divider line
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
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
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
        styles.base,
        styles[variant],
        styles[size],
        pressed && styles.pressed,
        disabled && styles.disabled,
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

export function ScreenContainer({
  children,
  scrollable = true,
  style,
}: ScreenContainerProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={[styles.container, style]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
});
```

### Rules for UI primitives

1. **No domain logic.** A `Button` should never know about users or orders.
2. **Accessibility by default.** Include `accessibilityRole`, `accessibilityLabel`, and state props.
3. **Themeable.** Accept style overrides or use a theme context for colors and spacing.
4. **Platform-aware.** Use `Platform.select` or `.ios.tsx`/`.android.tsx` only when platform behavior genuinely differs.
5. **Tested in isolation.** UI primitives should work in Storybook or a dedicated preview screen.

---

## 9. Domain Hooks

`hooks/<domain>/` holds stateful logic owned by a specific business domain. Hooks extract state management, side effects, and interaction logic from components.

### Structure

```text
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
  orders/
    use-orders.hook.ts
    use-order-tracking.hook.ts
  cart/
    use-cart.hook.ts
    use-cart-actions.hook.ts
```

### When to extract a hook

Extract a hook when:

- Stateful logic is reused by multiple components in the same domain
- State transitions dominate the component body (form state, pagination, filtering)
- The component becomes hard to read because logic and rendering are tangled
- You need to compose multiple lower-level hooks into a domain-specific abstraction

### Example: Domain hook

```tsx
// hooks/products/use-product-search.hook.ts
import { useState, useCallback } from "react";
import { useDebounce } from "@/lib/timing/use-debounce.lib";
import { searchProducts } from "@/services/products/product.service";
import type { Product } from "@/types/products/product.types";

export function useProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchProducts(searchQuery);
      setResults(data);
    } catch (err) {
      setError("Failed to search products.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, isLoading, error, clearSearch };
}
```

### Example: Hook with TanStack Query

```tsx
// hooks/orders/use-orders.hook.ts
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/services/orders/order.service";
import type { OrderFilters } from "@/types/orders/order.types";

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 1000 * 60 * 5,
  });
}
```

### Naming conventions

- File: `use-<name>.hook.ts`
- Export: `use<Name>` (camelCase function name)
- Place in `hooks/<domain>/`

### Hook responsibilities

Hooks should:

- Manage state and side effects
- Delegate API calls to services
- Return a clean interface of values and callbacks
- Handle loading, error, and empty states

Hooks should not:

- Render UI (return JSX)
- Import components
- Access navigation directly (pass callbacks from the component instead)
- Become a god-object that manages unrelated state

### Shared hooks

If a hook is genuinely cross-domain (e.g., `useDebounce`, `useMediaQuery`), place it in `lib/<concern>/` rather than creating a `hooks/shared/` folder. Reserve `hooks/` for domain-owned logic.

---

## 10. Native Hooks

`hooks/native/` holds hooks that wrap React Native and Expo platform APIs. These abstract device capabilities into reusable, typed interfaces.

### Structure

```text
hooks/
  native/
    use-permissions.hook.ts
    use-app-state.hook.ts
    use-keyboard.hook.ts
    use-network.hook.ts
    use-device-info.hook.ts
    use-haptics.hook.ts
    use-notifications.hook.ts
    use-camera.hook.ts
    use-location.hook.ts
    use-biometrics.hook.ts
```

### Example: Permissions hook

```tsx
// hooks/native/use-permissions.hook.ts
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

type PermissionType = "camera" | "mediaLibrary" | "location" | "notifications";

export function usePermission(type: PermissionType) {
  const [status, setStatus] = useState<"undetermined" | "granted" | "denied">("undetermined");

  const request = useCallback(async () => {
    let requestFn: () => Promise<{ granted: boolean; canAskAgain: boolean }>;

    switch (type) {
      case "camera":
        requestFn = ImagePicker.requestCameraPermissionsAsync;
        break;
      case "mediaLibrary":
        requestFn = ImagePicker.requestMediaLibraryPermissionsAsync;
        break;
      default:
        throw new Error(`Permission type "${type}" not implemented`);
    }

    const result = await requestFn();
    setStatus(result.granted ? "granted" : "denied");

    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        "Permission Required",
        `Please enable ${type} access in your device settings.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
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
    const subscription = AppState.addEventListener("change", (nextState) => {
      previousState.current = appState;
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, [appState]);

  return {
    appState,
    previousState: previousState.current,
    isActive: appState === "active",
    isBackground: appState === "background",
    cameFromBackground:
      previousState.current.match(/inactive|background/) !== null && appState === "active",
  };
}
```

### Example: Keyboard hook

```tsx
// hooks/native/use-keyboard.hook.ts
import { useEffect, useState } from "react";
import { Keyboard, Platform, type KeyboardEvent } from "react-native";

export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setIsVisible(true);
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsVisible(false);
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { isVisible, height, dismiss: Keyboard.dismiss };
}
```

### Why a separate `native/` folder

Native hooks differ from domain hooks:

- They wrap platform APIs, not business logic
- They are used across many domains
- They deal with permissions, device state, and OS-level events
- They often require cleanup (subscriptions, listeners)

Keeping them in `hooks/native/` makes it clear which hooks have platform dependencies and helps during platform-specific testing.

### Rules

1. **One capability per hook.** Do not combine camera, location, and notifications in one hook.
2. **Handle permission flows gracefully.** Always provide a path to device settings when permissions are permanently denied.
3. **Clean up subscriptions.** Every `addEventListener` needs a corresponding cleanup in the effect's return.
4. **Type the return value.** Native hooks should return typed objects, not raw API responses.

---

## 11. API Services

`services/<domain>/` holds functions that communicate with external APIs. Services own the request/response contract and transform raw API data into domain types.

### Structure

```text
services/
  app/
    api-client.service.ts       # Shared fetch wrapper
  auth/
    auth.service.ts
  products/
    product.service.ts
  orders/
    order.service.ts
  profile/
    profile.service.ts
```

### Example: Shared API client

```tsx
// services/app/api-client.service.ts
import { getAuthToken } from "@/store/auth/auth.store";
import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? "https://api.example.com";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
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

### Example: Domain service

```tsx
// services/products/product.service.ts
import { apiClient } from "@/services/app/api-client.service";
import type { Product, ProductFilters } from "@/types/products/product.types";

export async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.query) params.set("q", filters.query);
  if (filters.page) params.set("page", String(filters.page));

  return apiClient<Product[]>(`/products?${params.toString()}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return apiClient<Product>(`/products/${id}`);
}

export async function searchProducts(query: string): Promise<Product[]> {
  return apiClient<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
}
```

### Service rules

1. **Services own the API contract.** They accept domain types and return domain types. Raw API shapes stay inside the service.
2. **One service file per domain.** `product.service.ts` handles all product API calls. Split only if the file exceeds 200 lines.
3. **No UI imports.** Services never import components, hooks, or navigation.
4. **Error handling at the boundary.** Services throw typed errors. Hooks and components decide how to display them.
5. **Testable in isolation.** Services should work without React. They are pure async functions.

### Transform responses

If the API shape differs from your domain types, transform inside the service:

```tsx
// services/orders/order.service.ts
import { apiClient } from "@/services/app/api-client.service";
import type { Order } from "@/types/orders/order.types";

type ApiOrder = {
  order_id: string;
  order_number: number;
  created_at: string;
  total_cents: number;
  status: string;
};

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

### App-wide services

Place shared integration services in `services/app/`:

- `services/app/api-client.service.ts` — Fetch wrapper
- `services/app/analytics.service.ts` — Event tracking
- `services/app/push-notifications.service.ts` — Notification registration

---

## 12. Storage Services

`services/<domain>/` or `services/app/` holds storage abstractions. Mobile apps use multiple storage backends — MMKV for fast sync access, AsyncStorage for simple key-value persistence, and SecureStore for sensitive data.

### Structure

```text
services/
  app/
    storage.service.ts          # Unified storage interface
    secure-storage.service.ts   # Expo SecureStore wrapper
  auth/
    auth-storage.service.ts     # Token persistence
  preferences/
    preferences-storage.service.ts
```

### Example: MMKV storage service

```tsx
// services/app/storage.service.ts
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const StorageService = {
  getString(key: string): string | undefined {
    return storage.getString(key);
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
  getObject<T>(key: string): T | undefined {
    const json = storage.getString(key);
    if (!json) return undefined;
    try { return JSON.parse(json) as T; }
    catch { return undefined; }
  },
  setObject<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
  delete(key: string): void {
    storage.delete(key);
  },
  clearAll(): void {
    storage.clearAll();
  },
};
```

### Example: Secure storage service

```tsx
// services/app/secure-storage.service.ts
import * as SecureStore from "expo-secure-store";

export const SecureStorageService = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
```

### Example: Domain storage service

```tsx
// services/auth/auth-storage.service.ts
import { SecureStorageService } from "@/services/app/secure-storage.service";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export const AuthStorageService = {
  async getToken(): Promise<string | null> {
    return SecureStorageService.get(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await SecureStorageService.set(TOKEN_KEY, token);
  },
  async clearTokens(): Promise<void> {
    await SecureStorageService.delete(TOKEN_KEY);
    await SecureStorageService.delete(REFRESH_TOKEN_KEY);
  },
};
```

### Choosing a storage backend

| Backend | Use case | Sync/Async | Encrypted |
|---------|----------|------------|-----------|
| MMKV | App preferences, cache, feature flags | Sync | Optional |
| AsyncStorage | Legacy compatibility, simple key-value | Async | No |
| SecureStore | Tokens, credentials, sensitive PII | Async | Yes |
| SQLite (expo-sqlite) | Structured relational data | Async | No |

### Rules

1. **Never access storage directly from components.** Always go through a service.
2. **Use SecureStore for tokens and credentials.** MMKV and AsyncStorage are not encrypted by default.
3. **Type your storage keys.** Use an enum or constants file to prevent key typos.
4. **Domain services wrap app-level services.** `auth-storage.service.ts` uses `SecureStorageService`, not `SecureStore` directly.
5. **Handle missing values gracefully.** Storage reads can return `undefined` or `null`.

---

## 13. Global vs Local State

React Native apps need clear rules for where state lives. The wrong choice creates unnecessary re-renders, stale data, and tight coupling.

### State placement decision tree

1. **Is the state used by one component?** Keep it as local state (`useState`).
2. **Is the state used by a parent and its children?** Pass it as props or use composition.
3. **Is the state used by siblings or distant components within one screen?** Use a hook or Context scoped to that screen.
4. **Is the state used across multiple screens in one domain?** Use a domain store (`store/<domain>/`).
5. **Is the state truly app-wide?** Use a global store (`store/app/`).

### Structure

```text
store/
  app/
    theme.store.ts
    app.store.ts
  auth/
    auth.store.ts
  cart/
    cart.store.ts
  notifications/
    notifications.store.ts
```

### Example: Zustand domain store

```tsx
// store/cart/cart.store.ts
import { create } from "zustand";
import type { CartItem } from "@/types/cart/cart.types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
```

### When to use Context

Context is appropriate for:

- Theme/appearance values that rarely change
- Auth state (current user, token)
- Feature flags
- Screen-scoped state shared among deeply nested components

Context is **not** appropriate for:

- Frequently updating state (causes full subtree re-renders)
- State with many consumers that read different slices
- State that needs to be accessed outside React (e.g., in services)

### When to use Zustand/Jotai

Use an external store when:

- State is accessed from multiple screens
- State needs to be read outside React components (in services, navigation guards)
- Fine-grained subscriptions matter for performance
- State needs persistence (Zustand middleware, MMKV adapter)

### Anti-patterns

- **Global store for form state.** Use `useState` or a form library.
- **Context for high-frequency updates.** Use Zustand with selectors instead.
- **Store accessing components.** Stores never import from `components/`.
- **Multiple stores managing the same data.** One domain, one store.
- **Putting API cache in a store.** Use TanStack Query or SWR for server state.

---

## 14. Offline Sync Patterns

Mobile apps frequently lose connectivity. A well-structured Expo app accounts for offline use with persisted stores, queued mutations, and optimistic updates.

### Persisted Zustand store

Use Zustand's `persist` middleware with an MMKV adapter:

```tsx
// store/cart/cart.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Mutation queue pattern

Queue mutations when offline and replay them when connectivity returns:

```tsx
// store/app/mutation-queue.store.ts
import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";

type PendingMutation = {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  body: unknown;
  createdAt: number;
};

type MutationQueueState = {
  pending: PendingMutation[];
  enqueue: (mutation: Omit<PendingMutation, "id" | "createdAt">) => void;
  dequeue: (id: string) => void;
  flush: () => Promise<void>;
};

export const useMutationQueue = create<MutationQueueState>()((set, get) => ({
  pending: [],
  enqueue: (mutation) =>
    set((state) => ({
      pending: [
        ...state.pending,
        { ...mutation, id: crypto.randomUUID(), createdAt: Date.now() },
      ],
    })),
  dequeue: (id) =>
    set((state) => ({ pending: state.pending.filter((m) => m.id !== id) })),
  flush: async () => {
    const { pending, dequeue } = get();
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    for (const mutation of pending) {
      try {
        await fetch(mutation.endpoint, {
          method: mutation.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation.body),
        });
        dequeue(mutation.id);
      } catch {
        break;
      }
    }
  },
}));
```

### Optimistic updates with TanStack Query

```tsx
// hooks/orders/use-cancel-order.hook.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder } from "@/services/orders/order.service";
import type { Order } from "@/types/orders/order.types";

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onMutate: async (orderId: string) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previous = queryClient.getQueryData<Order[]>(["orders"]);
      queryClient.setQueryData<Order[]>(["orders"], (old) =>
        old?.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["orders"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
```

### Rules

1. **Persist only client-owned state.** Do not persist server cache — let TanStack Query handle its own caching.
2. **Queue only idempotent-safe mutations.** Mutations that depend on server-side ordering should not be blindly replayed.
3. **Show offline status clearly.** Use the `OfflineBanner` shared component when connectivity is lost.
4. **Version your persisted store schema.** Use the `version` field in Zustand persist to handle migrations when the store shape changes.

---

## 15. File-Based Routing Conventions

Expo Router maps the `app/` directory to routes. Understanding the conventions is critical for structuring navigation correctly.

### Route file types

| File pattern | Purpose | Example URL |
|-------------|---------|-------------|
| `index.tsx` | Index route for a directory | `/` or `/products` |
| `about.tsx` | Static named route | `/about` |
| `[id].tsx` | Dynamic segment | `/products/123` |
| `[...rest].tsx` | Catch-all segment | `/docs/a/b/c` |
| `+not-found.tsx` | 404 handler | Any unmatched route |
| `_layout.tsx` | Layout wrapper | N/A (wraps children) |

### Route groups

Groups organize routes without affecting URLs. They are defined with parentheses:

```text
app/
  (tabs)/               # Tab-based navigation group
    _layout.tsx
    index.tsx            # "/"
    search.tsx           # "/search"
  (auth)/               # Authentication flow group
    _layout.tsx
    login.tsx            # "/login"
    register.tsx         # "/register"
  (settings)/           # Settings stack group
    _layout.tsx
    index.tsx            # "/settings"
    notifications.tsx    # "/notifications"
```

### Nested routes

Directories create route nesting:

```text
app/
  products/
    _layout.tsx          # Stack navigator for products
    index.tsx            # "/products"
    [id].tsx             # "/products/123"
    [id]/
      reviews.tsx        # "/products/123/reviews"
      edit.tsx           # "/products/123/edit"
```

### Modal routes

Present routes as modals using groups and screen options:

```text
app/
  (modals)/
    _layout.tsx          # Stack with presentation: "modal"
    confirm-delete.tsx   # "/confirm-delete" (presented as modal)
    image-viewer.tsx     # "/image-viewer" (presented as modal)
```

```tsx
// app/(modals)/_layout.tsx
import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ presentation: "modal", headerShown: false }}>
      <Stack.Screen name="confirm-delete" />
      <Stack.Screen name="image-viewer" />
    </Stack>
  );
}
```

### Deep linking

Expo Router generates deep links automatically from the file structure. The route `/products/[id]` maps to `myapp://products/123`.

Configure custom schemes in `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "plugins": [
      ["expo-router", { "origin": "https://myapp.com" }]
    ]
  }
}
```

### Route organization rules

1. **Keep the `app/` directory shallow.** Avoid more than 3 levels of nesting.
2. **Use groups to separate navigation paradigms** (tabs, auth, modals), not to organize by domain.
3. **Route files should be thin.** Delegate to `components/screens/` for the actual UI.
4. **Name dynamic segments descriptively.** Use `[productId]` over `[id]` when the parent folder does not provide enough context.
5. **Place shared layouts at the highest common ancestor.** Do not duplicate layout logic.

---

## 16. Type-Safe Navigation

Expo Router supports typed route params, which prevent runtime errors from missing or mistyped navigation parameters.

### Typed route params

Use `useLocalSearchParams` with a generic to type params at the route level:

```tsx
// app/products/[id].tsx
import { useLocalSearchParams } from "expo-router";

type ProductParams = {
  id: string;
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<ProductParams>();
  // id is typed as string
}
```

### Multiple dynamic segments

```tsx
// app/users/[userId]/posts/[postId].tsx
import { useLocalSearchParams } from "expo-router";

type PostParams = {
  userId: string;
  postId: string;
};

export default function PostScreen() {
  const { userId, postId } = useLocalSearchParams<PostParams>();
}
```

### Typed navigation with `router.push`

```tsx
import { useRouter } from "expo-router";

export function ProductCard({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/products/[id]",
          params: { id: productId },
        })
      }
    >
      {/* ... */}
    </Pressable>
  );
}
```

### Typed `Link` component

```tsx
import { Link } from "expo-router";

export function ProductLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={{
        pathname: "/products/[id]",
        params: { id },
      }}
    >
      {name}
    </Link>
  );
}
```

### Route param types file

For complex apps, centralize route param types:

```tsx
// types/navigation/routes.types.ts
export type RouteParams = {
  "/products/[id]": { id: string };
  "/users/[userId]/posts/[postId]": { userId: string; postId: string };
  "/orders/[orderId]": { orderId: string };
  "/search": { q?: string; category?: string };
};
```

### Parsing and validating params

Route params are always strings. Parse them explicitly:

```tsx
// hooks/products/use-product-params.hook.ts
import { useLocalSearchParams } from "expo-router";

export function useProductParams() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    throw new Error("Product ID is required");
  }

  return { productId: id };
}
```

For numeric IDs:

```tsx
export function useOrderParams() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const parsed = Number(orderId);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid order ID");
  }

  return { orderId: parsed };
}
```

### Query params on static routes

Static routes can receive query params via the search object:

```tsx
// Navigating with query params
router.push({
  pathname: "/search",
  params: { q: "shoes", category: "footwear" },
});

// Reading query params
const { q, category } = useLocalSearchParams<{ q?: string; category?: string }>();
```

### Rules

1. **Always type `useLocalSearchParams`.** Untyped params are `Record<string, string | string[]>` which is error-prone.
2. **Parse numeric params explicitly.** Never assume `params.id` is a number.
3. **Use `pathname` + `params` object format** for `router.push` and `Link` — it catches typos at compile time.
4. **Centralize complex route param types** in `types/navigation/routes.types.ts` for large apps.
5. **Validate params in hooks, not in screen components.** Extract a `use-<screen>-params.hook.ts` when param parsing is non-trivial.

---

## 17. Naming Conventions

Consistent naming eliminates guesswork about where files live and what they do. Use **kebab-case** file names with **responsibility suffixes**.

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

Directories use kebab-case and describe the domain or concern:

```text
components/
  ui/
  shared/
  screens/
  order-history/        # Domain with hyphen
hooks/
  auth/
  native/
services/
  push-notifications/   # Domain with hyphen
```

### Component naming inside files

Files use kebab-case, but the exported component uses PascalCase:

```tsx
// File: components/profile/profile-header.tsx
// Export: ProfileHeader

export function ProfileHeader() { /* ... */ }
```

### Why kebab-case files

- Works consistently across operating systems (macOS is case-insensitive by default)
- Matches URL segment conventions in Expo Router
- Avoids conflicts between `ProfileHeader.tsx` and `profileHeader.tsx`
- Easier to scan in file trees

### Prefix conventions for domain components

Use the domain name as a prefix for components within a domain folder:

```text
components/
  orders/
    order-card.tsx           # Not "card.tsx"
    order-status-badge.tsx   # Not "status-badge.tsx"
    order-timeline.tsx       # Not "timeline.tsx"
```

This prevents collisions when searching across domains and makes imports self-documenting:

```tsx
import { OrderCard } from "@/components/orders/order-card";
import { ProductCard } from "@/components/products/product-card";
```

### Index files

Use `index.ts` barrel exports sparingly. They are appropriate for:

- `components/ui/index.ts` — Re-exporting all UI primitives
- A domain folder with a clear public API

Avoid index files when:

- The folder has many files and the barrel becomes a maintenance burden
- It creates circular dependency risks
- Tree-shaking is important (barrel re-exports can defeat bundler optimizations)

### Avoid these names

- `utils.ts` — Hides responsibility. Name the specific concern.
- `helpers.ts` — Same problem. Use `format-date.lib.ts` or `parse-currency.lib.ts`.
- `common.ts` — Vague. Place in the appropriate layer with a descriptive name.
- `misc.ts` — A junk drawer signal.
- `index.tsx` outside of `app/` — Prefer named files over default exports from index.

---

## 18. Suffix Reference

Suffixes clarify a file's role at a glance. They help developers locate files by responsibility without opening them.

### Complete suffix table

| Suffix | Extension | Purpose | Example |
|--------|-----------|---------|---------|
| `.screen` | `.tsx` | Screen composition section | `home-hero.screen.tsx` |
| `.shared` | `.tsx` | Cross-domain reusable component | `error-fallback.shared.tsx` |
| `.hook` | `.ts` | Custom React hook | `use-auth.hook.ts` |
| `.service` | `.ts` | External communication / API | `product.service.ts` |
| `.store` | `.ts` | State management module | `cart.store.ts` |
| `.types` | `.ts` | Type definitions | `order.types.ts` |
| `.constants` | `.ts` | Static constant values | `app.constants.ts` |
| `.lib` | `.ts` | Pure utility / helper | `format-date.lib.ts` |
| `.schema` | `.ts` | Validation schema (Zod, Yup) | `login.schema.ts` |
| `.plugin` | `.js` | Expo config plugin | `with-camera.plugin.js` |
| `.test` | `.ts`/`.tsx` | Test file | `product.service.test.ts` |
| `.mock` | `.ts` | Test mock / fixture | `product.mock.ts` |

### When to use suffixes

Use suffixes when:

- The file lives in a layer folder and the suffix adds clarity (`services/auth/auth.service.ts`)
- Multiple file types exist for the same domain concept (`cart.store.ts`, `cart.types.ts`, `cart.service.ts`)
- The suffix prevents ambiguity (`profile-header.screen.tsx` vs `profile-header.tsx` in components)

### When to skip suffixes

Skip suffixes for:

- UI primitive components in `components/ui/` — `button.tsx` is clear enough without `.component.tsx`
- Domain components in `components/<domain>/` — `order-card.tsx` is self-descriptive
- React Native entry files — `_layout.tsx`, `index.tsx`
- Config files — `app.config.ts`, `metro.config.js`

### Suffix decision guide

```text
Is the file a component?
  ├── In components/ui/ → No suffix (button.tsx)
  ├── In components/shared/ → .shared.tsx
  ├── In components/screens/ → .screen.tsx
  └── In components/<domain>/ → No suffix (order-card.tsx)

Is the file logic?
  ├── React hook → .hook.ts
  ├── API/external call → .service.ts
  ├── State management → .store.ts
  └── Pure utility → .lib.ts

Is the file data/config?
  ├── Type definitions → .types.ts
  ├── Constants → .constants.ts
  ├── Validation → .schema.ts
  └── Expo plugin → .plugin.js
```

### Real-world example

A complete domain with all suffixes:

```text
components/
  orders/
    order-card.tsx
    order-list.tsx
    order-detail-header.tsx
  screens/
    orders-list.screen.tsx
    order-detail.screen.tsx
hooks/
  orders/
    use-orders.hook.ts
    use-order-detail.hook.ts
    use-order-actions.hook.ts
services/
  orders/
    order.service.ts
store/
  orders/
    order.store.ts
types/
  orders/
    order.types.ts
constants/
  orders/
    order.constants.ts
```

### Consistency over perfection

The most important rule is consistency within the project. If the team decides to use `.hook.ts`, use it everywhere. If the team prefers no suffix for hooks, skip it everywhere. Do not mix conventions.

---

## 19. Splitting Components

Components should be split by **responsibility**, not by line count alone. A 200-line component with a single clear purpose may be fine. A 100-line component mixing three responsibilities should be split.

### When to split a component

Split when:

- The component handles multiple visual regions with distinct purposes
- Logic obscures the rendering (state management tangled with markup)
- Internal subparts have meaningful names and boundaries
- Loading, error, and success states create a large conditional render tree
- The component accepts 10+ props that serve different sub-concerns

### When not to split

Do not split when:

- The child would wrap fewer than 15 lines with no meaningful boundary
- The abstraction name is weaker than reading the inline code
- The component is already focused on one responsibility
- Splitting would create tight coupling between parent and child with no reuse

### Split into what?

| Extracted piece | Where it goes |
|----------------|---------------|
| Visual sub-region | Same domain folder or `components/screens/` |
| Stateful logic | `hooks/<domain>/` |
| API communication | `services/<domain>/` |
| State management | `store/<domain>/` |
| Validation | `schema/<domain>/` |
| Formatting/parsing | `lib/<concern>/` |

### Example: Before splitting

```tsx
// components/products/product-detail.tsx — 250 lines
export function ProductDetail({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const [showReviews, setShowReviews] = useState(false);

  return (
    <ScrollView>
      {/* 40 lines: image gallery */}
      {/* 30 lines: product info */}
      {/* 40 lines: variant picker */}
      {/* 20 lines: quantity selector */}
      {/* 30 lines: add to cart button with loading */}
      {/* 50 lines: reviews section */}
    </ScrollView>
  );
}
```

### Example: After splitting

```tsx
// components/products/product-detail.tsx — 30 lines
export function ProductDetail({ product }: { product: Product }) {
  const { selectedVariant, setSelectedVariant, quantity, setQuantity, addToCart, isAdding } =
    useProductActions(product);

  return (
    <ScrollView>
      <ProductGallery images={product.images} />
      <ProductInfo product={product} />
      <ProductVariantPicker
        variants={product.variants}
        selected={selectedVariant}
        onSelect={setSelectedVariant}
      />
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton onPress={addToCart} loading={isAdding} />
      <ProductReviews productId={product.id} />
    </ScrollView>
  );
}
```

```tsx
// hooks/products/use-product-actions.hook.ts
export function useProductActions(product: Product) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const addToCart = useCallback(async () => {
    setIsAdding(true);
    try {
      addItem({ ...selectedVariant, quantity });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsAdding(false);
    }
  }, [selectedVariant, quantity, addItem]);

  return { selectedVariant, setSelectedVariant, quantity, setQuantity, addToCart, isAdding };
}
```

### Extracting sub-components

Keep extracted sub-components in the same domain folder:

```text
components/
  products/
    product-detail.tsx           # Parent compositor
    product-gallery.tsx          # Image carousel
    product-info.tsx             # Title, price, description
    product-variant-picker.tsx   # Size/color selector
    product-reviews.tsx          # Reviews list
```

### Prop drilling vs hooks

If splitting creates deep prop drilling:

1. **First, try composition.** Pass children or render props.
2. **Then, try a domain hook.** Let each sub-component fetch its own data.
3. **Last resort, use a domain store.** Zustand with selectors avoids unnecessary re-renders.

Do not use Context for component-level state sharing — it re-renders all consumers.

### Platform-specific splits

When a component needs significantly different behavior per platform:

```text
components/
  media/
    media-player.tsx             # Shared interface/logic
    media-player.ios.tsx         # iOS AVPlayer implementation
    media-player.android.tsx     # Android ExoPlayer implementation
```

Use platform splits only when `Platform.select` is insufficient — typically for native module differences or fundamentally different UI patterns.

---

## 20. Splitting Screens

Large screen files are the most common structural problem in React Native apps. A screen file that mixes layout, data fetching, interaction logic, and dense markup becomes impossible to maintain.

### When to split a screen

Split a route file when:

- It exceeds 150-200 lines
- It renders 3+ visually distinct sections
- It mixes data fetching, state management, and rendering in the same function
- It contains inline helper components that could stand alone
- Multiple developers need to work on different parts of the same screen

### How to split

1. **Identify visual sections.** Each major block of the screen becomes a screen section component.
2. **Extract to `components/screens/`.** Each section gets a `.screen.tsx` file.
3. **Move data fetching into the section** or into a domain hook.
4. **Keep the route file as a composition root.**

### Before: Monolithic screen

```tsx
// app/(tabs)/profile.tsx — 400+ lines
export default function ProfileScreen() {
  const { user, isLoading } = useProfile();
  const { posts, loadMore } = useUserPosts(user?.id);
  const [activeTab, setActiveTab] = useState("posts");

  if (isLoading) return <LoadingOverlay />;

  return (
    <ScrollView>
      {/* 50 lines of header markup */}
      <View>
        <Image source={{ uri: user.avatar }} />
        <Text>{user.name}</Text>
        <Text>{user.bio}</Text>
        <View style={styles.statsRow}>
          {/* 30 lines of stats */}
        </View>
        <Button title="Edit Profile" onPress={...} />
      </View>

      {/* 40 lines of tab bar */}
      <View style={styles.tabs}>
        {/* tab buttons */}
      </View>

      {/* 100+ lines of content based on active tab */}
      {activeTab === "posts" && (
        <FlatList data={posts} renderItem={...} />
      )}
      {activeTab === "saved" && (
        <SavedItemsList userId={user.id} />
      )}

      {/* 50 lines of footer */}
    </ScrollView>
  );
}
```

### After: Composed screen

```tsx
// app/(tabs)/profile.tsx — 20 lines
import { ScreenContainer } from "@/components/ui/screen-container";
import { ProfileHeader } from "@/components/screens/profile-header.screen";
import { ProfileTabs } from "@/components/screens/profile-tabs.screen";

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ProfileHeader />
      <ProfileTabs />
    </ScreenContainer>
  );
}
```

```tsx
// components/screens/profile-header.screen.tsx
import { View, Text, Image, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/profile/use-profile.hook";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeader() {
  const { user, isLoading } = useProfile();

  if (isLoading) return <ProfileHeaderSkeleton />;

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      <ProfileStats followers={user.followers} following={user.following} posts={user.postCount} />
      <Button title="Edit Profile" onPress={() => {}} variant="secondary" />
    </View>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width="60%" height={20} />
      <Skeleton width="80%" height={16} />
    </View>
  );
}
```

### Splitting rules

1. **Each section owns its loading and error states.** Do not hoist all loading states to the parent screen.
2. **Sections receive minimal props.** Ideally zero — they fetch their own data via hooks.
3. **Name sections by screen + role:** `profile-header.screen.tsx`, `profile-tabs.screen.tsx`.
4. **Keep the route file under 30 lines** after splitting.
5. **Do not split prematurely.** A screen with one section and 100 lines is fine as-is.

### FlatList and SectionList screens

For screens dominated by a single list, the route file may own the list directly. Split when:

- The list has a complex header that justifies extraction
- The list item renderer exceeds 50 lines
- The screen has both a list and non-list content

```tsx
// Keep list in route when it IS the screen
export default function OrdersScreen() {
  const { orders, isLoading } = useOrders();
  return (
    <FlatList
      data={orders}
      renderItem={({ item }) => <OrderCard order={item} />}
      ListEmptyComponent={<EmptyState title="No orders yet" />}
    />
  );
}
```

---

## 21. Native Config & Plugins

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

---

## 22. Native Module Wrappers

When using native modules (Expo packages or community libraries), wrap them in service or hook abstractions. This isolates platform dependencies and makes testing easier.

### Structure

```text
services/
  app/
    camera.service.ts
    notifications.service.ts
    sharing.service.ts
hooks/
  native/
    use-camera.hook.ts
    use-location.hook.ts
    use-notifications.hook.ts
lib/
  native/
    haptics.lib.ts
    linking.lib.ts
```

### Example: Camera service wrapper

```tsx
// services/app/camera.service.ts
import * as ImagePicker from "expo-image-picker";

export type CapturedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
};

export async function takePhoto(): Promise<CapturedImage | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

export async function pickImage(): Promise<CapturedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
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
    setError(null);
    const granted = await permission.request();
    if (!granted) {
      setError("Camera permission is required.");
      return;
    }

    try {
      const result = await takePhoto();
      if (result) setPhoto(result);
    } catch {
      setError("Failed to capture photo.");
    }
  }, [permission]);

  const pick = useCallback(async () => {
    setError(null);
    try {
      const result = await pickImage();
      if (result) setPhoto(result);
    } catch {
      setError("Failed to pick image.");
    }
  }, []);

  return { photo, capture, pick, error, clearPhoto: () => setPhoto(null) };
}
```

### Example: Notifications service

```tsx
// services/app/notifications.service.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
```

### Why wrap native modules

1. **Testability.** Mock `camera.service.ts` instead of mocking `expo-image-picker` internals.
2. **API stability.** When Expo updates a package API, you update one wrapper — not every consumer.
3. **Type safety.** Return your own typed domain objects instead of raw SDK types.
4. **Permission handling.** Centralize permission flows so every consumer handles denial consistently.
5. **Platform abstraction.** Hide iOS vs Android differences behind a single interface.

### Choosing service vs hook vs lib

| Wrapper type | Use when |
|-------------|----------|
| Service (`services/`) | The module performs async operations, has side effects, or communicates externally |
| Hook (`hooks/native/`) | The wrapper manages React state, subscriptions, or lifecycle |
| Lib (`lib/native/`) | The wrapper is a pure synchronous utility (e.g., haptics trigger, linking helper) |

### Rules

1. **One module, one wrapper.** Do not combine camera and location in a single service.
2. **Return domain types, not SDK types.** Consumers should not import from `expo-image-picker` or `expo-notifications` directly.
3. **Handle errors in the wrapper.** Return `null` or throw typed errors — do not let raw SDK exceptions propagate.
4. **Keep wrappers thin.** They should delegate, not add business logic.

---
