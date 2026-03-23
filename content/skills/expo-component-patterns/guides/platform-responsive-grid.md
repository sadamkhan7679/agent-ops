---
title: Responsive Grid Component
impact: MEDIUM
tags: platform, responsive, grid, dimensions, tablet
---

## Responsive Grid Component

A responsive grid that adapts column count based on screen width using useWindowDimensions. Works across phones and tablets.

### Implementation

```tsx
import { View, FlatList, useWindowDimensions, StyleSheet, type ViewStyle } from "react-native";
import { useMemo, type ReactNode } from "react";

interface ResponsiveGridProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  minItemWidth?: number;
  spacing?: number;
  style?: ViewStyle;
}

function ResponsiveGrid<T>({
  data,
  renderItem,
  keyExtractor,
  minItemWidth = 160,
  spacing = 12,
  style,
}: ResponsiveGridProps<T>) {
  const { width } = useWindowDimensions();

  const { numColumns, itemWidth } = useMemo(() => {
    const availableWidth = width - spacing * 2; // Account for outer padding
    const cols = Math.max(1, Math.floor(availableWidth / (minItemWidth + spacing)));
    const itemW = (availableWidth - spacing * (cols - 1)) / cols;
    return { numColumns: cols, itemWidth: itemW };
  }, [width, minItemWidth, spacing]);

  return (
    <FlatList
      data={data}
      numColumns={numColumns}
      key={`grid-${numColumns}`} // Force re-mount when columns change
      keyExtractor={keyExtractor}
      contentContainerStyle={[styles.container, { padding: spacing }, style]}
      columnWrapperStyle={numColumns > 1 ? { gap: spacing } : undefined}
      ItemSeparatorComponent={() => <View style={{ height: spacing }} />}
      renderItem={({ item, index }) => (
        <View style={{ width: itemWidth }}>{renderItem(item, index)}</View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
});
```

### Usage

```tsx
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ResponsiveGrid
      data={products}
      keyExtractor={(p) => p.id}
      minItemWidth={150}
      spacing={16}
      renderItem={(product) => (
        <ProductCard product={product} />
      )}
    />
  );
}
// Phone: 2 columns | Tablet portrait: 3 columns | Tablet landscape: 4 columns
```

Key details:
- `numColumns` recalculates on rotation/resize via `useWindowDimensions`
- `key={grid-${numColumns}}` forces FlatList re-mount when column count changes (required by RN)
- `minItemWidth` controls the minimum size before adding a column
- Works with both phone and tablet layouts automatically
