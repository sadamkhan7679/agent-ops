---
title: Form Group with Shared Validation
impact: MEDIUM
tags: compound, form, validation, context, error-handling
---

## Form Group with Shared Validation

A compound form group provides shared validation context. Fields register themselves, and the group coordinates validation on submit.

### Implementation

```tsx
import { createContext, use, useCallback, useRef, useState, type ReactNode } from "react";
import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";

interface FieldError {
  field: string;
  message: string;
}

interface FormGroupContextValue {
  errors: Map<string, string>;
  register: (field: string, validate: (value: string) => string | null) => void;
  setFieldValue: (field: string, value: string) => void;
  validateAll: () => boolean;
}

const FormGroupContext = createContext<FormGroupContextValue | null>(null);

function useFormGroup() {
  const ctx = use(FormGroupContext);
  if (!ctx) throw new Error("FormField must be inside FormGroup");
  return ctx;
}

function FormGroup({ children, onSubmit }: { children: ReactNode; onSubmit: (values: Record<string, string>) => void }) {
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const validators = useRef<Map<string, (value: string) => string | null>>(new Map());
  const values = useRef<Map<string, string>>(new Map());

  const register = useCallback((field: string, validate: (value: string) => string | null) => {
    validators.current.set(field, validate);
  }, []);

  const setFieldValue = useCallback((field: string, value: string) => {
    values.current.set(field, value);
    // Clear error on change
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const validateAll = useCallback(() => {
    const nextErrors = new Map<string, string>();
    for (const [field, validate] of validators.current) {
      const value = values.current.get(field) ?? "";
      const error = validate(value);
      if (error) nextErrors.set(field, error);
    }
    setErrors(nextErrors);

    if (nextErrors.size === 0) {
      onSubmit(Object.fromEntries(values.current));
      return true;
    }
    return false;
  }, [onSubmit]);

  return (
    <FormGroupContext value={{ errors, register, setFieldValue, validateAll }}>
      <View>{children}</View>
    </FormGroupContext>
  );
}
```

### FormField Component

```tsx
interface FormFieldProps extends Omit<TextInputProps, "onChangeText"> {
  name: string;
  label: string;
  validate?: (value: string) => string | null;
}

function FormField({ name, label, validate, ...props }: FormFieldProps) {
  const { errors, register, setFieldValue } = useFormGroup();

  useEffect(() => {
    if (validate) register(name, validate);
  }, [name, validate, register]);

  const error = errors.get(name);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        onChangeText={(text) => setFieldValue(name, text)}
        accessibilityLabel={label}
        aria-invalid={!!error}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const FormGroupCompound = { Root: FormGroup, Field: FormField };
```

### Usage

```tsx
function ContactForm() {
  return (
    <FormGroupCompound.Root onSubmit={(values) => submitContact(values)}>
      <FormGroupCompound.Field
        name="name"
        label="Name"
        validate={(v) => (v.length < 2 ? "Name is required" : null)}
      />
      <FormGroupCompound.Field
        name="email"
        label="Email"
        keyboardType="email-address"
        validate={(v) => (!v.includes("@") ? "Invalid email" : null)}
      />
      <SubmitButton />
    </FormGroupCompound.Root>
  );
}
```
