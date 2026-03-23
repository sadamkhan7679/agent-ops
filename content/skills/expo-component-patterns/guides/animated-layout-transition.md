---
title: Layout Animations
impact: HIGH
tags: animated, layout, entering, exiting, reanimated
---

## Layout Animations

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
