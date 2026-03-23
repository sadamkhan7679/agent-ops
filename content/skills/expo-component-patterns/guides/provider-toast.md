---
title: Toast Notification Provider
impact: MEDIUM
tags: provider, toast, notification, queue, animated
---

## Toast Notification Provider

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
