---
title: Action Menu Compound Component
impact: HIGH
tags: compound, action-menu, context, pressable, overlay
---

## Action Menu Compound Component

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
