---
title: Imperative ScrollView Handle
impact: MEDIUM
tags: ref, imperative-handle, scroll, forwardRef
---

## Imperative ScrollView Handle

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
