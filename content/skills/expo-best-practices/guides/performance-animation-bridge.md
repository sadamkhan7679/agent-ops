---
title: UI Thread Animations with Reanimated
impact: CRITICAL
tags: reanimated, animations, ui-thread, performance, worklets
---

## UI Thread Animations with Reanimated

Animations running on the JS thread block user interactions and cause dropped frames. Reanimated runs animations on the UI thread via worklets, achieving consistent 60fps.

**Incorrect (JS thread animation — causes jank during heavy renders):**

```tsx
import { useRef, useEffect } from "react";
import { Animated } from "react-native";

function FadeIn({ children }: { children: ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true, // Helps, but still starts on JS thread
    }).start();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
```

**Correct (Reanimated worklet — runs entirely on UI thread):**

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useEffect, type ReactNode } from "react";

function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
```

**Correct (gesture-driven animation — no bridge crossings):**

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

function DraggableCard({ children }: { children: ReactNode }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

Rules:
- Use `useSharedValue` instead of `Animated.Value`
- Use `useAnimatedStyle` instead of `Animated.View` style interpolation
- Use `withTiming`, `withSpring`, `withDelay` for declarative animations
- Gesture callbacks with Reanimated run on UI thread — no bridge latency
- Never access React state inside worklets — use shared values
