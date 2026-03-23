---
title: Keyboard-Aware HOC
impact: MEDIUM
tags: hoc, keyboard, form, scroll, avoiding-view
---

## Keyboard-Aware HOC

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
