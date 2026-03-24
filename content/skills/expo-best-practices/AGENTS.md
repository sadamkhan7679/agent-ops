# Expo Best Practices — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

Production-grade Expo and React Native best practices covering performance, navigation, state management, native APIs, platform-specific code, OTA updates, testing, and accessibility

## Table of Contents

1. [Performance Optimization: UI Thread Animations with Reanimated](#1-ui-thread-animations-with-reanimated)
2. [Performance Optimization: Image Handling with expo-image](#2-image-handling-with-expo-image)
3. [Performance Optimization: FlatList and FlashList Optimization](#3-flatlist-and-flashlist-optimization)
4. [Performance Optimization: Memory Leak Prevention](#4-memory-leak-prevention)
5. [Navigation Patterns: Deep Linking and Universal Links](#5-deep-linking-and-universal-links)
6. [Navigation Patterns: Native Stack Navigation Patterns](#6-native-stack-navigation-patterns)
7. [Navigation Patterns: Tab Navigator Optimization](#7-tab-navigator-optimization)
8. [State Management: AsyncStorage vs MMKV](#8-asyncstorage-vs-mmkv)
9. [State Management: Context Splitting for Mobile Performance](#9-context-splitting-for-mobile-performance)
10. [State Management: Offline-First Architecture](#10-offline-first-architecture)
11. [Custom Hooks for Native: App Lifecycle Hooks](#11-app-lifecycle-hooks)
12. [Custom Hooks for Native: Native API Hooks with Cleanup](#12-native-api-hooks-with-cleanup)
13. [Custom Hooks for Native: Permission Request Patterns](#13-permission-request-patterns)
14. [Platform-Specific Code: Gesture Handler Patterns](#14-gesture-handler-patterns)
15. [Platform-Specific Code: Safe Areas and Insets](#15-safe-areas-and-insets)
16. [Platform-Specific Code: Platform-Specific Code Patterns](#16-platform-specific-code-patterns)
17. [Error Handling & Resilience: Error Boundaries for React Native](#17-error-boundaries-for-react-native)
18. [Error Handling & Resilience: Crash Reporting with Sentry](#18-crash-reporting-with-sentry)
19. [Error Handling & Resilience: Network Resilience Patterns](#19-network-resilience-patterns)
20. [OTA Updates: EAS Update Configuration](#20-eas-update-configuration)
21. [OTA Updates: Runtime Versioning for OTA Safety](#21-runtime-versioning-for-ota-safety)
22. [Testing: Component Testing with RNTL](#22-component-testing-with-rntl)
23. [Testing: E2E Testing with Detox](#23-e2e-testing-with-detox)
24. [Accessibility: Dynamic Type Support](#24-dynamic-type-support)
25. [Accessibility: Screen Reader Support](#25-screen-reader-support)
26. [Accessibility: Touch Target Sizing](#26-touch-target-sizing)

---

## 1. UI Thread Animations with Reanimated

Animations running on the JS thread block user interactions and cause dropped frames. Reanimated runs animations on the UI thread via worklets, achieving consistent 60fps.

**Incorrect (JS thread animation — causes jank during heavy renders):**

```tsx
import { useRef, useEffect } from "react";
import { Animated } from "react-native";

function FadeIn({ children }: { children: ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true, // Helps, but still starts on JS thread
    }).start();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
```

**Correct (Reanimated worklet — runs entirely on UI thread):**

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useEffect, type ReactNode } from "react";

function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
```

**Correct (gesture-driven animation — no bridge crossings):**

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

function DraggableCard({ children }: { children: ReactNode }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

Rules:
- Use `useSharedValue` instead of `Animated.Value`
- Use `useAnimatedStyle` instead of `Animated.View` style interpolation
- Use `withTiming`, `withSpring`, `withDelay` for declarative animations
- Gesture callbacks with Reanimated run on UI thread — no bridge latency
- Never access React state inside worklets — use shared values

---

## 2. Image Handling with expo-image

Images are often the largest assets in a mobile app. Without caching and proper placeholders, screens flash blank areas, re-download images on every mount, and consume excessive bandwidth.

**Incorrect (React Native Image with no caching strategy):**

```tsx
import { Image } from "react-native";

function Avatar({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: 48, height: 48, borderRadius: 24 }}
    />
  );
}
```

**Correct (expo-image with blurhash placeholder and caching):**

```tsx
import { Image } from "expo-image";

const blurhash = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

function Avatar({ uri, blurhash: hash = blurhash }: { uri: string; blurhash?: string }) {
  return (
    <Image
      source={uri}
      placeholder={{ blurhash: hash }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      style={{ width: 48, height: 48, borderRadius: 24 }}
    />
  );
}
```

**Correct (optimized image list with priority and recycling):**

```tsx
import { Image, type ImageProps } from "expo-image";

interface ProductImageProps {
  uri: string;
  priority?: ImageProps["priority"];
  size?: number;
}

function ProductImage({ uri, priority = "normal", size = 120 }: ProductImageProps) {
  return (
    <Image
      source={uri}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority={priority}
      recyclingKey={uri}
      placeholder={require("@/assets/images/placeholder.png")}
      placeholderContentFit="cover"
      transition={150}
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  );
}

// In a list — first visible items get high priority
function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <View style={styles.card}>
      <ProductImage
        uri={product.imageUrl}
        priority={index < 4 ? "high" : "normal"}
      />
      <Text>{product.name}</Text>
    </View>
  );
}
```

Key props:
- `cachePolicy="memory-disk"` — avoids re-downloads across sessions
- `recyclingKey` — prevents image flicker in recycled list cells
- `transition` — smooth fade-in instead of pop-in
- `priority="high"` — for above-the-fold images

---

## 3. FlatList and FlashList Optimization

List performance is the single biggest factor in perceived app quality. Unoptimized lists cause dropped frames, janky scrolling, and excessive memory usage.

**Incorrect (unoptimized FlatList with inline functions):**

```tsx
function ProductList({ products }: { products: Product[] }) {
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
          <Text>{item.name}</Text>
          <Text>${item.price}</Text>
        </View>
      )}
    />
  );
}
```

**Correct (fully optimized FlatList):**

```tsx
import { memo, useCallback } from "react";
import { FlatList, type ListRenderItemInfo } from "react-native";

const ITEM_HEIGHT = 72;

const ProductItem = memo(function ProductItem({ item }: { item: Product }) {
  return (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
    </View>
  );
});

function ProductList({ products }: { products: Product[] }) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => <ProductItem item={item} />,
    []
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
      initialNumToRender={10}
    />
  );
}
```

**Even better — use FlashList for large datasets:**

```tsx
import { FlashList } from "@shopify/flash-list";

function ProductList({ products }: { products: Product[] }) {
  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductItem item={item} />,
    []
  );

  return (
    <FlashList
      data={products}
      renderItem={renderItem}
      estimatedItemSize={ITEM_HEIGHT}
      keyExtractor={(item) => item.id}
    />
  );
}
```

FlashList recycles views instead of unmounting/remounting, achieving near-native performance. Use it for lists over 100 items.

---

## 4. Memory Leak Prevention

Memory leaks in React Native cause gradual performance degradation, eventual crashes, and poor user experience. Every subscription, listener, and timer must be cleaned up.

**Incorrect (no cleanup — leaks on unmount):**

```tsx
function LocationTracker() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      (loc) => setLocation(loc)
    );
    // No cleanup — subscription leaks when component unmounts
  }, []);

  return <Text>{location?.coords.latitude}</Text>;
}
```

**Correct (proper cleanup for all subscription types):**

```tsx
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { AppState, type AppStateStatus } from "react-native";

function LocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startWatching() {
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );
    }

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, []);

  return <Text>{location?.coords.latitude}</Text>;
}
```

**Correct (AbortController for fetch requests):**

```tsx
function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      }
    }

    fetchProfile();

    return () => controller.abort();
  }, [userId]);

  return { profile, error };
}
```

**Correct (timer and event listener cleanup):**

```tsx
function useAppStateChange(onForeground: () => void) {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        onForeground();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [onForeground]);
}
```

Rules:
- Every `addEventListener` needs a matching `removeEventListener` or `subscription.remove()`
- Every `setTimeout`/`setInterval` needs `clearTimeout`/`clearInterval`
- Every `watchPositionAsync`, `watchHeadingAsync` etc. needs `subscription.remove()`
- Every `fetch` should use `AbortController` for cancellation

---

## 5. Deep Linking and Universal Links

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

---

## 6. Native Stack Navigation Patterns

Native stack uses platform navigation controllers (UINavigationController on iOS, Fragment on Android) for smooth transitions and native gestures. JS stack renders everything in JavaScript — slower and no native gesture support.

**Incorrect (JS stack for main navigation):**

```tsx
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

// JS stack — all transitions run on JS thread, no native back gesture
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}
```

**Correct (Native stack with Expo Router):**

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="details/[id]"
        options={{
          title: "Details",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          gestureDirection: "vertical",
        }}
      />
    </Stack>
  );
}
```

**Correct (typed screen params with Expo Router):**

```tsx
// app/details/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text>Detail for item {id}</Text>
    </View>
  );
}

// Navigating with type-safe params
import { router } from "expo-router";

function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable onPress={() => router.push(`/details/${product.id}`)}>
      <Text>{product.name}</Text>
    </Pressable>
  );
}
```

Rules:
- Always use native stack (`@react-navigation/native-stack` or Expo Router `Stack`) for main navigation
- Use `presentation: "modal"` for modal screens instead of custom overlays
- Set `gestureEnabled: true` for swipe-to-go-back on iOS
- Use JS stack only when you need fully custom transition animations

---

## 7. Tab Navigator Optimization

Tab navigators mount all tab screens by default. Heavy tabs that fetch data, start subscriptions, or render complex UIs waste resources when not visible.

**Incorrect (all tabs eagerly mounted and stay mounted):**

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
// All 4 tabs mount immediately, even if user never visits them
```

**Correct (lazy tabs with selective unmounting):**

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Home, Search, Bell, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        lazy: true, // Only mount tab when first visited
        headerShown: false,
        tabBarActiveTintColor: "#0066FF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          // Unmount when switching away — frees memory for heavy screens
          unmountOnBlur: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Correct (refresh data when tab regains focus):**

```tsx
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function NotificationsScreen() {
  useFocusEffect(
    useCallback(() => {
      // Fetch fresh data when tab becomes visible
      refreshNotifications();

      return () => {
        // Cleanup when tab loses focus
        markNotificationsAsSeen();
      };
    }, [])
  );

  return <NotificationList />;
}
```

Rules:
- Always set `lazy: true` on tab navigators
- Use `unmountOnBlur: true` for memory-heavy tabs (maps, video, real-time feeds)
- Use `useFocusEffect` to refresh data when a tab regains focus
- Keep tab screens lightweight — extract heavy content into child components

---

## 8. AsyncStorage vs MMKV

AsyncStorage is async, JSON-serialized, and slow for frequent reads. MMKV is synchronous, binary-serialized, and 30x faster — use it for anything accessed during render.

**Incorrect (AsyncStorage with JSON.parse in component):**

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Async read causes flash of default state
    AsyncStorage.getItem("settings").then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  const update = async (next: Settings) => {
    setSettings(next);
    await AsyncStorage.setItem("settings", JSON.stringify(next));
  };

  return { settings, update };
}
```

**Correct (MMKV with typed synchronous access):**

```tsx
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

// Typed storage helpers
function getItem<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (raw === undefined) return null;
  return JSON.parse(raw) as T;
}

function setItem<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  storage.delete(key);
}

// Hook with synchronous initial value — no flash
function useMMKVStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    return getItem<T>(key) ?? defaultValue;
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        setItem(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update] as const;
}
```

**Correct (MMKV as Zustand persistence layer):**

```tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}));

interface SettingsStore {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleNotifications: () => void;
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "system",
      notifications: true,
      setTheme: (theme) => set({ theme }),
      toggleNotifications: () => set((s) => ({ notifications: !s.notifications })),
    }),
    { name: "settings", storage: mmkvStorage }
  )
);
```

Rules:
- Use MMKV for anything read during render (settings, tokens, user preferences)
- Use AsyncStorage only for large, infrequently-accessed blobs
- Always provide synchronous initial values to prevent layout flash
- Wrap MMKV in typed helpers to avoid raw string keys

---

## 9. Context Splitting for Mobile Performance

On mobile, unnecessary re-renders are more expensive than on web. A single context with mixed concerns re-renders every consumer on every state change, causing visible jank on lower-end devices.

**Incorrect (single context re-renders everything):**

```tsx
interface AppContextValue {
  user: User | null;
  theme: "light" | "dark";
  cart: CartItem[];
  notifications: Notification[];
  setUser: (user: User | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  addToCart: (item: CartItem) => void;
  markRead: (id: string) => void;
}

// Every component consuming this re-renders when ANY value changes
const AppContext = createContext<AppContextValue | null>(null);
```

**Correct (split by concern — state and dispatch separated):**

```tsx
import { createContext, use, useReducer, type ReactNode, type Dispatch } from "react";

// Cart state context
interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: "ADD"; payload: CartItem }
  | { type: "REMOVE"; payload: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD":
      return {
        items: [...state.items, action.payload],
        total: state.total + action.payload.price,
      };
    case "REMOVE": {
      const item = state.items.find((i) => i.id === action.payload);
      return {
        items: state.items.filter((i) => i.id !== action.payload),
        total: state.total - (item?.price ?? 0),
      };
    }
    case "CLEAR":
      return { items: [], total: 0 };
  }
}

const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}

// Components that only dispatch never re-render on state changes
function useCartDispatch() {
  const ctx = use(CartDispatchContext);
  if (!ctx) throw new Error("useCartDispatch must be within CartProvider");
  return ctx;
}

function useCartState() {
  const ctx = use(CartStateContext);
  if (!ctx) throw new Error("useCartState must be within CartProvider");
  return ctx;
}
```

Rules:
- Split state and dispatch into separate contexts
- Group related state (cart state) separately from unrelated state (auth, theme)
- Components that only trigger actions (buttons) should consume dispatch context only
- Components that only display data should consume state context only
- Consider Zustand or Jotai for complex state with many selectors

---

## 10. Offline-First Architecture

Mobile users frequently lose connectivity. An offline-first approach queues mutations locally, applies them optimistically, and syncs when the network returns.

**Incorrect (mutations fail silently offline):**

```tsx
async function addComment(postId: string, text: string) {
  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  // If offline, this throws and the comment is lost
  return res.json();
}
```

**Correct (offline mutation queue with optimistic UI):**

```tsx
import NetInfo from "@react-native-community/netinfo";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

interface PendingMutation {
  id: string;
  url: string;
  method: "POST" | "PUT" | "DELETE";
  body: string;
  createdAt: number;
  retryCount: number;
}

// Queue management
function getPendingMutations(): PendingMutation[] {
  const raw = storage.getString("pending-mutations");
  return raw ? JSON.parse(raw) : [];
}

function savePendingMutations(mutations: PendingMutation[]): void {
  storage.set("pending-mutations", JSON.stringify(mutations));
}

function queueMutation(mutation: Omit<PendingMutation, "id" | "createdAt" | "retryCount">) {
  const pending = getPendingMutations();
  pending.push({
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
  });
  savePendingMutations(pending);
}

// Sync engine — runs when network returns
async function syncPendingMutations() {
  const pending = getPendingMutations();
  const failed: PendingMutation[] = [];

  for (const mutation of pending) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: mutation.body,
      });
      if (!res.ok && mutation.retryCount < 3) {
        failed.push({ ...mutation, retryCount: mutation.retryCount + 1 });
      }
    } catch {
      if (mutation.retryCount < 3) {
        failed.push({ ...mutation, retryCount: mutation.retryCount + 1 });
      }
    }
  }

  savePendingMutations(failed);
}

// Hook that listens for connectivity changes
function useOfflineSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        syncPendingMutations();
      }
    });
    return () => unsubscribe();
  }, []);
}
```

**Correct (optimistic update in component):**

```tsx
function useAddComment(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);

  const addComment = useCallback(
    async (text: string) => {
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        text,
        author: currentUser,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      // Optimistic: show immediately
      setComments((prev) => [optimistic, ...prev]);

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        try {
          const real = await createComment(postId, text);
          setComments((prev) => prev.map((c) => (c.id === optimistic.id ? real : c)));
        } catch {
          queueMutation({
            url: `/api/posts/${postId}/comments`,
            method: "POST",
            body: JSON.stringify({ text }),
          });
        }
      } else {
        queueMutation({
          url: `/api/posts/${postId}/comments`,
          method: "POST",
          body: JSON.stringify({ text }),
        });
      }
    },
    [postId]
  );

  return { comments, addComment };
}
```

Rules:
- Queue mutations in MMKV when offline
- Apply changes optimistically to the UI immediately
- Sync the queue when connectivity returns via NetInfo listener
- Cap retry attempts to prevent infinite loops on permanent failures
- Show pending state indicators (spinner, dimmed text) for unsynced items

---

## 11. App Lifecycle Hooks

React Native apps transition between active, background, and inactive states. Detecting these transitions is critical for pausing work, refreshing data, and saving state.

**Correct (useAppState hook with proper cleanup):**

```tsx
import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";

function useAppState(callbacks: {
  onForeground?: () => void;
  onBackground?: () => void;
}) {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;

        if (prev.match(/inactive|background/) && nextState === "active") {
          callbacks.onForeground?.();
        }

        if (prev === "active" && nextState.match(/inactive|background/)) {
          callbacks.onBackground?.();
        }

        appStateRef.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [callbacks]);

  return appStateRef;
}

// Usage — refresh data on foreground, save draft on background
function EditorScreen() {
  useAppState({
    onForeground: () => {
      refreshDocument();
    },
    onBackground: () => {
      saveDraft();
    },
  });

  return <Editor />;
}
```

**Correct (useKeepAwake for preventing sleep during critical operations):**

```tsx
import { useKeepAwake } from "expo-keep-awake";

function VideoRecordingScreen() {
  // Prevents screen from sleeping while recording
  useKeepAwake();

  return <CameraView recording />;
}
```

Rules:
- Use `AppState.addEventListener` with cleanup via `subscription.remove()`
- Track previous state with a ref to detect specific transitions
- Save unsaved work on background transition
- Refresh stale data on foreground transition
- Use `useKeepAwake` for long-running operations (recording, downloads)

---

## 12. Native API Hooks with Cleanup

Native APIs (camera, location, sensors) require subscriptions that must be cleaned up on unmount. Forgetting cleanup leaks native resources, drains battery, and eventually crashes the app.

**Correct (useLocation with loading, error, and cleanup):**

```tsx
import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface UseLocationResult {
  location: Location.LocationObject | null;
  error: string | null;
  isLoading: boolean;
}

function useLocation(options?: { watch?: boolean }): UseLocationResult {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let mounted = true;

    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (mounted) {
          setError("Location permission denied");
          setIsLoading(false);
        }
        return;
      }

      if (options?.watch) {
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
          (loc) => {
            if (mounted) {
              setLocation(loc);
              setIsLoading(false);
            }
          }
        );
      } else {
        const loc = await Location.getCurrentPositionAsync({});
        if (mounted) {
          setLocation(loc);
          setIsLoading(false);
        }
      }
    }

    init().catch((err) => {
      if (mounted) {
        setError(err instanceof Error ? err.message : "Location error");
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [options?.watch]);

  return { location, error, isLoading };
}
```

**Correct (useCamera with ref and permissions):**

```tsx
import { useRef, useState, useCallback } from "react";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";

function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = useCallback(async (): Promise<CameraCapturedPicture | null> => {
    if (!cameraRef.current || isCapturing) return null;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      return photo ?? null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    cameraRef,
    permission,
    requestPermission,
    takePicture,
    isCapturing,
  };
}
```

Rules:
- Always check and request permissions before accessing native APIs
- Use a `mounted` flag to prevent state updates after unmount
- Return cleanup functions from useEffect for every subscription
- Expose loading and error states alongside the data
- Use refs for imperative native APIs (camera, audio)

---

## 13. Permission Request Patterns

Mobile permissions require explaining why you need access before prompting. A cold permission request with no context has significantly lower grant rates.

**Incorrect (requesting permission with no context):**

```tsx
function CameraScreen() {
  useEffect(() => {
    // Cold request — user sees system dialog with no explanation
    Camera.requestCameraPermissionsAsync();
  }, []);
}
```

**Correct (pre-prompt rationale then system dialog):**

```tsx
import { useState, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Camera from "expo-camera";

type PermissionStatus = "undetermined" | "granted" | "denied";

function usePermission(config: {
  check: () => Promise<{ status: string }>;
  request: () => Promise<{ status: string }>;
  rationale: { title: string; message: string };
}) {
  const [status, setStatus] = useState<PermissionStatus>("undetermined");

  const checkPermission = useCallback(async () => {
    const result = await config.check();
    const mapped = result.status === "granted" ? "granted" : result.status === "denied" ? "denied" : "undetermined";
    setStatus(mapped);
    return mapped;
  }, [config]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const current = await config.check();

    if (current.status === "granted") {
      setStatus("granted");
      return true;
    }

    // Show rationale before system prompt
    return new Promise((resolve) => {
      Alert.alert(config.rationale.title, config.rationale.message, [
        { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Continue",
          onPress: async () => {
            const result = await config.request();
            if (result.status === "granted") {
              setStatus("granted");
              resolve(true);
            } else {
              setStatus("denied");
              // On iOS, after denial, must open Settings
              Alert.alert(
                "Permission Required",
                "Please enable this permission in Settings.",
                [
                  { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      Linking.openSettings();
                      resolve(false);
                    },
                  },
                ]
              );
            }
          },
        },
      ]);
    });
  }, [config]);

  return { status, checkPermission, requestPermission };
}

// Usage
function ScannerScreen() {
  const camera = usePermission({
    check: Camera.getCameraPermissionsAsync,
    request: Camera.requestCameraPermissionsAsync,
    rationale: {
      title: "Camera Access Needed",
      message: "We need camera access to scan barcodes and QR codes.",
    },
  });

  if (camera.status !== "granted") {
    return (
      <View style={styles.center}>
        <Text>Camera access is required to scan items.</Text>
        <Button title="Grant Access" onPress={camera.requestPermission} />
      </View>
    );
  }

  return <CameraView style={styles.camera} />;
}
```

Rules:
- Always show a rationale dialog before the system permission prompt
- Handle the "denied" state by offering to open Settings
- Check permission status on mount, don't assume it's unchanged
- On iOS, permissions can only be requested once — after denial, redirect to Settings
- Group related permissions (camera + microphone for video) in a single flow

---

## 14. Gesture Handler Patterns

React Native's built-in touch system runs on the JS thread and conflicts with native scroll views. `react-native-gesture-handler` runs gestures on the native thread for responsive, conflict-free interactions.

**Incorrect (JS thread gesture handling):**

```tsx
import { PanResponder } from "react-native";

// PanResponder runs on JS thread — laggy and conflicts with ScrollView
const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: () => true,
  onPanResponderMove: (_, gestureState) => {
    // Runs on JS thread — dropped frames during heavy renders
    setPosition({ x: gestureState.dx, y: gestureState.dy });
  },
});
```

**Correct (Gesture Handler + Reanimated on UI thread):**

```tsx
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

function SwipeToDelete({ onDelete, children }: {
  onDelete: () => void;
  children: ReactNode;
}) {
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -120;

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Clamp to left swipe only
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withSpring(-300);
        runOnJS(onDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.deleteBackground}>
        <Text style={styles.deleteText}>Delete</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```

**Correct (composed gestures — pinch + pan):**

```tsx
function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.Image source={{ uri }} style={[styles.image, animatedStyle]} />
    </GestureDetector>
  );
}
```

Rules:
- Use `react-native-gesture-handler` instead of `PanResponder`
- Combine with Reanimated for UI thread gesture-driven animations
- Use `Gesture.Simultaneous` for multi-gesture interactions (pinch + pan)
- Use `activeOffsetX`/`activeOffsetY` to prevent gesture conflicts with scroll views
- Use `runOnJS` to call React state setters from worklets

---

## 15. Safe Areas and Insets

Modern phones have notches, dynamic islands, home indicators, and rounded corners. Content that ignores safe areas gets clipped or hidden behind system UI.

**Incorrect (hardcoded padding for notch):**

```tsx
function Header() {
  return (
    <View style={{ paddingTop: 44, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>My App</Text>
    </View>
  );
}
// 44px is wrong on Android, wrong on iPad, wrong on Dynamic Island iPhones
```

**Correct (useSafeAreaInsets for precise insets):**

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>My App</Text>
    </View>
  );
}

function BottomActions() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}
```

**Correct (SafeAreaView for full-screen layouts):**

```tsx
import { SafeAreaView } from "react-native-safe-area-context";

function ScreenContainer({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {children}
    </SafeAreaView>
  );
}

// Root layout must include SafeAreaProvider
// app/_layout.tsx
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack />
    </SafeAreaProvider>
  );
}
```

Rules:
- Wrap root layout in `SafeAreaProvider`
- Use `useSafeAreaInsets` when you need fine-grained control (custom headers, FABs)
- Use `SafeAreaView` with `edges` prop for full-screen containers
- Use `Math.max(insets.bottom, 16)` to ensure minimum spacing even on devices without home indicator
- Never hardcode inset values — they vary by device

---

## 16. Platform-Specific Code Patterns

iOS and Android have different UI conventions, shadow APIs, and behavioral expectations. Platform-aware code delivers a native feel on both.

**Using Platform.select for inline differences:**

```tsx
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusBarPadding: {
    paddingTop: Platform.OS === "ios" ? 44 : 0,
  },
});
```

**Using platform-specific file extensions:**

```
components/
  date-picker.tsx          # Shared interface
  date-picker.ios.tsx      # iOS implementation
  date-picker.android.tsx  # Android implementation
```

```tsx
// date-picker.ios.tsx
import DateTimePicker from "@react-native-community/datetimepicker";

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="spinner"  // iOS-native wheel picker
      onChange={(_, date) => date && onChange(date)}
    />
  );
}

// date-picker.android.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <Text>{value.toLocaleDateString()}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"  // Android Material dialog
          onChange={(_, date) => {
            setShow(false);
            if (date) onChange(date);
          }}
        />
      )}
    </>
  );
}

// Import resolves to the correct file automatically
import { DatePicker } from "@/components/date-picker";
```

Rules:
- Use `Platform.select` for small style differences (shadows, padding)
- Use `.ios.tsx` / `.android.tsx` file extensions for fundamentally different implementations
- Keep the exported interface identical across platform files
- Prefer `Platform.select` over `Platform.OS === "ios" ? x : y` for readability

---

## 17. Error Boundaries for React Native

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

---

## 18. Crash Reporting with Sentry

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

---

## 19. Network Resilience Patterns

Mobile networks are unreliable — tunnels, elevators, congested cells. Every network call needs timeout handling, retry logic, and offline detection.

**Correct (fetch wrapper with timeout and retry):**

```tsx
interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

async function resilientFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 10000, retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) return response;

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new ApiError(response.status, await response.text());
      }

      // Retry server errors (5xx)
      if (attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      throw new ApiError(response.status, "Server error after retries");
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) throw error;

      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < retries) {
          await delay(retryDelay * Math.pow(2, attempt));
          continue;
        }
        throw new NetworkError("Request timed out");
      }

      if (attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt));
        continue;
      }

      throw new NetworkError("Network request failed");
    }
  }

  throw new NetworkError("Unexpected retry exit");
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Correct (useNetworkStatus hook):**

```tsx
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useState, useEffect } from "react";

function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}

// Offline banner component
function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>You are offline. Changes will sync when reconnected.</Text>
    </View>
  );
}
```

Rules:
- Always set timeouts on fetch (10s default, 30s for uploads)
- Use exponential backoff for retries (1s, 2s, 4s)
- Don't retry 4xx errors — they won't succeed on retry
- Show offline state to users with a persistent banner
- Queue mutations when offline (see offline-first guide)

---

## 20. EAS Update Configuration

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

---

## 21. Runtime Versioning for OTA Safety

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

---

## 22. Component Testing with RNTL

RNTL renders components in a simulated native environment, enabling tests that mirror user interactions without a device.

**Correct (component test with user interactions):**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { CounterCard } from "@/components/counter-card";

describe("CounterCard", () => {
  it("renders initial count", () => {
    render(<CounterCard initialCount={5} />);

    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("Counter")).toBeTruthy();
  });

  it("increments on press", () => {
    render(<CounterCard initialCount={0} />);

    fireEvent.press(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("calls onMaxReached when hitting limit", () => {
    const onMaxReached = jest.fn();
    render(<CounterCard initialCount={9} max={10} onMaxReached={onMaxReached} />);

    fireEvent.press(screen.getByRole("button", { name: "Increment" }));
    expect(onMaxReached).toHaveBeenCalledTimes(1);
  });
});
```

**Correct (testing async operations):**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ProfileScreen } from "@/components/screens/profile-screen";

// Mock the API
jest.mock("@/services/user/user.service", () => ({
  fetchUserProfile: jest.fn().mockResolvedValue({
    name: "Jane Doe",
    email: "jane@example.com",
  }),
}));

describe("ProfileScreen", () => {
  it("shows loading then profile data", async () => {
    render(<ProfileScreen userId="123" />);

    // Loading state
    expect(screen.getByTestId("loading-skeleton")).toBeTruthy();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeTruthy();
    });

    expect(screen.getByText("jane@example.com")).toBeTruthy();
    expect(screen.queryByTestId("loading-skeleton")).toBeNull();
  });
});
```

**Correct (testing form submission):**

```tsx
describe("ContactForm", () => {
  it("submits with valid data", async () => {
    const onSubmit = jest.fn();
    render(<ContactForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText("Name"), "John");
    fireEvent.changeText(screen.getByLabelText("Email"), "john@example.com");
    fireEvent.changeText(screen.getByLabelText("Message"), "Hello!");
    fireEvent.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "John",
        email: "john@example.com",
        message: "Hello!",
      });
    });
  });
});
```

Rules:
- Query by accessibility role and label first (`getByRole`, `getByLabelText`)
- Fall back to `getByTestId` for elements without semantic roles
- Use `waitFor` for any assertion after async operations
- Mock services, not components — test real rendering behavior
- Use `screen.queryBy*` (returns null) to assert absence

---

## 23. E2E Testing with Detox

Detox runs E2E tests on real simulators/emulators with native-level synchronization. Unlike Appium, it automatically waits for animations, network calls, and timers to settle.

**Correct (Detox test setup):**

```tsx
// e2e/login.test.ts
describe("Login Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should show login screen", async () => {
    await expect(element(by.id("login-screen"))).toBeVisible();
    await expect(element(by.id("email-input"))).toBeVisible();
    await expect(element(by.id("password-input"))).toBeVisible();
  });

  it("should show error for invalid credentials", async () => {
    await element(by.id("email-input")).typeText("bad@email.com");
    await element(by.id("password-input")).typeText("wrongpassword");
    await element(by.id("login-button")).tap();

    await expect(element(by.id("error-message"))).toBeVisible();
    await expect(element(by.text("Invalid credentials"))).toBeVisible();
  });

  it("should navigate to home on successful login", async () => {
    await element(by.id("email-input")).typeText("user@example.com");
    await element(by.id("password-input")).typeText("correctpassword");
    await element(by.id("login-button")).tap();

    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

**Correct (adding testID to components for Detox):**

```tsx
function LoginScreen() {
  return (
    <View testID="login-screen" style={styles.container}>
      <TextInput
        testID="email-input"
        placeholder="Email"
        accessibilityLabel="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        testID="password-input"
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
      />
      <Pressable testID="login-button" onPress={handleLogin}>
        <Text>Log In</Text>
      </Pressable>
      {error && (
        <Text testID="error-message" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
```

Rules:
- Add `testID` props to all interactive elements and key landmarks
- Use `waitFor(...).toBeVisible().withTimeout()` for async transitions
- Use `device.reloadReactNative()` in `beforeEach` for clean state
- Keep `testID` values kebab-case and descriptive
- Never use text matchers for dynamic content — use `testID` instead

---

## 24. Dynamic Type Support

Users with low vision rely on system font scaling (Dynamic Type on iOS, Font Size on Android). Apps that don't support it are unusable for these users.

**Incorrect (fixed font sizes that ignore system scaling):**

```tsx
function ProfileHeader({ name }: { name: string }) {
  return (
    <View>
      {/* allowFontScaling defaults to true, but no layout adaptation */}
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{name}</Text>
      {/* This will overflow at large text sizes */}
      <View style={{ flexDirection: "row", height: 32 }}>
        <Text style={{ fontSize: 14 }}>Following: 142</Text>
        <Text style={{ fontSize: 14, marginLeft: 16 }}>Followers: 1.2K</Text>
      </View>
    </View>
  );
}
```

**Correct (adaptive layout for scaled fonts):**

```tsx
import { useWindowDimensions, PixelRatio } from "react-native";

function ProfileHeader({ name }: { name: string }) {
  const fontScale = PixelRatio.getFontScale();
  const isLargeText = fontScale > 1.3;

  return (
    <View style={styles.container}>
      <Text
        style={styles.name}
        numberOfLines={2}
        adjustsFontSizeToFit={false}
        maxFontSizeMultiplier={1.8} // Cap at 1.8x to prevent layout breakage
      >
        {name}
      </Text>
      <View style={[
        styles.stats,
        // Switch to vertical layout when text is very large
        isLargeText && styles.statsVertical,
      ]}>
        <Text style={styles.stat} maxFontSizeMultiplier={1.5}>
          Following: 142
        </Text>
        <Text style={styles.stat} maxFontSizeMultiplier={1.5}>
          Followers: 1.2K
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold" },
  stats: { flexDirection: "row", gap: 16, marginTop: 8 },
  statsVertical: { flexDirection: "column", gap: 4 },
  stat: { fontSize: 14, color: "#666" },
});
```

**Correct (scaled spacing utility):**

```tsx
import { PixelRatio } from "react-native";

// Scale spacing proportionally with font scale, but less aggressively
function scaledSpacing(base: number): number {
  const fontScale = PixelRatio.getFontScale();
  return base * Math.min(fontScale, 1.5); // Cap spacing scale at 1.5x
}

// Usage
const dynamicStyles = {
  padding: scaledSpacing(16),
  marginBottom: scaledSpacing(8),
  minHeight: scaledSpacing(44), // Touch targets scale too
};
```

Rules:
- Never set `allowFontScaling={false}` globally — only on specific decorative text
- Use `maxFontSizeMultiplier` (1.5-2.0) to cap scaling per element
- Switch horizontal layouts to vertical when `PixelRatio.getFontScale() > 1.3`
- Use `numberOfLines` to prevent text overflow in constrained containers
- Test with system font size set to maximum on both iOS and Android
- Scale touch targets proportionally with font scale

---

## 25. Screen Reader Support

VoiceOver (iOS) and TalkBack (Android) read the UI aloud for visually impaired users. Without proper accessibility props, these tools read meaningless content or skip elements entirely.

**Incorrect (no accessibility information):**

```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable onPress={() => navigate(product.id)}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View>
        <Text>{product.name}</Text>
        <Text>${product.price}</Text>
      </View>
      <View style={styles.ratingStars}>
        {/* Screen reader says "star star star star" */}
        {Array.from({ length: product.rating }).map((_, i) => (
          <Text key={i}>★</Text>
        ))}
      </View>
    </Pressable>
  );
}
```

**Correct (full accessibility annotations):**

```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable
      onPress={() => navigate(product.id)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, $${product.price}, ${product.rating} out of 5 stars`}
      accessibilityHint="Opens product details"
    >
      <Image
        source={{ uri: product.image }}
        style={styles.image}
        accessibilityIgnoresInvertColors
        accessible={false} // Parent handles the label
      />
      <View accessible={false}>
        <Text>{product.name}</Text>
        <Text>${product.price}</Text>
      </View>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Rating: ${product.rating} out of 5`}
      >
        {Array.from({ length: product.rating }).map((_, i) => (
          <Text key={i} importantForAccessibility="no">★</Text>
        ))}
      </View>
    </Pressable>
  );
}
```

**Correct (dynamic state announcements):**

```tsx
import { AccessibilityInfo } from "react-native";

function useAccessibilityAnnounce() {
  return useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);
}

// Usage
function CartButton({ count }: { count: number }) {
  const announce = useAccessibilityAnnounce();

  const addToCart = () => {
    addItem();
    announce(`Item added to cart. Cart now has ${count + 1} items.`);
  };

  return (
    <Pressable
      onPress={addToCart}
      accessibilityRole="button"
      accessibilityLabel={`Add to cart. Cart has ${count} items`}
      accessibilityState={{ disabled: false }}
    >
      <Text>Add to Cart ({count})</Text>
    </Pressable>
  );
}
```

Rules:
- Set `accessibilityRole` on all interactive elements (button, link, checkbox, switch)
- Use `accessibilityLabel` for custom readable descriptions
- Use `accessibilityHint` to explain what happens on activation
- Use `accessibilityState` for dynamic states (disabled, checked, selected, expanded)
- Group related elements with `accessible` on the parent, `accessible={false}` on children
- Use `AccessibilityInfo.announceForAccessibility` for dynamic updates

---

## 26. Touch Target Sizing

Apple and Google require minimum 44x44pt touch targets. Small buttons frustrate all users and are unusable for people with motor impairments.

**Incorrect (tiny touch target):**

```tsx
function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Pressable onPress={onClose}>
      {/* 16x16 icon with no extra touch area */}
      <XIcon size={16} color="#999" />
    </Pressable>
  );
}
```

**Correct (minimum 44x44 with hitSlop):**

```tsx
function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Pressable
      onPress={onClose}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.closeButton}
      accessibilityRole="button"
      accessibilityLabel="Close"
    >
      <XIcon size={20} color="#666" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

**Correct (icon button with proper sizing):**

```tsx
interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  label: string;
  size?: number;
}

function IconButton({ icon, onPress, label, size = 44 }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: size / 2,
        },
        pressed && { opacity: 0.6, backgroundColor: "rgba(0,0,0,0.05)" },
      ]}
    >
      {icon}
    </Pressable>
  );
}
```

Rules:
- All tappable elements must be at least 44x44 points
- Use `hitSlop` to expand touch area beyond visual bounds
- Use `Pressable` over `TouchableOpacity` — better accessibility defaults
- Provide `accessibilityLabel` on icon-only buttons
- Space tappable elements at least 8pt apart to prevent mistaps

---
