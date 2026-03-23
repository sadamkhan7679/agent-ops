---
title: Safe Areas and Insets
impact: MEDIUM
tags: safe-area, insets, notch, dynamic-island, platform
---

## Safe Areas and Insets

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
