---
title: Type-Safe Navigation
tags: navigation, typescript, type-safe, expo-router, params
---

## Type-Safe Navigation

Expo Router supports typed route params, which prevent runtime errors from missing or mistyped navigation parameters.

### Typed route params

Use `useLocalSearchParams` with a generic to type params at the route level:

```tsx
// app/products/[id].tsx
import { useLocalSearchParams } from "expo-router";

type ProductParams = {
  id: string;
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<ProductParams>();
  // id is typed as string
}
```

### Multiple dynamic segments

```tsx
// app/users/[userId]/posts/[postId].tsx
import { useLocalSearchParams } from "expo-router";

type PostParams = {
  userId: string;
  postId: string;
};

export default function PostScreen() {
  const { userId, postId } = useLocalSearchParams<PostParams>();
}
```

### Typed navigation with `router.push`

```tsx
import { useRouter } from "expo-router";

export function ProductCard({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/products/[id]",
          params: { id: productId },
        })
      }
    >
      {/* ... */}
    </Pressable>
  );
}
```

### Typed `Link` component

```tsx
import { Link } from "expo-router";

export function ProductLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={{
        pathname: "/products/[id]",
        params: { id },
      }}
    >
      {name}
    </Link>
  );
}
```

### Route param types file

For complex apps, centralize route param types:

```tsx
// types/navigation/routes.types.ts
export type RouteParams = {
  "/products/[id]": { id: string };
  "/users/[userId]/posts/[postId]": { userId: string; postId: string };
  "/orders/[orderId]": { orderId: string };
  "/search": { q?: string; category?: string };
};
```

### Parsing and validating params

Route params are always strings. Parse them explicitly:

```tsx
// hooks/products/use-product-params.hook.ts
import { useLocalSearchParams } from "expo-router";

export function useProductParams() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    throw new Error("Product ID is required");
  }

  return { productId: id };
}
```

For numeric IDs:

```tsx
export function useOrderParams() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const parsed = Number(orderId);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid order ID");
  }

  return { orderId: parsed };
}
```

### Query params on static routes

Static routes can receive query params via the search object:

```tsx
// Navigating with query params
router.push({
  pathname: "/search",
  params: { q: "shoes", category: "footwear" },
});

// Reading query params
const { q, category } = useLocalSearchParams<{ q?: string; category?: string }>();
```

### Rules

1. **Always type `useLocalSearchParams`.** Untyped params are `Record<string, string | string[]>` which is error-prone.
2. **Parse numeric params explicitly.** Never assume `params.id` is a number.
3. **Use `pathname` + `params` object format** for `router.push` and `Link` — it catches typos at compile time.
4. **Centralize complex route param types** in `types/navigation/routes.types.ts` for large apps.
5. **Validate params in hooks, not in screen components.** Extract a `use-<screen>-params.hook.ts` when param parsing is non-trivial.
