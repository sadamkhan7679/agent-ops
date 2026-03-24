# Expo Component Patterns — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

Advanced React Native component patterns with TypeScript including compound components, headless components, HOCs, polymorphic pressables, animated patterns, and platform-adaptive components

## Table of Contents

1. [Layout Animations](#1-layout-animations)
2. [Shared Element Transitions](#2-shared-element-transitions)
3. [Action Menu Compound Component](#3-action-menu-compound-component)
4. [Bottom Sheet Compound Component](#4-bottom-sheet-compound-component)
5. [Form Group with Shared Validation](#5-form-group-with-shared-validation)
6. [Controlled/Uncontrolled TextInput](#6-controlled-uncontrolled-textinput)
7. [Controlled/Uncontrolled Toggle](#7-controlled-uncontrolled-toggle)
8. [Headless List Controller](#8-headless-list-controller)
9. [Swipeable Row with Render Callback](#9-swipeable-row-with-render-callback)
10. [Authentication Gate HOC](#10-authentication-gate-hoc)
11. [Keyboard-Aware HOC](#11-keyboard-aware-hoc)
12. [Platform-Adaptive Component](#12-platform-adaptive-component)
13. [Responsive Grid Component](#13-responsive-grid-component)
14. [Polymorphic Pressable Component](#14-polymorphic-pressable-component)
15. [Polymorphic Text with Variants](#15-polymorphic-text-with-variants)
16. [Theme Provider with System Detection](#16-theme-provider-with-system-detection)
17. [Toast Notification Provider](#17-toast-notification-provider)
18. [Imperative ScrollView Handle](#18-imperative-scrollview-handle)
19. [Native Input Handle](#19-native-input-handle)
20. [Card with Native Slots](#20-card-with-native-slots)
21. [Screen Layout with Slots](#21-screen-layout-with-slots)

---

## 1. Layout Animations

Reanimated layout animations animate components entering and exiting the tree. Use them for list items, conditional content, and screen transitions.

### Animated List Items

```tsx
import Animated, {
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
} from "react-native-reanimated";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

function AnimatedList<T>({ items, renderItem, keyExtractor }: AnimatedListProps<T>) {
  return (
    <Animated.View layout={LinearTransition.springify()} style={styles.list}>
      {items.map((item) => (
        <Animated.View
          key={keyExtractor(item)}
          entering={FadeInRight.duration(300).springify()}
          exiting={FadeOutLeft.duration(200)}
          layout={LinearTransition.springify()}
        >
          {renderItem(item)}
        </Animated.View>
      ))}
    </Animated.View>
  );
}
```

### Animated Conditional Content

```tsx
function ExpandableSection({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Animated.View
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        >
          <ChevronDown size={20} />
        </Animated.View>
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}
```

### Animated Delete from List

```tsx
function TaskList({ tasks, onDelete }: { tasks: Task[]; onDelete: (id: string) => void }) {
  return (
    <View>
      {tasks.map((task) => (
        <Animated.View
          key={task.id}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          layout={LinearTransition.springify().damping(15)}
        >
          <View style={styles.taskRow}>
            <Text>{task.title}</Text>
            <Pressable onPress={() => onDelete(task.id)}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
```

Available animations:
- Entering: `FadeIn`, `FadeInRight`, `SlideInRight`, `ZoomIn`, `BounceIn`
- Exiting: `FadeOut`, `FadeOutLeft`, `SlideOutLeft`, `ZoomOut`, `BounceOut`
- Layout: `LinearTransition`, `SequencedTransition`, `FadingTransition`
- All support `.duration()`, `.delay()`, `.springify()`, `.damping()`, `.stiffness()`

---

## 2. Shared Element Transitions

Shared element transitions animate an element from one screen to another, creating a fluid navigation experience. Uses Reanimated's shared transition API.

### Implementation with Reanimated SharedTransition

```tsx
import Animated, { SharedTransition, withSpring } from "react-native-reanimated";
import { Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";

const customTransition = SharedTransition.custom((values) => {
  "worklet";
  return {
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
    width: withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
  };
});

// List item
function ProductListItem({ product }: { product: Product }) {
  return (
    <Pressable onPress={() => router.push(`/products/${product.id}`)}>
      <Animated.View
        sharedTransitionTag={`product-${product.id}`}
        sharedTransitionStyle={customTransition}
      >
        <Image
          source={product.imageUrl}
          style={styles.listImage}
          contentFit="cover"
        />
      </Animated.View>
      <Text style={styles.name}>{product.name}</Text>
    </Pressable>
  );
}

// Detail screen
function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        sharedTransitionTag={`product-${id}`}
        sharedTransitionStyle={customTransition}
      >
        <Image
          source={product.imageUrl}
          style={styles.detailImage}
          contentFit="cover"
        />
      </Animated.View>
      <View style={styles.content}>
        <Text style={styles.title}>{product.name}</Text>
        <Text>{product.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listImage: { width: "100%", height: 200, borderRadius: 12 },
  detailImage: { width: "100%", height: 300 },
  content: { padding: 16 },
  name: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
});
```

Key requirements:
- Both screens must have `Animated.View` with matching `sharedTransitionTag`
- The tag must be unique per element (include the item ID)
- Use `SharedTransition.custom` for spring-based transitions
- Works with Expo Router when using native stack navigation

---

## 3. Action Menu Compound Component

An action menu with context-shared open/close state. Trigger opens the menu, items fire callbacks and auto-close.

### Implementation

```tsx
import { createContext, use, useState, useCallback, type ReactNode } from "react";
import { View, Pressable, Text, Modal, StyleSheet } from "react-native";

interface ActionMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

function useActionMenu() {
  const ctx = use(ActionMenuContext);
  if (!ctx) throw new Error("ActionMenu components must be inside ActionMenu.Root");
  return ctx;
}

function Root({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ActionMenuContext value={{ isOpen, open, close }}>
      {children}
    </ActionMenuContext>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  const { open } = useActionMenu();
  return (
    <Pressable onPress={open} accessibilityRole="button">
      {children}
    </Pressable>
  );
}

function Content({ children }: { children: ReactNode }) {
  const { isOpen, close } = useActionMenu();
  if (!isOpen) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.overlay} onPress={close}>
        <View style={styles.menu}>
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

interface ItemProps {
  onPress: () => void;
  children: ReactNode;
  destructive?: boolean;
}

function Item({ onPress, children, destructive }: ItemProps) {
  const { close } = useActionMenu();

  const handlePress = () => {
    close();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="menuitem"
    >
      <Text style={[styles.itemText, destructive && styles.destructive]}>
        {children}
      </Text>
    </Pressable>
  );
}

const ActionMenu = { Root, Trigger, Content, Item };
```

### Usage

```tsx
function PostActions({ postId }: { postId: string }) {
  return (
    <ActionMenu.Root>
      <ActionMenu.Trigger>
        <MoreHorizontal size={20} />
      </ActionMenu.Trigger>
      <ActionMenu.Content>
        <ActionMenu.Item onPress={() => sharePost(postId)}>Share</ActionMenu.Item>
        <ActionMenu.Item onPress={() => reportPost(postId)}>Report</ActionMenu.Item>
        <ActionMenu.Item onPress={() => deletePost(postId)} destructive>
          Delete
        </ActionMenu.Item>
      </ActionMenu.Content>
    </ActionMenu.Root>
  );
}
```

---

## 4. Bottom Sheet Compound Component

A compound bottom sheet shares open/close state through context, letting consumers compose handles, content, and backdrops flexibly.

### Context Setup

```tsx
import { createContext, use, useCallback, useRef, type ReactNode } from "react";
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetModal,
} from "@gorhom/bottom-sheet";

interface BottomSheetContextValue {
  open: () => void;
  close: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

function useBottomSheet() {
  const ctx = use(BottomSheetContext);
  if (!ctx) throw new Error("BottomSheet components must be inside BottomSheet.Root");
  return ctx;
}
```

### Root Component

```tsx
interface RootProps {
  children: ReactNode;
  snapPoints?: string[];
}

function Root({ children, snapPoints = ["25%", "50%"] }: RootProps) {
  const ref = useRef<BottomSheetModal>(null);

  const open = useCallback(() => ref.current?.expand(), []);
  const close = useCallback(() => ref.current?.close(), []);

  return (
    <BottomSheetContext value={{ open, close }}>
      <BottomSheetLib
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
      </BottomSheetLib>
    </BottomSheetContext>
  );
}
```

### Trigger and Content

```tsx
function Trigger({ children }: { children: ReactNode }) {
  const { open } = useBottomSheet();
  return <Pressable onPress={open}>{children}</Pressable>;
}

function Content({ children }: { children: ReactNode }) {
  return <View style={{ padding: 16 }}>{children}</View>;
}

function CloseButton({ children }: { children?: ReactNode }) {
  const { close } = useBottomSheet();
  return (
    <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close">
      {children ?? <Text>Close</Text>}
    </Pressable>
  );
}
```

### Attach and Usage

```tsx
const BottomSheet = { Root, Trigger, Content, CloseButton };

function Demo() {
  return (
    <BottomSheet.Root snapPoints={["30%"]}>
      <BottomSheet.Trigger>
        <Text>Open Sheet</Text>
      </BottomSheet.Trigger>
      <BottomSheet.Content>
        <Text>Sheet content here</Text>
        <BottomSheet.CloseButton />
      </BottomSheet.Content>
    </BottomSheet.Root>
  );
}
```

---

## 5. Form Group with Shared Validation

A compound form group provides shared validation context. Fields register themselves, and the group coordinates validation on submit.

### Implementation

```tsx
import { createContext, use, useCallback, useRef, useState, type ReactNode } from "react";
import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";

interface FieldError {
  field: string;
  message: string;
}

interface FormGroupContextValue {
  errors: Map<string, string>;
  register: (field: string, validate: (value: string) => string | null) => void;
  setFieldValue: (field: string, value: string) => void;
  validateAll: () => boolean;
}

const FormGroupContext = createContext<FormGroupContextValue | null>(null);

function useFormGroup() {
  const ctx = use(FormGroupContext);
  if (!ctx) throw new Error("FormField must be inside FormGroup");
  return ctx;
}

function FormGroup({ children, onSubmit }: { children: ReactNode; onSubmit: (values: Record<string, string>) => void }) {
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const validators = useRef<Map<string, (value: string) => string | null>>(new Map());
  const values = useRef<Map<string, string>>(new Map());

  const register = useCallback((field: string, validate: (value: string) => string | null) => {
    validators.current.set(field, validate);
  }, []);

  const setFieldValue = useCallback((field: string, value: string) => {
    values.current.set(field, value);
    // Clear error on change
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const validateAll = useCallback(() => {
    const nextErrors = new Map<string, string>();
    for (const [field, validate] of validators.current) {
      const value = values.current.get(field) ?? "";
      const error = validate(value);
      if (error) nextErrors.set(field, error);
    }
    setErrors(nextErrors);

    if (nextErrors.size === 0) {
      onSubmit(Object.fromEntries(values.current));
      return true;
    }
    return false;
  }, [onSubmit]);

  return (
    <FormGroupContext value={{ errors, register, setFieldValue, validateAll }}>
      <View>{children}</View>
    </FormGroupContext>
  );
}
```

### FormField Component

```tsx
interface FormFieldProps extends Omit<TextInputProps, "onChangeText"> {
  name: string;
  label: string;
  validate?: (value: string) => string | null;
}

function FormField({ name, label, validate, ...props }: FormFieldProps) {
  const { errors, register, setFieldValue } = useFormGroup();

  useEffect(() => {
    if (validate) register(name, validate);
  }, [name, validate, register]);

  const error = errors.get(name);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        onChangeText={(text) => setFieldValue(name, text)}
        accessibilityLabel={label}
        aria-invalid={!!error}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const FormGroupCompound = { Root: FormGroup, Field: FormField };
```

### Usage

```tsx
function ContactForm() {
  return (
    <FormGroupCompound.Root onSubmit={(values) => submitContact(values)}>
      <FormGroupCompound.Field
        name="name"
        label="Name"
        validate={(v) => (v.length < 2 ? "Name is required" : null)}
      />
      <FormGroupCompound.Field
        name="email"
        label="Email"
        keyboardType="email-address"
        validate={(v) => (!v.includes("@") ? "Invalid email" : null)}
      />
      <SubmitButton />
    </FormGroupCompound.Root>
  );
}
```

---

## 6. Controlled/Uncontrolled TextInput

Build inputs that work in both controlled and uncontrolled modes using a single implementation.

### useControllableState Hook

```tsx
import { useState, useCallback } from "react";

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
    (next: T) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return [value, setValue] as const;
}
```

### Input Component

```tsx
import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";

interface AppInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  label?: string;
  error?: string;
}

function AppInput({
  value,
  defaultValue = "",
  onChangeText,
  label,
  error,
  style,
  ...props
}: AppInputProps) {
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue,
    onChange: onChangeText,
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={currentValue}
        onChangeText={setCurrentValue}
        style={[styles.input, error && styles.inputError, style]}
        accessibilityLabel={label}
        aria-invalid={!!error}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 14, fontWeight: "500", color: "#333" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  inputError: { borderColor: "#FF3B30" },
  error: { fontSize: 12, color: "#FF3B30" },
});
```

### Usage

```tsx
// Uncontrolled — manages its own state
<AppInput label="Name" defaultValue="" onChangeText={(v) => console.log(v)} />

// Controlled — parent owns the state
const [email, setEmail] = useState("");
<AppInput label="Email" value={email} onChangeText={setEmail} />
```

---

## 7. Controlled/Uncontrolled Toggle

A Switch/Toggle that works in both controlled and uncontrolled modes using useControllableState.

### Implementation

```tsx
import { Switch, View, Text, StyleSheet } from "react-native";

interface ToggleProps {
  value?: boolean;
  defaultValue?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

function Toggle({
  value,
  defaultValue = false,
  onValueChange,
  label,
  disabled = false,
}: ToggleProps) {
  const [isOn, setIsOn] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>}
      <Switch
        value={isOn}
        onValueChange={setIsOn}
        disabled={disabled}
        trackColor={{ false: "#E5E5EA", true: "#34C759" }}
        thumbColor="#fff"
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: isOn, disabled }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  label: { fontSize: 16, color: "#000", flex: 1, marginRight: 12 },
  disabled: { color: "#999" },
});
```

### Usage

```tsx
// Uncontrolled
<Toggle label="Push Notifications" defaultValue={true} onValueChange={(v) => console.log(v)} />

// Controlled
const [darkMode, setDarkMode] = useState(false);
<Toggle label="Dark Mode" value={darkMode} onValueChange={setDarkMode} />

// Disabled
<Toggle label="Premium Feature" value={false} disabled />
```

---

## 8. Headless List Controller

A headless hook manages list logic (pagination, refresh, empty state) while letting consumers control rendering entirely.

### Implementation

```tsx
import { useState, useCallback } from "react";

interface UseListControllerOptions<T> {
  fetchPage: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  pageSize?: number;
}

interface ListControllerResult<T> {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  isEmpty: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  flatListProps: {
    data: T[];
    onEndReached: () => void;
    onEndReachedThreshold: number;
    refreshing: boolean;
    onRefresh: () => void;
  };
}

function useListController<T>({
  fetchPage,
  pageSize = 20,
}: UseListControllerOptions<T>): ListControllerResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        const result = await fetchPage(pageNum);
        setData((prev) => (isRefresh ? result.data : [...prev, ...result.data]));
        setHasMore(result.hasMore);
        setPage(pageNum);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Fetch failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchPage]
  );

  // Initial load
  useEffect(() => {
    load(1, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) load(page + 1);
  }, [isLoading, hasMore, page, load]);

  const refresh = useCallback(() => load(1, true), [load]);

  return {
    data,
    isLoading,
    isRefreshing,
    isEmpty: !isLoading && data.length === 0,
    hasMore,
    error,
    loadMore,
    refresh,
    flatListProps: {
      data,
      onEndReached: loadMore,
      onEndReachedThreshold: 0.5,
      refreshing: isRefreshing,
      onRefresh: refresh,
    },
  };
}
```

### Usage

```tsx
function ProductListScreen() {
  const list = useListController<Product>({
    fetchPage: (page) => api.getProducts({ page, limit: 20 }),
  });

  if (list.isLoading && list.data.length === 0) return <ProductSkeleton />;
  if (list.error) return <ErrorView error={list.error} onRetry={list.refresh} />;
  if (list.isEmpty) return <EmptyState message="No products found" />;

  return (
    <FlatList
      {...list.flatListProps}
      renderItem={({ item }) => <ProductCard product={item} />}
      keyExtractor={(item) => item.id}
      ListFooterComponent={list.hasMore ? <ActivityIndicator /> : null}
    />
  );
}
```

---

## 9. Swipeable Row with Render Callback

A swipeable row manages gesture state while consumers provide custom swipe action UIs via render callbacks.

### Implementation

```tsx
import { useRef, type ReactNode } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Swipeable, type SwipeableProps } from "react-native-gesture-handler";

interface SwipeableRowProps {
  children: ReactNode;
  renderLeftActions?: (progress: Animated.AnimatedInterpolation<number>) => ReactNode;
  renderRightActions?: (progress: Animated.AnimatedInterpolation<number>) => ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

function SwipeableRow({
  children,
  renderLeftActions,
  renderRightActions,
  onSwipeLeft,
  onSwipeRight,
  threshold = 0.5,
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => swipeableRef.current?.close();

  const handleSwipeOpen = (direction: "left" | "right") => {
    if (direction === "left") onSwipeLeft?.();
    else onSwipeRight?.();
    close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      leftThreshold={threshold * 100}
      rightThreshold={threshold * 100}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}
```

### Usage

```tsx
function MessageRow({ message, onDelete, onArchive }: MessageRowProps) {
  return (
    <SwipeableRow
      onSwipeLeft={onDelete}
      onSwipeRight={onArchive}
      renderRightActions={(progress) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [80, 0],
        });
        return (
          <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
            <Text style={styles.actionText}>Delete</Text>
          </Animated.View>
        );
      }}
      renderLeftActions={(progress) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 0],
        });
        return (
          <Animated.View style={[styles.archiveAction, { transform: [{ translateX }] }]}>
            <Text style={styles.actionText}>Archive</Text>
          </Animated.View>
        );
      }}
    >
      <View style={styles.row}>
        <Text>{message.subject}</Text>
        <Text style={styles.preview}>{message.preview}</Text>
      </View>
    </SwipeableRow>
  );
}
```

---

## 10. Authentication Gate HOC

A HOC that wraps screens requiring authentication. Shows loading while checking auth, redirects to login if unauthenticated, renders the screen with user prop if authenticated.

### Implementation

```tsx
import { type ComponentType } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/auth/use-auth.hook";

interface WithAuthProps {
  user: User;
}

function withAuthGate<P extends WithAuthProps>(WrappedComponent: ComponentType<P>) {
  type OuterProps = Omit<P, keyof WithAuthProps>;

  function AuthGatedComponent(props: OuterProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (!user) {
      return <Redirect href="/(auth)/login" />;
    }

    return <WrappedComponent {...(props as P)} user={user} />;
  }

  AuthGatedComponent.displayName = `withAuthGate(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthGatedComponent;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
```

### Usage

```tsx
interface ProfileScreenProps extends WithAuthProps {
  showSettings?: boolean;
}

function ProfileScreen({ user, showSettings }: ProfileScreenProps) {
  return (
    <View>
      <Text>Welcome, {user.name}</Text>
      {showSettings && <SettingsPanel userId={user.id} />}
    </View>
  );
}

export default withAuthGate(ProfileScreen);
// user prop is injected automatically — consumer only passes showSettings
```

Use this pattern for screens that must be gated. For conditional UI within a screen, prefer checking auth state inline instead of using the HOC.

---

## 11. Keyboard-Aware HOC

Wraps form screens in KeyboardAvoidingView with ScrollView. Handles iOS vs Android behavior differences automatically.

### Implementation

```tsx
import { type ComponentType } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from "react-native";

interface KeyboardAwareOptions {
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
}

function withKeyboardAware<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: KeyboardAwareOptions = {}
) {
  function KeyboardAwareComponent(props: P) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, options.style]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={options.keyboardVerticalOffset ?? (Platform.OS === "ios" ? 88 : 0)}
      >
        <ScrollView
          contentContainerStyle={[styles.content, options.contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <WrappedComponent {...props} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  KeyboardAwareComponent.displayName = `withKeyboardAware(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return KeyboardAwareComponent;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 16 },
});
```

### Usage

```tsx
function LoginForm() {
  return (
    <View style={{ gap: 16 }}>
      <TextInput placeholder="Email" keyboardType="email-address" />
      <TextInput placeholder="Password" secureTextEntry />
      <Button title="Log In" onPress={handleLogin} />
    </View>
  );
}

export default withKeyboardAware(LoginForm, {
  keyboardVerticalOffset: 100,
  contentContainerStyle: { justifyContent: "center" },
});
```

Key details:
- `behavior="padding"` on iOS, `"height"` on Android
- `keyboardShouldPersistTaps="handled"` prevents keyboard dismissal on button taps
- `keyboardVerticalOffset` accounts for header height

---

## 12. Platform-Adaptive Component

Components that render differently on iOS and Android to match platform conventions while sharing the same API.

### Implementation

```tsx
import { Platform, View, Pressable, Text, Modal, StyleSheet } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function DatePicker({ value, onChange, label, minimumDate, maximumDate }: DatePickerProps) {
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <DateTimePicker
          value={value}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_, date) => date && onChange(date)}
          style={styles.iosPicker}
        />
      </View>
    );
  }

  // Android: modal-based picker
  return <AndroidDatePicker value={value} onChange={onChange} label={label} minimumDate={minimumDate} maximumDate={maximumDate} />;
}

function AndroidDatePicker({ value, onChange, label, minimumDate, maximumDate }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowPicker(false);
    if (date) onChange(date);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setShowPicker(true)}
        style={styles.androidTrigger}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value.toLocaleDateString()}`}
      >
        <Text style={styles.dateText}>{value.toLocaleDateString()}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 14, fontWeight: "500", color: "#333" },
  iosPicker: { height: 180 },
  androidTrigger: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  dateText: { fontSize: 16, color: "#000" },
});
```

### Usage

```tsx
function BirthdayForm() {
  const [date, setDate] = useState(new Date());

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      label="Birthday"
      maximumDate={new Date()}
    />
  );
}
```

The same `DatePicker` component renders a native spinner on iOS and a Material dialog on Android.

---

## 13. Responsive Grid Component

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

---

## 14. Polymorphic Pressable Component

A pressable component that renders as different native elements while maintaining full type safety on the resulting props.

### Implementation

```tsx
import {
  type ElementType,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";

type PolymorphicProps<
  C extends ElementType,
  Props = object,
> = Props & {
  as?: C;
  children?: ReactNode;
  style?: ViewStyle;
} & Omit<ComponentPropsWithoutRef<C>, keyof Props | "as" | "children" | "style">;

type ButtonOwnProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type ButtonProps<C extends ElementType = typeof Pressable> = PolymorphicProps<
  C,
  ButtonOwnProps
>;

function Button<C extends ElementType = typeof Pressable>({
  as,
  variant = "primary",
  size = "md",
  style,
  children,
  ...props
}: ButtonProps<C>) {
  const Component = as || Pressable;

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 12, paddingVertical: 6 },
    md: { paddingHorizontal: 16, paddingVertical: 10 },
    lg: { paddingHorizontal: 24, paddingVertical: 14 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: "#007AFF" },
    secondary: { backgroundColor: "#E5E5EA" },
    ghost: { backgroundColor: "transparent" },
  };

  return (
    <Component
      style={[styles.base, variantStyles[variant], sizeStyles[size], style]}
      {...props}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
});
```

### Usage

```tsx
import { Link } from "expo-router";
import { TouchableOpacity } from "react-native";

// Renders as Pressable (default)
<Button variant="primary" onPress={handleSave}>
  <Text style={{ color: "#fff" }}>Save</Text>
</Button>

// Renders as Link — href prop is type-safe
<Button as={Link} href="/settings" variant="ghost">
  <Text>Settings</Text>
</Button>

// Renders as TouchableOpacity
<Button as={TouchableOpacity} activeOpacity={0.7} variant="secondary">
  <Text>Touch Me</Text>
</Button>
```

---

## 15. Polymorphic Text with Variants

A Text component with variant-based typography that maps to consistent font sizes, weights, and line heights across the app.

### Implementation

```tsx
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";

type Variant = "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption" | "label" | "overline";

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle["textAlign"];
  weight?: TextStyle["fontWeight"];
}

const variantStyles: Record<Variant, TextStyle> = {
  h1: { fontSize: 32, fontWeight: "700", lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "600", lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
  label: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  overline: { fontSize: 12, fontWeight: "600", lineHeight: 16, letterSpacing: 1, textTransform: "uppercase" },
};

function AppText({
  variant = "body",
  color,
  align,
  weight,
  style,
  ...props
}: AppTextProps) {
  return (
    <RNText
      style={[
        variantStyles[variant],
        color ? { color } : undefined,
        align ? { textAlign: align } : undefined,
        weight ? { fontWeight: weight } : undefined,
        style,
      ]}
      maxFontSizeMultiplier={1.5}
      {...props}
    />
  );
}

export { AppText as Text };
```

### Usage

```tsx
import { Text } from "@/components/ui/text";

function ProfileHeader({ user }: { user: User }) {
  return (
    <View style={{ gap: 4 }}>
      <Text variant="h2">{user.name}</Text>
      <Text variant="bodySmall" color="#666">{user.bio}</Text>
      <Text variant="overline" color="#999">Member since 2024</Text>
    </View>
  );
}
```

Set `maxFontSizeMultiplier` on the base component to ensure Dynamic Type support while preventing extreme layout breakage.

---

## 16. Theme Provider with System Detection

A theme provider that detects system color scheme, supports manual override, and provides typed color tokens via context.

### Implementation

```tsx
import { createContext, use, useState, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  error: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F2F2F7",
  text: "#000000",
  textSecondary: "#8E8E93",
  primary: "#007AFF",
  border: "#E5E5EA",
  error: "#FF3B30",
};

const darkColors: ThemeColors = {
  background: "#000000",
  surface: "#1C1C1E",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  primary: "#0A84FF",
  border: "#38383A",
  error: "#FF453A",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, isDark, colors, setMode }),
    [mode, isDark, colors]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme must be within ThemeProvider");
  return ctx;
}
```

### Usage

```tsx
// Root layout
export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}

// Consumer
function SettingsScreen() {
  const { mode, isDark, colors, setMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Theme: {mode}</Text>
      <Button title="Light" onPress={() => setMode("light")} />
      <Button title="Dark" onPress={() => setMode("dark")} />
      <Button title="System" onPress={() => setMode("system")} />
    </View>
  );
}
```

---

## 17. Toast Notification Provider

A toast provider with queue management. `useToast` hook returns `show(message, type)`. Auto-dismisses with configurable duration.

### Implementation

```tsx
import { createContext, use, useState, useCallback, useEffect, type ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function useToast() {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error("useToast must be within ToastProvider");
  return ctx;
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const bgColor = { success: "#34C759", error: "#FF3B30", info: "#007AFF" }[toast.type];

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.toast, { backgroundColor: bgColor }]}
    >
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 60, left: 16, right: 16, zIndex: 9999, gap: 8 },
  toast: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
```

### Usage

```tsx
// Root layout
export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack />
    </ToastProvider>
  );
}

// Any screen
function SaveButton() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.show("Saved successfully!", "success");
    } catch {
      toast.show("Failed to save", "error");
    }
  };

  return <Button title="Save" onPress={handleSave} />;
}
```

---

## 18. Imperative ScrollView Handle

Expose `scrollTo`, `scrollToEnd`, and `scrollToTop` methods from a custom ScrollView wrapper using `useImperativeHandle`.

### Implementation

```tsx
import { useRef, useImperativeHandle, type Ref, type ReactNode } from "react";
import { ScrollView, StyleSheet, type ScrollViewProps } from "react-native";

interface ScrollHandle {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd: (animated?: boolean) => void;
  scrollToTop: (animated?: boolean) => void;
}

interface ManagedScrollViewProps extends ScrollViewProps {
  ref?: Ref<ScrollHandle>;
  children: ReactNode;
}

function ManagedScrollView({ ref, children, ...props }: ManagedScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, () => ({
    scrollTo: (options) => scrollRef.current?.scrollTo(options),
    scrollToEnd: (animated = true) => scrollRef.current?.scrollToEnd({ animated }),
    scrollToTop: (animated = true) => scrollRef.current?.scrollTo({ y: 0, animated }),
  }));

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
```

### Usage

```tsx
function ChatScreen() {
  const scrollRef = useRef<ScrollHandle>(null);

  const onNewMessage = () => {
    scrollRef.current?.scrollToEnd();
  };

  return (
    <View style={{ flex: 1 }}>
      <ManagedScrollView ref={scrollRef}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </ManagedScrollView>
      <Pressable onPress={() => scrollRef.current?.scrollToTop()}>
        <Text>Back to Top</Text>
      </Pressable>
    </View>
  );
}
```

---

## 19. Native Input Handle

Expose `focus`, `blur`, and `clear` from a custom Input via useImperativeHandle.

### Implementation

```tsx
import { useRef, useImperativeHandle, type Ref } from "react";
import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";

interface InputHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

interface ManagedInputProps extends TextInputProps {
  ref?: Ref<InputHandle>;
  label?: string;
  error?: string;
}

function ManagedInput({ ref, label, error, style, ...props }: ManagedInputProps) {
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={inputRef}
        style={[styles.input, error && styles.inputError, style]}
        accessibilityLabel={label}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

### Usage

```tsx
function LoginForm() {
  const emailRef = useRef<InputHandle>(null);
  const passwordRef = useRef<InputHandle>(null);

  return (
    <View style={{ gap: 16 }}>
      <ManagedInput
        ref={emailRef}
        label="Email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <ManagedInput
        ref={passwordRef}
        label="Password"
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
    </View>
  );
}
```

Chain `returnKeyType` with `onSubmitEditing` to advance focus between inputs — essential for good form UX on mobile.

---

## 20. Card with Native Slots

A Card component with optional slots for header, media, body, footer, and actions. Uses platform shadows.

### Implementation

```tsx
import { View, Platform, StyleSheet, type ReactNode, type ViewStyle } from "react-native";

interface CardSlots {
  header?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

interface CardProps extends CardSlots {
  children: ReactNode;
  style?: ViewStyle;
}

function Card({ header, media, footer, actions, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {media && <View style={styles.media}>{media}</View>}
      {header && <View style={styles.header}>{header}</View>}
      <View style={styles.body}>{children}</View>
      {(footer || actions) && (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>{footer}</View>
          <View style={styles.footerActions}>{actions}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  media: { width: "100%", aspectRatio: 16 / 9 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  body: { paddingHorizontal: 16, paddingVertical: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16 },
  footerLeft: { flex: 1 },
  footerActions: { flexDirection: "row", gap: 8 },
});
```

### Usage

```tsx
<Card
  media={<Image source={{ uri: product.image }} style={{ width: "100%", height: "100%" }} />}
  header={<Text style={{ fontSize: 18, fontWeight: "600" }}>{product.name}</Text>}
  footer={<Text style={{ color: "#666" }}>${product.price}</Text>}
  actions={
    <>
      <IconButton icon={<Heart />} label="Favorite" onPress={toggleFavorite} />
      <IconButton icon={<Share />} label="Share" onPress={shareProduct} />
    </>
  }
>
  <Text style={{ color: "#333" }}>{product.description}</Text>
</Card>
```

---

## 21. Screen Layout with Slots

A screen layout with slots for header, scrollable content, sticky footer, and floating action button. Handles SafeArea automatically.

### Implementation

```tsx
import { View, ScrollView, StyleSheet, type ReactNode, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenLayoutSlots {
  header?: ReactNode;
  stickyFooter?: ReactNode;
  fab?: ReactNode;
}

interface ScreenLayoutProps extends ScreenLayoutSlots {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

function ScreenLayout({
  header,
  stickyFooter,
  fab,
  children,
  scrollable = true,
  style,
  contentStyle,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: [styles.scrollContent, contentStyle],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "handled" as const,
      }
    : { style: [styles.staticContent, contentStyle] };

  return (
    <View style={[styles.container, { paddingTop: insets.top }, style]}>
      {header && <View style={styles.header}>{header}</View>}

      <ContentWrapper {...contentProps}>{children}</ContentWrapper>

      {stickyFooter && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {stickyFooter}
        </View>
      )}

      {fab && (
        <View style={[styles.fab, { bottom: (stickyFooter ? 80 : 16) + insets.bottom }]}>
          {fab}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5EA" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  staticContent: { flex: 1, padding: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5EA" },
  fab: { position: "absolute", right: 16 },
});
```

### Usage

```tsx
function ProductsScreen() {
  return (
    <ScreenLayout
      header={<SearchBar />}
      stickyFooter={<Button title="Checkout" onPress={goToCheckout} />}
      fab={<FloatingButton icon={<Plus />} onPress={addProduct} />}
    >
      <ProductGrid products={products} />
    </ScreenLayout>
  );
}
```

---
