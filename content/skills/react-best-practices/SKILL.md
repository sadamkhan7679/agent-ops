---
name: react-best-practices
description: Production-grade React best practices covering performance, hooks, state management, error handling, Suspense, accessibility, and Server Components
version: 1.0.0
type: skill
tags: [react, typescript, performance, accessibility, best-practices]
category: React
author: agent-skills
---

# React Best Practices

Comprehensive best practices for building production React applications with TypeScript, React 19+, and Next.js App Router.

---

## 1. Performance Optimization

### When to Use useMemo and useCallback

The React Compiler (React 19) auto-memoizes in many cases. Manual memoization is still useful for expensive computations and stable callback references passed to memoized children.

```tsx
import { useMemo, useCallback, memo } from "react";

// GOOD: Expensive computation
function ProductList({ products, query }: { products: Product[]; query: string }) {
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );

  return (
    <ul>
      {filtered.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}

// GOOD: Stable reference for memoized child
interface ToolbarProps {
  onSave: () => void;
  onDelete: () => void;
}

const Toolbar = memo(function Toolbar({ onSave, onDelete }: ToolbarProps) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave}>Save</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
});

function Editor({ documentId }: { documentId: string }) {
  const handleSave = useCallback(() => {
    saveDocument(documentId);
  }, [documentId]);

  const handleDelete = useCallback(() => {
    deleteDocument(documentId);
  }, [documentId]);

  return (
    <div>
      <Toolbar onSave={handleSave} onDelete={handleDelete} />
      <EditorContent id={documentId} />
    </div>
  );
}
```

### React.memo -- When It Helps

```tsx
// GOOD: Pure display component that receives stable props
const ExpensiveChart = memo(function ExpensiveChart({
  data,
  config,
}: {
  data: DataPoint[];
  config: ChartConfig;
}) {
  // Expensive rendering
  return <canvas ref={renderChart(data, config)} />;
});

// GOOD: Custom comparison for complex props
const UserAvatar = memo(
  function UserAvatar({ user }: { user: User }) {
    return <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full" />;
  },
  (prev, next) => prev.user.id === next.user.id && prev.user.avatarUrl === next.user.avatarUrl
);

// BAD: Don't memo components that always get new props
// BAD: Don't memo components that are cheap to render
```

### Avoiding Unnecessary Rerenders

```tsx
// BAD: Creating objects/arrays inline causes child rerenders
function Parent() {
  return <Child style={{ color: "red" }} items={[1, 2, 3]} />;
}

// GOOD: Hoist static values outside the component
const staticStyle = { color: "red" } as const;
const staticItems = [1, 2, 3] as const;

function Parent() {
  return <Child style={staticStyle} items={staticItems} />;
}

// GOOD: Split state to minimize rerender scope
function SearchPage() {
  return (
    <>
      <SearchInput /> {/* Has its own state, rerenders independently */}
      <SearchResults /> {/* Only rerenders when results change */}
    </>
  );
}
```

---

## 2. Custom Hooks Patterns and Rules

### Rules for Custom Hooks

1. Always prefix with `use`
2. Only call hooks at the top level (no conditionals, loops, or nested functions)
3. Only call hooks from React functions (components or other hooks)
4. Return a consistent shape (tuple for simple state, object for complex)
5. Keep hooks focused on a single concern

### Production-Ready Custom Hook Examples

```tsx
import { useState, useEffect, useRef, useCallback } from "react";

// Debounced value hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook with SSR safety
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

// Media query hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Intersection observer hook
function useIntersection(
  options?: IntersectionObserverInit
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect();

      if (node) {
        observerRef.current = new IntersectionObserver(([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        }, options);
        observerRef.current.observe(node);
      }
    },
    [options?.threshold, options?.root, options?.rootMargin]
  );

  return [ref, isIntersecting];
}
```

---

## 3. State Management Patterns

### Lifting State Up

```tsx
// Shared state lives in the nearest common ancestor
function CheckoutPage() {
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);

  return (
    <div className="grid grid-cols-2 gap-8">
      <ShippingForm address={shippingAddress} onAddressChange={setShippingAddress} />
      <OrderSummary shippingAddress={shippingAddress} />
    </div>
  );
}
```

### Context for Global State (with Reducer)

```tsx
import { createContext, use, useReducer, type ReactNode, type Dispatch } from "react";

// Define state and actions
interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      const items = existing
        ? state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          )
        : [...state.items, action.payload];
      return { items, total: calculateTotal(items) };
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter((i) => i.id !== action.payload.id);
      return { items, total: calculateTotal(items) };
    }
    case "UPDATE_QUANTITY": {
      const items = state.items.map((i) =>
        i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
      );
      return { items, total: calculateTotal(items) };
    }
    case "CLEAR":
      return { items: [], total: 0 };
    default:
      return state;
  }
}

// Split contexts for performance: state and dispatch separately
const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>
        {children}
      </CartDispatchContext>
    </CartStateContext>
  );
}

export function useCartState() {
  const ctx = use(CartStateContext);
  if (!ctx) throw new Error("useCartState must be used within CartProvider");
  return ctx;
}

export function useCartDispatch() {
  const ctx = use(CartDispatchContext);
  if (!ctx) throw new Error("useCartDispatch must be used within CartProvider");
  return ctx;
}
```

---

## 4. Error Boundaries and Error Handling

```tsx
"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") {
        return fallback(this.state.error, this.reset);
      }
      return fallback;
    }
    return this.props.children;
  }
}

// Usage with reset
function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="rounded-lg border border-destructive p-6">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <button onClick={reset} className="mt-4 rounded bg-primary px-4 py-2 text-white">
            Try again
          </button>
        </div>
      )}
      onError={(error, info) => {
        // Send to error tracking service
        reportError({ error, componentStack: info.componentStack });
      }}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}
```

### Async Error Handling Pattern

```tsx
// useActionState for forms (React 19)
import { useActionState } from "react";

interface FormState {
  error: string | null;
  success: boolean;
}

function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      try {
        await submitContact({
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          message: formData.get("message") as string,
        });
        return { error: null, success: true };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Something went wrong",
          success: false,
        };
      }
    },
    { error: null, success: false }
  );

  return (
    <form action={formAction}>
      {state.error && <div className="text-destructive">{state.error}</div>}
      {state.success && <div className="text-green-600">Message sent!</div>}
      <input name="name" required />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

---

## 5. Suspense and Lazy Loading

```tsx
import { Suspense, lazy } from "react";

// Lazy load heavy components
const ChartDashboard = lazy(() => import("./chart-dashboard"));
const DataTable = lazy(() => import("./data-table"));

function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<ChartSkeleton />}>
        <ChartDashboard />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}

// Named export lazy loading
const Settings = lazy(() =>
  import("./settings").then((mod) => ({ default: mod.SettingsPage }))
);
```

### Suspense with Data Fetching (React 19 `use`)

```tsx
import { Suspense, use } from "react";

// Server component fetches the promise, client component reads it
async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userPromise = fetchUser(id); // Don't await -- pass the promise

  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}

// Client component unwraps the promise with `use`
"use client";

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

---

## 6. Accessibility Best Practices

### Keyboard Navigation

```tsx
function TabList({ tabs, activeTab, onTabChange }: TabListProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex: number;

    switch (e.key) {
      case "ArrowRight":
        newIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        newIndex = 0;
        break;
      case "End":
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    onTabChange(tabs[newIndex].id);
    // Focus the new tab
    (e.currentTarget.parentElement?.children[newIndex] as HTMLElement)?.focus();
  };

  return (
    <div role="tablist" aria-label="Content tabs">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### Screen Reader Announcements

```tsx
function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", priority);
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    document.body.appendChild(el);

    // Delay to ensure screen reader picks it up
    requestAnimationFrame(() => {
      el.textContent = message;
      setTimeout(() => el.remove(), 1000);
    });
  }, []);

  return announce;
}

// Usage
function SearchResults({ results }: { results: Item[] }) {
  const announce = useAnnounce();

  useEffect(() => {
    announce(`${results.length} results found`);
  }, [results.length, announce]);

  return <ul>{/* ... */}</ul>;
}
```

### Focus Management

```tsx
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title}>
      <button ref={closeButtonRef} onClick={onClose} aria-label="Close dialog">
        X
      </button>
      {children}
    </div>
  );
}
```

---

## 7. Key Prop Usage and Reconciliation

```tsx
// GOOD: Stable unique IDs
<ul>
  {items.map((item) => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>

// BAD: Array index as key (causes bugs with reordering, filtering, deletion)
<ul>
  {items.map((item, index) => (
    <li key={index}>{item.name}</li>  // Do NOT do this
  ))}
</ul>

// GOOD: Reset component state by changing the key
function EditUserPage({ userId }: { userId: string }) {
  // When userId changes, the entire form remounts with fresh state
  return <UserForm key={userId} userId={userId} />;
}

// GOOD: Composite keys when items don't have unique IDs
{comments.map((comment) => (
  <Comment key={`${comment.postId}-${comment.timestamp}`} comment={comment} />
))}
```

---

## 8. Server Components vs Client Components (Next.js App Router)

### When to Use Server Components (Default)

```tsx
// app/products/page.tsx -- Server Component (no "use client")
// Benefits: zero JS sent to client, direct DB/API access, async/await

import { db } from "@/lib/db";

export default async function ProductsPage() {
  const products = await db.query.products.findMany({
    with: { category: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  return (
    <div className="grid grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// This is also a Server Component -- no interactivity needed
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border p-4">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price.toFixed(2)}</p>
    </div>
  );
}
```

### When to Use Client Components

```tsx
"use client";

// Use "use client" ONLY when you need:
// 1. Event handlers (onClick, onChange, etc.)
// 2. State (useState, useReducer)
// 3. Effects (useEffect)
// 4. Browser APIs (localStorage, IntersectionObserver)
// 5. Custom hooks that use any of the above

import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = async () => {
    setIsAdding(true);
    await addToCart(productId);
    setIsAdding(false);
  };

  return (
    <button onClick={handleClick} disabled={isAdding}>
      {isAdding ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

### Composition Pattern: Server Parent with Client Children

```tsx
// app/dashboard/page.tsx -- Server Component
import { DashboardShell } from "./dashboard-shell"; // Client
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const stats = await db.query.stats.findFirst();
  const recentOrders = await db.query.orders.findMany({ limit: 10 });

  return (
    <DashboardShell>
      {/* Server-rendered content passed as children to client component */}
      <StatsCards stats={stats} />
      <RecentOrdersTable orders={recentOrders} />
    </DashboardShell>
  );
}

// dashboard-shell.tsx -- Client Component for interactivity
"use client";

import { useState, type ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

### Data Fetching Boundaries

```tsx
// GOOD: Fetch at the server, pass serializable data down
// app/users/[id]/page.tsx
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div>
      <UserHeader user={user} /> {/* Server Component */}
      <UserActions userId={user.id} /> {/* Client Component -- only gets the ID */}
    </div>
  );
}
```

---

## Quick Reference

| Practice          | Do                               | Don't                           |
| ----------------- | -------------------------------- | ------------------------------- |
| Memoization       | Memo expensive computations      | Memo everything                 |
| State             | Lift to nearest common ancestor  | Prop drill through 5+ levels    |
| Context           | Split state and dispatch         | Put everything in one context   |
| Error boundaries  | Wrap route segments              | Wrap every component            |
| Keys              | Use stable unique IDs            | Use array index                 |
| Server Components | Default for non-interactive UI   | Add "use client" everywhere     |
| Client Components | Only for interactivity           | Fetch data in client components |
| Accessibility     | Semantic HTML + ARIA when needed | div and span for everything     |
