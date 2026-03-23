---
title: Touch Target Sizing
impact: LOW-MEDIUM
tags: accessibility, touch-targets, hitslop, tappable, a11y
---

## Touch Target Sizing

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
