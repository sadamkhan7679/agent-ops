---
title: Global vs Local State
tags: store, state, zustand, context, local-state
---

## Global vs Local State

React Native apps need clear rules for where state lives. The wrong choice creates unnecessary re-renders, stale data, and tight coupling.

### State placement decision tree

1. **Is the state used by one component?** Keep it as local state (`useState`).
2. **Is the state used by a parent and its children?** Pass it as props or use composition.
3. **Is the state used by siblings or distant components within one screen?** Use a hook or Context scoped to that screen.
4. **Is the state used across multiple screens in one domain?** Use a domain store (`store/<domain>/`).
5. **Is the state truly app-wide?** Use a global store (`store/app/`).

### Structure

```text
store/
  app/
    theme.store.ts
    app.store.ts
  auth/
    auth.store.ts
  cart/
    cart.store.ts
  notifications/
    notifications.store.ts
```

### Example: Zustand domain store

```tsx
// store/cart/cart.store.ts
import { create } from "zustand";
import type { CartItem } from "@/types/cart/cart.types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
```

### When to use Context

Context is appropriate for:

- Theme/appearance values that rarely change
- Auth state (current user, token)
- Feature flags
- Screen-scoped state shared among deeply nested components

Context is **not** appropriate for:

- Frequently updating state (causes full subtree re-renders)
- State with many consumers that read different slices
- State that needs to be accessed outside React (e.g., in services)

### When to use Zustand/Jotai

Use an external store when:

- State is accessed from multiple screens
- State needs to be read outside React components (in services, navigation guards)
- Fine-grained subscriptions matter for performance
- State needs persistence (Zustand middleware, MMKV adapter)

### Anti-patterns

- **Global store for form state.** Use `useState` or a form library.
- **Context for high-frequency updates.** Use Zustand with selectors instead.
- **Store accessing components.** Stores never import from `components/`.
- **Multiple stores managing the same data.** One domain, one store.
- **Putting API cache in a store.** Use TanStack Query or SWR for server state.
