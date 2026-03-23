---
title: Image Handling with expo-image
impact: CRITICAL
tags: images, caching, blurhash, expo-image, performance
---

## Image Handling with expo-image

Images are often the largest assets in a mobile app. Without caching and proper placeholders, screens flash blank areas, re-download images on every mount, and consume excessive bandwidth.

**Incorrect (React Native Image with no caching strategy):**

```tsx
import { Image } from "react-native";

function Avatar({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: 48, height: 48, borderRadius: 24 }}
    />
  );
}
```

**Correct (expo-image with blurhash placeholder and caching):**

```tsx
import { Image } from "expo-image";

const blurhash = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

function Avatar({ uri, blurhash: hash = blurhash }: { uri: string; blurhash?: string }) {
  return (
    <Image
      source={uri}
      placeholder={{ blurhash: hash }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      style={{ width: 48, height: 48, borderRadius: 24 }}
    />
  );
}
```

**Correct (optimized image list with priority and recycling):**

```tsx
import { Image, type ImageProps } from "expo-image";

interface ProductImageProps {
  uri: string;
  priority?: ImageProps["priority"];
  size?: number;
}

function ProductImage({ uri, priority = "normal", size = 120 }: ProductImageProps) {
  return (
    <Image
      source={uri}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority={priority}
      recyclingKey={uri}
      placeholder={require("@/assets/images/placeholder.png")}
      placeholderContentFit="cover"
      transition={150}
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  );
}

// In a list — first visible items get high priority
function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <View style={styles.card}>
      <ProductImage
        uri={product.imageUrl}
        priority={index < 4 ? "high" : "normal"}
      />
      <Text>{product.name}</Text>
    </View>
  );
}
```

Key props:
- `cachePolicy="memory-disk"` — avoids re-downloads across sessions
- `recyclingKey` — prevents image flicker in recycled list cells
- `transition` — smooth fade-in instead of pop-in
- `priority="high"` — for above-the-fold images
