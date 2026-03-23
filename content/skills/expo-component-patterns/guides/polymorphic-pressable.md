---
title: Polymorphic Pressable Component
impact: HIGH
tags: polymorphic, pressable, as-prop, type-safety, generics
---

## Polymorphic Pressable Component

A pressable component that renders as different native elements while maintaining full type safety on the resulting props.

### Implementation

```tsx
import {
  type ElementType,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";

type PolymorphicProps<
  C extends ElementType,
  Props = object,
> = Props & {
  as?: C;
  children?: ReactNode;
  style?: ViewStyle;
} & Omit<ComponentPropsWithoutRef<C>, keyof Props | "as" | "children" | "style">;

type ButtonOwnProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type ButtonProps<C extends ElementType = typeof Pressable> = PolymorphicProps<
  C,
  ButtonOwnProps
>;

function Button<C extends ElementType = typeof Pressable>({
  as,
  variant = "primary",
  size = "md",
  style,
  children,
  ...props
}: ButtonProps<C>) {
  const Component = as || Pressable;

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 12, paddingVertical: 6 },
    md: { paddingHorizontal: 16, paddingVertical: 10 },
    lg: { paddingHorizontal: 24, paddingVertical: 14 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: "#007AFF" },
    secondary: { backgroundColor: "#E5E5EA" },
    ghost: { backgroundColor: "transparent" },
  };

  return (
    <Component
      style={[styles.base, variantStyles[variant], sizeStyles[size], style]}
      {...props}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
});
```

### Usage

```tsx
import { Link } from "expo-router";
import { TouchableOpacity } from "react-native";

// Renders as Pressable (default)
<Button variant="primary" onPress={handleSave}>
  <Text style={{ color: "#fff" }}>Save</Text>
</Button>

// Renders as Link — href prop is type-safe
<Button as={Link} href="/settings" variant="ghost">
  <Text>Settings</Text>
</Button>

// Renders as TouchableOpacity
<Button as={TouchableOpacity} activeOpacity={0.7} variant="secondary">
  <Text>Touch Me</Text>
</Button>
```
