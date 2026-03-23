---
title: Platform-Specific Code Patterns
impact: MEDIUM
tags: platform, ios, android, platform-select, conditional
---

## Platform-Specific Code Patterns

iOS and Android have different UI conventions, shadow APIs, and behavioral expectations. Platform-aware code delivers a native feel on both.

**Using Platform.select for inline differences:**

```tsx
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusBarPadding: {
    paddingTop: Platform.OS === "ios" ? 44 : 0,
  },
});
```

**Using platform-specific file extensions:**

```
components/
  date-picker.tsx          # Shared interface
  date-picker.ios.tsx      # iOS implementation
  date-picker.android.tsx  # Android implementation
```

```tsx
// date-picker.ios.tsx
import DateTimePicker from "@react-native-community/datetimepicker";

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="spinner"  // iOS-native wheel picker
      onChange={(_, date) => date && onChange(date)}
    />
  );
}

// date-picker.android.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <Text>{value.toLocaleDateString()}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"  // Android Material dialog
          onChange={(_, date) => {
            setShow(false);
            if (date) onChange(date);
          }}
        />
      )}
    </>
  );
}

// Import resolves to the correct file automatically
import { DatePicker } from "@/components/date-picker";
```

Rules:
- Use `Platform.select` for small style differences (shadows, padding)
- Use `.ios.tsx` / `.android.tsx` file extensions for fundamentally different implementations
- Keep the exported interface identical across platform files
- Prefer `Platform.select` over `Platform.OS === "ios" ? x : y` for readability
