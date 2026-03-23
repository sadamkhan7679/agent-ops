---
title: Naming Conventions
tags: naming, conventions, files, kebab-case
---

## Naming Conventions

Consistent naming eliminates guesswork about where files live and what they do. Use **kebab-case** file names with **responsibility suffixes**.

### File naming rules

| Type | Pattern | Example |
|------|---------|---------|
| Component | `<name>.tsx` | `product-card.tsx` |
| Screen section | `<screen>-<section>.screen.tsx` | `home-hero.screen.tsx` |
| Shared component | `<name>.shared.tsx` | `empty-state.shared.tsx` |
| Hook | `use-<name>.hook.ts` | `use-auth.hook.ts` |
| Service | `<name>.service.ts` | `product.service.ts` |
| Store | `<name>.store.ts` | `cart.store.ts` |
| Types | `<name>.types.ts` | `product.types.ts` |
| Constants | `<name>.constants.ts` | `app.constants.ts` |
| Lib helper | `<name>.lib.ts` | `format-date.lib.ts` |
| Config plugin | `<name>.plugin.js` | `with-camera.plugin.js` |

### Directory naming

Directories use kebab-case and describe the domain or concern:

```text
components/
  ui/
  shared/
  screens/
  order-history/        # Domain with hyphen
hooks/
  auth/
  native/
services/
  push-notifications/   # Domain with hyphen
```

### Component naming inside files

Files use kebab-case, but the exported component uses PascalCase:

```tsx
// File: components/profile/profile-header.tsx
// Export: ProfileHeader

export function ProfileHeader() { /* ... */ }
```

### Why kebab-case files

- Works consistently across operating systems (macOS is case-insensitive by default)
- Matches URL segment conventions in Expo Router
- Avoids conflicts between `ProfileHeader.tsx` and `profileHeader.tsx`
- Easier to scan in file trees

### Prefix conventions for domain components

Use the domain name as a prefix for components within a domain folder:

```text
components/
  orders/
    order-card.tsx           # Not "card.tsx"
    order-status-badge.tsx   # Not "status-badge.tsx"
    order-timeline.tsx       # Not "timeline.tsx"
```

This prevents collisions when searching across domains and makes imports self-documenting:

```tsx
import { OrderCard } from "@/components/orders/order-card";
import { ProductCard } from "@/components/products/product-card";
```

### Index files

Use `index.ts` barrel exports sparingly. They are appropriate for:

- `components/ui/index.ts` — Re-exporting all UI primitives
- A domain folder with a clear public API

Avoid index files when:

- The folder has many files and the barrel becomes a maintenance burden
- It creates circular dependency risks
- Tree-shaking is important (barrel re-exports can defeat bundler optimizations)

### Avoid these names

- `utils.ts` — Hides responsibility. Name the specific concern.
- `helpers.ts` — Same problem. Use `format-date.lib.ts` or `parse-currency.lib.ts`.
- `common.ts` — Vague. Place in the appropriate layer with a descriptive name.
- `misc.ts` — A junk drawer signal.
- `index.tsx` outside of `app/` — Prefer named files over default exports from index.
