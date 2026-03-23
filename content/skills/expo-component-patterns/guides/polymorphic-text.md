---
title: Polymorphic Text with Variants
impact: MEDIUM
tags: polymorphic, text, typography, variants, design-system
---

## Polymorphic Text with Variants

A Text component with variant-based typography that maps to consistent font sizes, weights, and line heights across the app.

### Implementation

```tsx
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";

type Variant = "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption" | "label" | "overline";

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle["textAlign"];
  weight?: TextStyle["fontWeight"];
}

const variantStyles: Record<Variant, TextStyle> = {
  h1: { fontSize: 32, fontWeight: "700", lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "600", lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
  label: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  overline: { fontSize: 12, fontWeight: "600", lineHeight: 16, letterSpacing: 1, textTransform: "uppercase" },
};

function AppText({
  variant = "body",
  color,
  align,
  weight,
  style,
  ...props
}: AppTextProps) {
  return (
    <RNText
      style={[
        variantStyles[variant],
        color ? { color } : undefined,
        align ? { textAlign: align } : undefined,
        weight ? { fontWeight: weight } : undefined,
        style,
      ]}
      maxFontSizeMultiplier={1.5}
      {...props}
    />
  );
}

export { AppText as Text };
```

### Usage

```tsx
import { Text } from "@/components/ui/text";

function ProfileHeader({ user }: { user: User }) {
  return (
    <View style={{ gap: 4 }}>
      <Text variant="h2">{user.name}</Text>
      <Text variant="bodySmall" color="#666">{user.bio}</Text>
      <Text variant="overline" color="#999">Member since 2024</Text>
    </View>
  );
}
```

Set `maxFontSizeMultiplier` on the base component to ensure Dynamic Type support while preventing extreme layout breakage.
