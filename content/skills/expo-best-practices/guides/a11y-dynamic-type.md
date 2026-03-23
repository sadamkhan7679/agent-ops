---
title: Dynamic Type Support
impact: LOW-MEDIUM
tags: accessibility, dynamic-type, font-scaling, a11y, text
---

## Dynamic Type Support

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
