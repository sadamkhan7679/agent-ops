---
title: Domain Components
tags: components, domain, ownership, organization
---

## Domain Components

`components/<domain>/` is the default home for components owned by a specific business domain. This is where most app components live.

### Structure

```text
components/
  profile/
    profile-header.tsx
    profile-stats-card.tsx
    profile-activity-list.tsx
    profile-edit-form.tsx
    profile-avatar-picker.tsx
  orders/
    order-card.tsx
    order-status-badge.tsx
    order-timeline.tsx
    order-summary.tsx
  products/
    product-card.tsx
    product-gallery.tsx
    product-variant-picker.tsx
    product-review-item.tsx
```

### What makes a component domain-owned

A component is domain-owned when:

- It renders data from a specific domain model (user, order, product)
- It contains domain-specific interaction logic (add to cart, follow user)
- Its prop types reference domain types
- It is not meaningful outside its domain context

### Example: Domain component

```tsx
// components/orders/order-card.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/orders/order.types";

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/orders/${order.id}`)}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.orderId}>#{order.number}</Text>
          <Badge label={order.status} variant={statusVariant(order.status)} />
        </View>
        <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
        <Text style={styles.total}>${order.total.toFixed(2)}</Text>
      </Card>
    </Pressable>
  );
}
```

### Naming conventions

Use kebab-case with the domain as prefix:

- `profile-header.tsx` (not `ProfileHeader.tsx` or `header.tsx`)
- `order-status-badge.tsx` (not `status-badge.tsx`)

The domain prefix prevents naming collisions and makes imports self-documenting:

```tsx
import { OrderCard } from "@/components/orders/order-card";
import { ProductCard } from "@/components/products/product-card";
```

### When to promote to shared

Move a domain component to `components/shared/` when:

- Two or more unrelated domains use the exact same component
- The component's props have been generalized to remove domain types
- The name still makes sense without a domain prefix

Do not promote because "it might be reused someday."

### Platform variants

When a component needs different behavior per platform:

```text
components/
  profile/
    profile-header.tsx          # Shared logic
    profile-header.ios.tsx      # iOS-specific rendering
    profile-header.android.tsx  # Android-specific rendering
```

React Native's module resolution automatically picks the correct platform file. Use this sparingly — most components should work cross-platform with `Platform.select` for minor differences.

### Co-located styles

Keep styles in the same file using `StyleSheet.create`. Extract to a separate file only when multiple components in the same domain share identical style tokens:

```text
components/
  profile/
    profile-header.tsx
    profile-stats-card.tsx
    profile.styles.ts           # Only if styles are genuinely shared
```
