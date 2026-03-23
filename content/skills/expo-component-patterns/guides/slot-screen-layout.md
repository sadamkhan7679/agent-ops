---
title: Screen Layout with Slots
impact: LOW
tags: slot, screen, layout, safe-area, fab
---

## Screen Layout with Slots

A screen layout with slots for header, scrollable content, sticky footer, and floating action button. Handles SafeArea automatically.

### Implementation

```tsx
import { View, ScrollView, StyleSheet, type ReactNode, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenLayoutSlots {
  header?: ReactNode;
  stickyFooter?: ReactNode;
  fab?: ReactNode;
}

interface ScreenLayoutProps extends ScreenLayoutSlots {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

function ScreenLayout({
  header,
  stickyFooter,
  fab,
  children,
  scrollable = true,
  style,
  contentStyle,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: [styles.scrollContent, contentStyle],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "handled" as const,
      }
    : { style: [styles.staticContent, contentStyle] };

  return (
    <View style={[styles.container, { paddingTop: insets.top }, style]}>
      {header && <View style={styles.header}>{header}</View>}

      <ContentWrapper {...contentProps}>{children}</ContentWrapper>

      {stickyFooter && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {stickyFooter}
        </View>
      )}

      {fab && (
        <View style={[styles.fab, { bottom: (stickyFooter ? 80 : 16) + insets.bottom }]}>
          {fab}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5EA" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  staticContent: { flex: 1, padding: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5EA" },
  fab: { position: "absolute", right: 16 },
});
```

### Usage

```tsx
function ProductsScreen() {
  return (
    <ScreenLayout
      header={<SearchBar />}
      stickyFooter={<Button title="Checkout" onPress={goToCheckout} />}
      fab={<FloatingButton icon={<Plus />} onPress={addProduct} />}
    >
      <ProductGrid products={products} />
    </ScreenLayout>
  );
}
```
