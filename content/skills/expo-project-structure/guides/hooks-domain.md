---
title: Domain Hooks
tags: hooks, domain, state, logic
---

## Domain Hooks

`hooks/<domain>/` holds stateful logic owned by a specific business domain. Hooks extract state management, side effects, and interaction logic from components.

### Structure

```text
hooks/
  auth/
    use-auth.hook.ts
    use-session.hook.ts
    use-biometric-auth.hook.ts
  profile/
    use-profile.hook.ts
    use-profile-edit.hook.ts
  products/
    use-product-search.hook.ts
    use-product-filter.hook.ts
    use-featured-products.hook.ts
  orders/
    use-orders.hook.ts
    use-order-tracking.hook.ts
  cart/
    use-cart.hook.ts
    use-cart-actions.hook.ts
```

### When to extract a hook

Extract a hook when:

- Stateful logic is reused by multiple components in the same domain
- State transitions dominate the component body (form state, pagination, filtering)
- The component becomes hard to read because logic and rendering are tangled
- You need to compose multiple lower-level hooks into a domain-specific abstraction

### Example: Domain hook

```tsx
// hooks/products/use-product-search.hook.ts
import { useState, useCallback } from "react";
import { useDebounce } from "@/lib/timing/use-debounce.lib";
import { searchProducts } from "@/services/products/product.service";
import type { Product } from "@/types/products/product.types";

export function useProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchProducts(searchQuery);
      setResults(data);
    } catch (err) {
      setError("Failed to search products.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, isLoading, error, clearSearch };
}
```

### Example: Hook with TanStack Query

```tsx
// hooks/orders/use-orders.hook.ts
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/services/orders/order.service";
import type { OrderFilters } from "@/types/orders/order.types";

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 1000 * 60 * 5,
  });
}
```

### Naming conventions

- File: `use-<name>.hook.ts`
- Export: `use<Name>` (camelCase function name)
- Place in `hooks/<domain>/`

### Hook responsibilities

Hooks should:

- Manage state and side effects
- Delegate API calls to services
- Return a clean interface of values and callbacks
- Handle loading, error, and empty states

Hooks should not:

- Render UI (return JSX)
- Import components
- Access navigation directly (pass callbacks from the component instead)
- Become a god-object that manages unrelated state

### Shared hooks

If a hook is genuinely cross-domain (e.g., `useDebounce`, `useMediaQuery`), place it in `lib/<concern>/` rather than creating a `hooks/shared/` folder. Reserve `hooks/` for domain-owned logic.
