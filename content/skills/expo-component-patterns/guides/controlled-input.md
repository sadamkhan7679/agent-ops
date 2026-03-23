---
title: Controlled/Uncontrolled TextInput
impact: MEDIUM
tags: controlled, uncontrolled, input, dual-mode, state
---

## Controlled/Uncontrolled TextInput

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
