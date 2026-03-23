---
title: Gesture Handler Patterns
impact: MEDIUM
tags: gestures, swipe, pan, pinch, gesture-handler, reanimated
---

## Gesture Handler Patterns

React Native's built-in touch system runs on the JS thread and conflicts with native scroll views. `react-native-gesture-handler` runs gestures on the native thread for responsive, conflict-free interactions.

**Incorrect (JS thread gesture handling):**

```tsx
import { PanResponder } from "react-native";

// PanResponder runs on JS thread — laggy and conflicts with ScrollView
const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: () => true,
  onPanResponderMove: (_, gestureState) => {
    // Runs on JS thread — dropped frames during heavy renders
    setPosition({ x: gestureState.dx, y: gestureState.dy });
  },
});
```

**Correct (Gesture Handler + Reanimated on UI thread):**

```tsx
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

function SwipeToDelete({ onDelete, children }: {
  onDelete: () => void;
  children: ReactNode;
}) {
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -120;

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Clamp to left swipe only
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withSpring(-300);
        runOnJS(onDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.deleteBackground}>
        <Text style={styles.deleteText}>Delete</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```

**Correct (composed gestures — pinch + pan):**

```tsx
function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.Image source={{ uri }} style={[styles.image, animatedStyle]} />
    </GestureDetector>
  );
}
```

Rules:
- Use `react-native-gesture-handler` instead of `PanResponder`
- Combine with Reanimated for UI thread gesture-driven animations
- Use `Gesture.Simultaneous` for multi-gesture interactions (pinch + pan)
- Use `activeOffsetX`/`activeOffsetY` to prevent gesture conflicts with scroll views
- Use `runOnJS` to call React state setters from worklets
