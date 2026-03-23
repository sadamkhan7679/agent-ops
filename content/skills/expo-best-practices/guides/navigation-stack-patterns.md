---
title: Native Stack Navigation Patterns
impact: HIGH
tags: navigation, stack, expo-router, react-navigation, screens
---

## Native Stack Navigation Patterns

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
