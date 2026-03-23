---
title: Screen Reader Support
impact: LOW-MEDIUM
tags: accessibility, voiceover, talkback, screen-reader, a11y
---

## Screen Reader Support

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
