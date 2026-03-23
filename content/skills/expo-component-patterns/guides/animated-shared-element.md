---
title: Shared Element Transitions
impact: HIGH
tags: animated, shared-element, reanimated, transition, navigation
---

## Shared Element Transitions

Shared element transitions animate an element from one screen to another, creating a fluid navigation experience. Uses Reanimated's shared transition API.

### Implementation with Reanimated SharedTransition

```tsx
import Animated, { SharedTransition, withSpring } from "react-native-reanimated";
import { Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";

const customTransition = SharedTransition.custom((values) => {
  "worklet";
  return {
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
    width: withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
  };
});

// List item
function ProductListItem({ product }: { product: Product }) {
  return (
    <Pressable onPress={() => router.push(`/products/${product.id}`)}>
      <Animated.View
        sharedTransitionTag={`product-${product.id}`}
        sharedTransitionStyle={customTransition}
      >
        <Image
          source={product.imageUrl}
          style={styles.listImage}
          contentFit="cover"
        />
      </Animated.View>
      <Text style={styles.name}>{product.name}</Text>
    </Pressable>
  );
}

// Detail screen
function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        sharedTransitionTag={`product-${id}`}
        sharedTransitionStyle={customTransition}
      >
        <Image
          source={product.imageUrl}
          style={styles.detailImage}
          contentFit="cover"
        />
      </Animated.View>
      <View style={styles.content}>
        <Text style={styles.title}>{product.name}</Text>
        <Text>{product.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listImage: { width: "100%", height: 200, borderRadius: 12 },
  detailImage: { width: "100%", height: 300 },
  content: { padding: 16 },
  name: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
});
```

Key requirements:
- Both screens must have `Animated.View` with matching `sharedTransitionTag`
- The tag must be unique per element (include the item ID)
- Use `SharedTransition.custom` for spring-based transitions
- Works with Expo Router when using native stack navigation
