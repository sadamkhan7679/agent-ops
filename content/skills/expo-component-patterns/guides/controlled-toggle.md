---
title: Controlled/Uncontrolled Toggle
impact: MEDIUM
tags: controlled, uncontrolled, toggle, switch, dual-mode
---

## Controlled/Uncontrolled Toggle

A Switch/Toggle that works in both controlled and uncontrolled modes using useControllableState.

### Implementation

```tsx
import { Switch, View, Text, StyleSheet } from "react-native";

interface ToggleProps {
  value?: boolean;
  defaultValue?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

function Toggle({
  value,
  defaultValue = false,
  onValueChange,
  label,
  disabled = false,
}: ToggleProps) {
  const [isOn, setIsOn] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>}
      <Switch
        value={isOn}
        onValueChange={setIsOn}
        disabled={disabled}
        trackColor={{ false: "#E5E5EA", true: "#34C759" }}
        thumbColor="#fff"
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: isOn, disabled }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  label: { fontSize: 16, color: "#000", flex: 1, marginRight: 12 },
  disabled: { color: "#999" },
});
```

### Usage

```tsx
// Uncontrolled
<Toggle label="Push Notifications" defaultValue={true} onValueChange={(v) => console.log(v)} />

// Controlled
const [darkMode, setDarkMode] = useState(false);
<Toggle label="Dark Mode" value={darkMode} onValueChange={setDarkMode} />

// Disabled
<Toggle label="Premium Feature" value={false} disabled />
```
