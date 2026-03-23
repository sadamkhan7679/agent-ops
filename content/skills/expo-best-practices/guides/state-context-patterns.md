---
title: Context Splitting for Mobile Performance
impact: HIGH
tags: context, state, performance, rerenders, mobile
---

## Context Splitting for Mobile Performance

On mobile, unnecessary re-renders are more expensive than on web. A single context with mixed concerns re-renders every consumer on every state change, causing visible jank on lower-end devices.

**Incorrect (single context re-renders everything):**

```tsx
interface AppContextValue {
  user: User | null;
  theme: "light" | "dark";
  cart: CartItem[];
  notifications: Notification[];
  setUser: (user: User | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  addToCart: (item: CartItem) => void;
  markRead: (id: string) => void;
}

// Every component consuming this re-renders when ANY value changes
const AppContext = createContext<AppContextValue | null>(null);
```

**Correct (split by concern — state and dispatch separated):**

```tsx
import { createContext, use, useReducer, type ReactNode, type Dispatch } from "react";

// Cart state context
interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: "ADD"; payload: CartItem }
  | { type: "REMOVE"; payload: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD":
      return {
        items: [...state.items, action.payload],
        total: state.total + action.payload.price,
      };
    case "REMOVE": {
      const item = state.items.find((i) => i.id === action.payload);
      return {
        items: state.items.filter((i) => i.id !== action.payload),
        total: state.total - (item?.price ?? 0),
      };
    }
    case "CLEAR":
      return { items: [], total: 0 };
  }
}

const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}

// Components that only dispatch never re-render on state changes
function useCartDispatch() {
  const ctx = use(CartDispatchContext);
  if (!ctx) throw new Error("useCartDispatch must be within CartProvider");
  return ctx;
}

function useCartState() {
  const ctx = use(CartStateContext);
  if (!ctx) throw new Error("useCartState must be within CartProvider");
  return ctx;
}
```

Rules:
- Split state and dispatch into separate contexts
- Group related state (cart state) separately from unrelated state (auth, theme)
- Components that only trigger actions (buttons) should consume dispatch context only
- Components that only display data should consume state context only
- Consider Zustand or Jotai for complex state with many selectors
