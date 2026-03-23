---
title: Splitting Components
tags: splitting, components, refactoring, decomposition
---

## Splitting Components

Components should be split by **responsibility**, not by line count alone. A 200-line component with a single clear purpose may be fine. A 100-line component mixing three responsibilities should be split.

### When to split a component

Split when:

- The component handles multiple visual regions with distinct purposes
- Logic obscures the rendering (state management tangled with markup)
- Internal subparts have meaningful names and boundaries
- Loading, error, and success states create a large conditional render tree
- The component accepts 10+ props that serve different sub-concerns

### When not to split

Do not split when:

- The child would wrap fewer than 15 lines with no meaningful boundary
- The abstraction name is weaker than reading the inline code
- The component is already focused on one responsibility
- Splitting would create tight coupling between parent and child with no reuse

### Split into what?

| Extracted piece | Where it goes |
|----------------|---------------|
| Visual sub-region | Same domain folder or `components/screens/` |
| Stateful logic | `hooks/<domain>/` |
| API communication | `services/<domain>/` |
| State management | `store/<domain>/` |
| Validation | `schema/<domain>/` |
| Formatting/parsing | `lib/<concern>/` |

### Example: Before splitting

```tsx
// components/products/product-detail.tsx — 250 lines
export function ProductDetail({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const [showReviews, setShowReviews] = useState(false);

  return (
    <ScrollView>
      {/* 40 lines: image gallery */}
      {/* 30 lines: product info */}
      {/* 40 lines: variant picker */}
      {/* 20 lines: quantity selector */}
      {/* 30 lines: add to cart button with loading */}
      {/* 50 lines: reviews section */}
    </ScrollView>
  );
}
```

### Example: After splitting

```tsx
// components/products/product-detail.tsx — 30 lines
export function ProductDetail({ product }: { product: Product }) {
  const { selectedVariant, setSelectedVariant, quantity, setQuantity, addToCart, isAdding } =
    useProductActions(product);

  return (
    <ScrollView>
      <ProductGallery images={product.images} />
      <ProductInfo product={product} />
      <ProductVariantPicker
        variants={product.variants}
        selected={selectedVariant}
        onSelect={setSelectedVariant}
      />
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton onPress={addToCart} loading={isAdding} />
      <ProductReviews productId={product.id} />
    </ScrollView>
  );
}
```

```tsx
// hooks/products/use-product-actions.hook.ts
export function useProductActions(product: Product) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const addToCart = useCallback(async () => {
    setIsAdding(true);
    try {
      addItem({ ...selectedVariant, quantity });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsAdding(false);
    }
  }, [selectedVariant, quantity, addItem]);

  return { selectedVariant, setSelectedVariant, quantity, setQuantity, addToCart, isAdding };
}
```

### Extracting sub-components

Keep extracted sub-components in the same domain folder:

```text
components/
  products/
    product-detail.tsx           # Parent compositor
    product-gallery.tsx          # Image carousel
    product-info.tsx             # Title, price, description
    product-variant-picker.tsx   # Size/color selector
    product-reviews.tsx          # Reviews list
```

### Prop drilling vs hooks

If splitting creates deep prop drilling:

1. **First, try composition.** Pass children or render props.
2. **Then, try a domain hook.** Let each sub-component fetch its own data.
3. **Last resort, use a domain store.** Zustand with selectors avoids unnecessary re-renders.

Do not use Context for component-level state sharing — it re-renders all consumers.

### Platform-specific splits

When a component needs significantly different behavior per platform:

```text
components/
  media/
    media-player.tsx             # Shared interface/logic
    media-player.ios.tsx         # iOS AVPlayer implementation
    media-player.android.tsx     # Android ExoPlayer implementation
```

Use platform splits only when `Platform.select` is insufficient — typically for native module differences or fundamentally different UI patterns.
