---
title: UI Primitives
tags: components, ui, primitives, design-system
---

## UI Primitives

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
