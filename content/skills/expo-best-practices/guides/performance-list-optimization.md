---
title: FlatList and FlashList Optimization
impact: CRITICAL
tags: flatlist, flashlist, scrolling, performance, virtualization
---

## FlatList and FlashList Optimization

List performance is the single biggest factor in perceived app quality. Unoptimized lists cause dropped frames, janky scrolling, and excessive memory usage.

**Incorrect (unoptimized FlatList with inline functions):**

```tsx
function ProductList({ products }: { products: Product[] }) {
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
          <Text>{item.name}</Text>
          <Text>${item.price}</Text>
        </View>
      )}
    />
  );
}
```

**Correct (fully optimized FlatList):**

```tsx
import { memo, useCallback } from "react";
import { FlatList, type ListRenderItemInfo } from "react-native";

const ITEM_HEIGHT = 72;

const ProductItem = memo(function ProductItem({ item }: { item: Product }) {
  return (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
    </View>
  );
});

function ProductList({ products }: { products: Product[] }) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => <ProductItem item={item} />,
    []
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
      initialNumToRender={10}
    />
  );
}
```

**Even better — use FlashList for large datasets:**

```tsx
import { FlashList } from "@shopify/flash-list";

function ProductList({ products }: { products: Product[] }) {
  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductItem item={item} />,
    []
  );

  return (
    <FlashList
      data={products}
      renderItem={renderItem}
      estimatedItemSize={ITEM_HEIGHT}
      keyExtractor={(item) => item.id}
    />
  );
}
```

FlashList recycles views instead of unmounting/remounting, achieving near-native performance. Use it for lists over 100 items.
