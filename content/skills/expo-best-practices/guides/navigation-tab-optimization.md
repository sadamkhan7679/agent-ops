---
title: Tab Navigator Optimization
impact: HIGH
tags: tabs, lazy-loading, navigation, performance
---

## Tab Navigator Optimization

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
