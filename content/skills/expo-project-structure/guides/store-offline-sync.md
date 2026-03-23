---
title: Offline Sync Patterns
tags: store, offline, persistence, sync, optimistic
---

## Offline Sync Patterns

Mobile apps frequently lose connectivity. A well-structured Expo app accounts for offline use with persisted stores, queued mutations, and optimistic updates.

### Persisted Zustand store

Use Zustand's `persist` middleware with an MMKV adapter:

```tsx
// store/cart/cart.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Mutation queue pattern

Queue mutations when offline and replay them when connectivity returns:

```tsx
// store/app/mutation-queue.store.ts
import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";

type PendingMutation = {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  body: unknown;
  createdAt: number;
};

type MutationQueueState = {
  pending: PendingMutation[];
  enqueue: (mutation: Omit<PendingMutation, "id" | "createdAt">) => void;
  dequeue: (id: string) => void;
  flush: () => Promise<void>;
};

export const useMutationQueue = create<MutationQueueState>()((set, get) => ({
  pending: [],
  enqueue: (mutation) =>
    set((state) => ({
      pending: [
        ...state.pending,
        { ...mutation, id: crypto.randomUUID(), createdAt: Date.now() },
      ],
    })),
  dequeue: (id) =>
    set((state) => ({ pending: state.pending.filter((m) => m.id !== id) })),
  flush: async () => {
    const { pending, dequeue } = get();
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    for (const mutation of pending) {
      try {
        await fetch(mutation.endpoint, {
          method: mutation.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation.body),
        });
        dequeue(mutation.id);
      } catch {
        break;
      }
    }
  },
}));
```

### Optimistic updates with TanStack Query

```tsx
// hooks/orders/use-cancel-order.hook.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder } from "@/services/orders/order.service";
import type { Order } from "@/types/orders/order.types";

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onMutate: async (orderId: string) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previous = queryClient.getQueryData<Order[]>(["orders"]);
      queryClient.setQueryData<Order[]>(["orders"], (old) =>
        old?.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["orders"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
```

### Rules

1. **Persist only client-owned state.** Do not persist server cache — let TanStack Query handle its own caching.
2. **Queue only idempotent-safe mutations.** Mutations that depend on server-side ordering should not be blindly replayed.
3. **Show offline status clearly.** Use the `OfflineBanner` shared component when connectivity is lost.
4. **Version your persisted store schema.** Use the `version` field in Zustand persist to handle migrations when the store shape changes.
