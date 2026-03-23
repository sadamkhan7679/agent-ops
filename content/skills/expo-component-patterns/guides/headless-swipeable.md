---
title: Swipeable Row with Render Callback
impact: MEDIUM
tags: headless, swipeable, gesture, render-callback
---

## Swipeable Row with Render Callback

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
