---
title: Screen Sections
tags: components, screens, composition, route
---

## Screen Sections

`components/screens/` holds screen composition sections — large UI blocks extracted from route files to keep `app/` lean.

### Purpose

A route file in `app/` should compose, not implement. When a screen has multiple visual sections (header, content, footer, sidebar), each section becomes a component in `components/screens/`.

### Structure

```text
components/
  screens/
    home-hero.screen.tsx
    home-featured-products.screen.tsx
    home-categories.screen.tsx
    profile-header.screen.tsx
    profile-activity.screen.tsx
    profile-stats.screen.tsx
    settings-account.screen.tsx
    settings-notifications.screen.tsx
    settings-privacy.screen.tsx
```

### Example: Composing a screen

```tsx
// app/(tabs)/index.tsx
import { ScreenContainer } from "@/components/ui/screen-container";
import { HomeHero } from "@/components/screens/home-hero.screen";
import { HomeFeaturedProducts } from "@/components/screens/home-featured-products.screen";
import { HomeCategories } from "@/components/screens/home-categories.screen";

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <HomeHero />
      <HomeFeaturedProducts />
      <HomeCategories />
    </ScreenContainer>
  );
}
```

### Example: Screen section component

```tsx
// components/screens/home-featured-products.screen.tsx
import { View, FlatList, StyleSheet } from "react-native";
import { SectionHeader } from "@/components/shared/section-header.shared";
import { ProductCard } from "@/components/products/product-card";
import { useFeaturedProducts } from "@/hooks/products/use-featured-products.hook";
import { ErrorFallback } from "@/components/shared/error-fallback.shared";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeFeaturedProducts() {
  const { products, isLoading, error, refetch } = useFeaturedProducts();

  if (isLoading) return <FeaturedProductsSkeleton />;
  if (error) return <ErrorFallback message="Could not load products." onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <SectionHeader title="Featured" actionLabel="See All" onAction={() => {}} />
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="40%" height={24} />
      <View style={styles.skeletonRow}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width={160} height={200} borderRadius={12} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingVertical: 16 },
  list: { gap: 12 },
  skeletonRow: { flexDirection: "row", gap: 12 },
});
```

### Screen sections vs domain components

| `components/screens/` | `components/<domain>/` |
|------------------------|------------------------|
| Exists to keep route files lean | Exists for domain-owned reusable UI |
| Named with `.screen.tsx` suffix | Named without suffix or with domain prefix |
| Typically used by one route | Used across multiple screens |
| Manages its own data fetching and states | Receives data via props |

### Naming convention

Use the pattern `<screen>-<section>.screen.tsx`:

- `home-hero.screen.tsx`
- `profile-header.screen.tsx`
- `settings-notifications.screen.tsx`

### Co-located skeletons

Define loading skeletons as private functions inside the same screen section file. This keeps the loading state visually consistent with the loaded state and avoids separate skeleton files that drift.
