---
title: Platform-Adaptive Component
impact: MEDIUM
tags: platform, ios, android, adaptive, date-picker
---

## Platform-Adaptive Component

Components that render differently on iOS and Android to match platform conventions while sharing the same API.

### Implementation

```tsx
import { Platform, View, Pressable, Text, Modal, StyleSheet } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function DatePicker({ value, onChange, label, minimumDate, maximumDate }: DatePickerProps) {
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <DateTimePicker
          value={value}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_, date) => date && onChange(date)}
          style={styles.iosPicker}
        />
      </View>
    );
  }

  // Android: modal-based picker
  return <AndroidDatePicker value={value} onChange={onChange} label={label} minimumDate={minimumDate} maximumDate={maximumDate} />;
}

function AndroidDatePicker({ value, onChange, label, minimumDate, maximumDate }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowPicker(false);
    if (date) onChange(date);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setShowPicker(true)}
        style={styles.androidTrigger}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value.toLocaleDateString()}`}
      >
        <Text style={styles.dateText}>{value.toLocaleDateString()}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 14, fontWeight: "500", color: "#333" },
  iosPicker: { height: 180 },
  androidTrigger: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  dateText: { fontSize: 16, color: "#000" },
});
```

### Usage

```tsx
function BirthdayForm() {
  const [date, setDate] = useState(new Date());

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      label="Birthday"
      maximumDate={new Date()}
    />
  );
}
```

The same `DatePicker` component renders a native spinner on iOS and a Material dialog on Android.
