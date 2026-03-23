---
title: Native Input Handle
impact: MEDIUM
tags: ref, imperative-handle, focus, blur, input
---

## Native Input Handle

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
