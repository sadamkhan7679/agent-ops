---
title: Card with Native Slots
impact: LOW
tags: slot, card, composition, layout, native
---

## Card with Native Slots

A Card component with optional slots for header, media, body, footer, and actions. Uses platform shadows.

### Implementation

```tsx
import { View, Platform, StyleSheet, type ReactNode, type ViewStyle } from "react-native";

interface CardSlots {
  header?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

interface CardProps extends CardSlots {
  children: ReactNode;
  style?: ViewStyle;
}

function Card({ header, media, footer, actions, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {media && <View style={styles.media}>{media}</View>}
      {header && <View style={styles.header}>{header}</View>}
      <View style={styles.body}>{children}</View>
      {(footer || actions) && (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>{footer}</View>
          <View style={styles.footerActions}>{actions}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  media: { width: "100%", aspectRatio: 16 / 9 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  body: { paddingHorizontal: 16, paddingVertical: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16 },
  footerLeft: { flex: 1 },
  footerActions: { flexDirection: "row", gap: 8 },
});
```

### Usage

```tsx
<Card
  media={<Image source={{ uri: product.image }} style={{ width: "100%", height: "100%" }} />}
  header={<Text style={{ fontSize: 18, fontWeight: "600" }}>{product.name}</Text>}
  footer={<Text style={{ color: "#666" }}>${product.price}</Text>}
  actions={
    <>
      <IconButton icon={<Heart />} label="Favorite" onPress={toggleFavorite} />
      <IconButton icon={<Share />} label="Share" onPress={shareProduct} />
    </>
  }
>
  <Text style={{ color: "#333" }}>{product.description}</Text>
</Card>
```
