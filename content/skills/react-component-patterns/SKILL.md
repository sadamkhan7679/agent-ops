---
name: React Component Patterns
description: Advanced React component patterns with TypeScript including compound components, render props, HOCs, polymorphic components, and more
version: 1.0.0
type: skill
tags: [react, typescript, patterns, components, architecture]
category: React
author: agent-skills
---

# React Component Patterns

A comprehensive guide to advanced React component patterns using TypeScript and React 19+. Each pattern includes production-ready code examples with full type safety.

---

## 1. Compound Components Pattern

Compound components share implicit state through React Context, allowing flexible composition while maintaining a clean API.

### Context Setup

```tsx
import { createContext, use, useState, type ReactNode } from "react";

// Define the shared state shape
interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  multiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = use(AccordionContext);
  if (!context) {
    throw new Error(
      "Accordion compound components must be used within <Accordion>"
    );
  }
  return context;
}
```

### Root Component

```tsx
interface AccordionProps {
  children: ReactNode;
  multiple?: boolean;
  defaultOpen?: string[];
}

function Accordion({ children, multiple = false, defaultOpen = [] }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(defaultOpen)
  );

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext value={{ openItems, toggle, multiple }}>
      <div className="divide-y divide-border">{children}</div>
    </AccordionContext>
  );
}
```

### Child Components

```tsx
interface AccordionItemProps {
  id: string;
  children: ReactNode;
}

function AccordionItem({ id, children }: AccordionItemProps) {
  return <div data-accordion-item={id}>{children}</div>;
}

interface AccordionTriggerProps {
  id: string;
  children: ReactNode;
}

function AccordionTrigger({ id, children }: AccordionTriggerProps) {
  const { openItems, toggle } = useAccordionContext();
  const isOpen = openItems.has(id);

  return (
    <button
      onClick={() => toggle(id)}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between py-4 text-left font-medium"
    >
      {children}
      <ChevronIcon className={isOpen ? "rotate-180" : ""} />
    </button>
  );
}

interface AccordionContentProps {
  id: string;
  children: ReactNode;
}

function AccordionContent({ id, children }: AccordionContentProps) {
  const { openItems } = useAccordionContext();
  if (!openItems.has(id)) return null;

  return (
    <div role="region" className="pb-4 text-muted-foreground">
      {children}
    </div>
  );
}
```

### Attach Subcomponents and Usage

```tsx
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// Usage
function Demo() {
  return (
    <Accordion multiple defaultOpen={["item-1"]}>
      <Accordion.Item id="item-1">
        <Accordion.Trigger id="item-1">Section One</Accordion.Trigger>
        <Accordion.Content id="item-1">Content for section one.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item id="item-2">
        <Accordion.Trigger id="item-2">Section Two</Accordion.Trigger>
        <Accordion.Content id="item-2">Content for section two.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
```

---

## 2. Render Props Pattern

Render props let the consumer control rendering while the component manages logic. Still useful for headless UI patterns.

```tsx
import { useState, useEffect, type ReactNode } from "react";

interface FetchResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

interface DataFetcherProps<T> {
  url: string;
  children: (result: FetchResult<T>) => ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [url, fetchKey]);

  const refetch = () => setFetchKey((k) => k + 1);

  return <>{children({ data, error, isLoading, refetch })}</>;
}

// Usage
function UserList() {
  return (
    <DataFetcher<User[]> url="/api/users">
      {({ data, error, isLoading, refetch }) => {
        if (isLoading) return <Spinner />;
        if (error) return <ErrorCard error={error} onRetry={refetch} />;
        return (
          <ul>
            {data?.map((user) => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        );
      }}
    </DataFetcher>
  );
}
```

---

## 3. Higher-Order Components (HOCs)

HOCs wrap a component to inject props or behavior. Use sparingly in modern React -- prefer hooks or composition -- but useful for cross-cutting concerns like auth gates.

```tsx
import { type ComponentType } from "react";

// Generic HOC that injects auth user
interface WithAuthProps {
  user: User;
}

function withAuth<P extends WithAuthProps>(
  WrappedComponent: ComponentType<P>
) {
  type OuterProps = Omit<P, keyof WithAuthProps>;

  function AuthenticatedComponent(props: OuterProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) return <Spinner />;
    if (!user) return <Redirect to="/login" />;

    return <WrappedComponent {...(props as P)} user={user} />;
  }

  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthenticatedComponent;
}

// Usage
interface DashboardProps extends WithAuthProps {
  title: string;
}

function Dashboard({ user, title }: DashboardProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Welcome, {user.name}</p>
    </div>
  );
}

const ProtectedDashboard = withAuth(Dashboard);
// <ProtectedDashboard title="My Dashboard" /> -- user prop injected automatically
```

### HOC for Feature Flags

```tsx
function withFeatureFlag<P extends object>(
  WrappedComponent: ComponentType<P>,
  flagName: string,
  Fallback: ComponentType = () => null
) {
  function FeatureFlaggedComponent(props: P) {
    const { isEnabled } = useFeatureFlag(flagName);
    if (!isEnabled) return <Fallback />;
    return <WrappedComponent {...props} />;
  }

  FeatureFlaggedComponent.displayName = `withFeatureFlag(${
    WrappedComponent.displayName || WrappedComponent.name
  }, ${flagName})`;

  return FeatureFlaggedComponent;
}

const NewDashboard = withFeatureFlag(DashboardV2, "new-dashboard", DashboardV1);
```

---

## 4. Polymorphic Components (as Prop Pattern)

Polymorphic components let the consumer choose the rendered HTML element or component while keeping full type safety on the resulting props.

```tsx
import {
  type ElementType,
  type ComponentPropsWithoutRef,
  type ReactNode,
  forwardRef,
} from "react";

// Utility types
type PolymorphicRef<C extends ElementType> =
  ComponentPropsWithoutRef<C> extends { ref?: infer R } ? R : never;

type PolymorphicProps<
  C extends ElementType,
  Props = object,
> = Props & {
  as?: C;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, keyof Props | "as" | "children">;

// Polymorphic Button
type ButtonOwnProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type ButtonProps<C extends ElementType = "button"> = PolymorphicProps<
  C,
  ButtonOwnProps
>;

function Button<C extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps<C>) {
  const Component = as || "button";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <Component
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </Component>
  );
}

// Usage -- fully typed
<Button>Click me</Button>                          // renders <button>
<Button as="a" href="/about">About</Button>        // renders <a>, href is typed
<Button as={Link} to="/dashboard">Go</Button>      // renders Link, to is typed
```

---

## 5. Controlled vs Uncontrolled Components

Build components that work in both controlled and uncontrolled modes using a single implementation.

```tsx
import { useState, useCallback, useRef, type ChangeEvent } from "react";

interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

function useControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const nextValue =
        typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      if (!isControlled) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [isControlled, value, onChange]
  );

  return [value, setValue] as const;
}

// Dual-mode Toggle component
interface ToggleProps {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children: ReactNode;
}

function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  children,
}: ToggleProps) {
  const [isPressed, setIsPressed] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  });

  return (
    <button
      role="switch"
      aria-checked={isPressed}
      data-state={isPressed ? "on" : "off"}
      onClick={() => setIsPressed((prev) => !prev)}
      className={isPressed ? "bg-primary text-primary-foreground" : "bg-muted"}
    >
      {children}
    </button>
  );
}

// Uncontrolled usage
<Toggle defaultPressed={false} onPressedChange={(v) => console.log(v)}>
  Bold
</Toggle>

// Controlled usage
const [bold, setBold] = useState(false);
<Toggle pressed={bold} onPressedChange={setBold}>Bold</Toggle>
```

---

## 6. Forwarding Refs Properly

React 19 supports refs as regular props -- no more `forwardRef` wrapper needed.

```tsx
import { type Ref } from "react";

// React 19: ref is just a prop
interface InputProps {
  label: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

function Input({ label, error, ref, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        ref={ref}
        className={`w-full rounded-md border px-3 py-2 ${
          error ? "border-destructive" : "border-input"
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Usage -- pass ref directly
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <Input ref={inputRef} label="Email" />;
}
```

### Composing Refs

```tsx
import { type Ref, useRef, useImperativeHandle } from "react";

function useMergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return useCallback(
    (instance: T | null) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(instance);
        } else if (ref && typeof ref === "object") {
          (ref as React.MutableRefObject<T | null>).current = instance;
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}

interface ResizableTextareaProps {
  ref?: Ref<HTMLTextAreaElement>;
  minRows?: number;
}

function ResizableTextarea({ ref, minRows = 3, ...props }: ResizableTextareaProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const mergedRef = useMergeRefs(ref, internalRef);

  const handleInput = () => {
    const el = internalRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  return (
    <textarea
      ref={mergedRef}
      rows={minRows}
      onInput={handleInput}
      {...props}
    />
  );
}
```

---

## 7. Component Composition with Slots

The slots pattern gives consumers explicit control over which parts of a component they want to customize.

```tsx
import { type ReactNode } from "react";

// Slot-based Card
interface CardSlots {
  header?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

interface CardProps extends CardSlots {
  children: ReactNode;
  className?: string;
}

function Card({ header, media, footer, actions, children, className }: CardProps) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm ${className ?? ""}`}>
      {media && <div className="overflow-hidden rounded-t-lg">{media}</div>}
      {header && (
        <div className="border-b px-6 py-4">
          {header}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {(footer || actions) && (
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div>{footer}</div>
          <div className="flex gap-2">{actions}</div>
        </div>
      )}
    </div>
  );
}

// Usage
<Card
  media={<img src="/hero.jpg" alt="Hero" className="h-48 w-full object-cover" />}
  header={<h3 className="text-lg font-semibold">Card Title</h3>}
  footer={<span className="text-sm text-muted-foreground">Updated 2 hours ago</span>}
  actions={
    <>
      <Button variant="ghost" size="sm">Cancel</Button>
      <Button size="sm">Save</Button>
    </>
  }
>
  <p>Card body content goes here.</p>
</Card>
```

### Type-Safe Slot Components with Generics

```tsx
interface TableSlots<T> {
  header: () => ReactNode;
  row: (item: T, index: number) => ReactNode;
  empty?: () => ReactNode;
  loading?: () => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  isLoading?: boolean;
  slots: TableSlots<T>;
}

function DataTable<T>({ data, isLoading, slots }: DataTableProps<T>) {
  if (isLoading && slots.loading) return <>{slots.loading()}</>;
  if (data.length === 0 && slots.empty) return <>{slots.empty()}</>;

  return (
    <table className="w-full">
      <thead>{slots.header()}</thead>
      <tbody>
        {data.map((item, index) => slots.row(item, index))}
      </tbody>
    </table>
  );
}

// Usage -- T is inferred from data
<DataTable
  data={users}
  isLoading={false}
  slots={{
    header: () => (
      <tr>
        <th>Name</th>
        <th>Email</th>
      </tr>
    ),
    row: (user, i) => (
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
      </tr>
    ),
    empty: () => <p className="py-8 text-center text-muted-foreground">No users found.</p>,
  }}
/>
```

---

## Summary

| Pattern | Best For | Complexity |
|---------|----------|------------|
| Compound Components | UI component libraries, multi-part components | Medium |
| Render Props | Headless components, flexible rendering | Low |
| HOCs | Cross-cutting concerns (auth, flags, logging) | Medium |
| Polymorphic Components | Design system primitives | High |
| Controlled/Uncontrolled | Form elements, toggles, inputs | Medium |
| Ref Forwarding | Wrapping native elements, imperative APIs | Low |
| Slots | Highly customizable layouts | Low |

Choose the simplest pattern that solves your problem. Prefer composition and hooks over HOCs. Use compound components for complex multi-part UI. Use polymorphic components in design system foundations.
