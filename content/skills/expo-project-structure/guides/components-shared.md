---
title: Shared Components
tags: components, shared, cross-domain, reusable
---

## Shared Components

`components/shared/` holds reusable composites that serve multiple domains. These are more opinionated than UI primitives but not owned by a single domain.

### What belongs in `components/shared/`

- `empty-state.shared.tsx` — Generic empty state with icon, title, description, and optional action
- `loading-overlay.shared.tsx` — Full-screen or section-level loading indicator
- `error-fallback.shared.tsx` — Error boundary fallback with retry action
- `list-footer-loader.shared.tsx` — Infinite scroll loading indicator
- `pull-to-refresh.shared.tsx` — Wrapper adding pull-to-refresh behavior
- `section-header.shared.tsx` — Reusable section title with optional action link
- `confirmation-sheet.shared.tsx` — Bottom sheet for destructive action confirmation
- `offline-banner.shared.tsx` — Network status banner

### Example: Empty state

```tsx
// components/shared/empty-state.shared.tsx
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 32, gap: 12 },
  icon: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  description: { fontSize: 14, color: "#666", textAlign: "center" },
});
```

### Example: Error fallback

```tsx
// components/shared/error-fallback.shared.tsx
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";

type ErrorFallbackProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorFallback({
  message = "Something went wrong.",
  onRetry,
}: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button title="Try Again" onPress={onRetry} variant="secondary" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  message: { fontSize: 16, color: "#333", textAlign: "center" },
});
```

### Promotion rules

1. **Do not create shared components speculatively.** A component earns shared status when two or more domains actually use it.
2. **Name with `.shared.tsx` suffix** to signal cross-domain ownership.
3. **Keep shared components generic.** If a shared component accumulates domain-specific props, it should be split or moved to a domain folder.
4. **Shared components may use UI primitives** from `components/ui/` but should not import from domain folders.

### Shared vs UI

| `components/ui/` | `components/shared/` |
|-------------------|----------------------|
| Low-level primitives | Composed patterns |
| No layout opinions | Has layout and content structure |
| Domain-agnostic | Domain-agnostic but opinionated |
| `Button`, `Input`, `Card` | `EmptyState`, `ErrorFallback`, `OfflineBanner` |
