---
title: Theme Provider with System Detection
impact: MEDIUM
tags: provider, theme, dark-mode, context, color-scheme
---

## Theme Provider with System Detection

A theme provider that detects system color scheme, supports manual override, and provides typed color tokens via context.

### Implementation

```tsx
import { createContext, use, useState, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  error: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F2F2F7",
  text: "#000000",
  textSecondary: "#8E8E93",
  primary: "#007AFF",
  border: "#E5E5EA",
  error: "#FF3B30",
};

const darkColors: ThemeColors = {
  background: "#000000",
  surface: "#1C1C1E",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  primary: "#0A84FF",
  border: "#38383A",
  error: "#FF453A",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, isDark, colors, setMode }),
    [mode, isDark, colors]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme must be within ThemeProvider");
  return ctx;
}
```

### Usage

```tsx
// Root layout
export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}

// Consumer
function SettingsScreen() {
  const { mode, isDark, colors, setMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Theme: {mode}</Text>
      <Button title="Light" onPress={() => setMode("light")} />
      <Button title="Dark" onPress={() => setMode("dark")} />
      <Button title="System" onPress={() => setMode("system")} />
    </View>
  );
}
```
