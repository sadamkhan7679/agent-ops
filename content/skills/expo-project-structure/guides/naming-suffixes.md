---
title: Suffix Reference
tags: naming, suffixes, conventions, reference
---

## Suffix Reference

Suffixes clarify a file's role at a glance. They help developers locate files by responsibility without opening them.

### Complete suffix table

| Suffix | Extension | Purpose | Example |
|--------|-----------|---------|---------|
| `.screen` | `.tsx` | Screen composition section | `home-hero.screen.tsx` |
| `.shared` | `.tsx` | Cross-domain reusable component | `error-fallback.shared.tsx` |
| `.hook` | `.ts` | Custom React hook | `use-auth.hook.ts` |
| `.service` | `.ts` | External communication / API | `product.service.ts` |
| `.store` | `.ts` | State management module | `cart.store.ts` |
| `.types` | `.ts` | Type definitions | `order.types.ts` |
| `.constants` | `.ts` | Static constant values | `app.constants.ts` |
| `.lib` | `.ts` | Pure utility / helper | `format-date.lib.ts` |
| `.schema` | `.ts` | Validation schema (Zod, Yup) | `login.schema.ts` |
| `.plugin` | `.js` | Expo config plugin | `with-camera.plugin.js` |
| `.test` | `.ts`/`.tsx` | Test file | `product.service.test.ts` |
| `.mock` | `.ts` | Test mock / fixture | `product.mock.ts` |

### When to use suffixes

Use suffixes when:

- The file lives in a layer folder and the suffix adds clarity (`services/auth/auth.service.ts`)
- Multiple file types exist for the same domain concept (`cart.store.ts`, `cart.types.ts`, `cart.service.ts`)
- The suffix prevents ambiguity (`profile-header.screen.tsx` vs `profile-header.tsx` in components)

### When to skip suffixes

Skip suffixes for:

- UI primitive components in `components/ui/` — `button.tsx` is clear enough without `.component.tsx`
- Domain components in `components/<domain>/` — `order-card.tsx` is self-descriptive
- React Native entry files — `_layout.tsx`, `index.tsx`
- Config files — `app.config.ts`, `metro.config.js`

### Suffix decision guide

```text
Is the file a component?
  ├── In components/ui/ → No suffix (button.tsx)
  ├── In components/shared/ → .shared.tsx
  ├── In components/screens/ → .screen.tsx
  └── In components/<domain>/ → No suffix (order-card.tsx)

Is the file logic?
  ├── React hook → .hook.ts
  ├── API/external call → .service.ts
  ├── State management → .store.ts
  └── Pure utility → .lib.ts

Is the file data/config?
  ├── Type definitions → .types.ts
  ├── Constants → .constants.ts
  ├── Validation → .schema.ts
  └── Expo plugin → .plugin.js
```

### Real-world example

A complete domain with all suffixes:

```text
components/
  orders/
    order-card.tsx
    order-list.tsx
    order-detail-header.tsx
  screens/
    orders-list.screen.tsx
    order-detail.screen.tsx
hooks/
  orders/
    use-orders.hook.ts
    use-order-detail.hook.ts
    use-order-actions.hook.ts
services/
  orders/
    order.service.ts
store/
  orders/
    order.store.ts
types/
  orders/
    order.types.ts
constants/
  orders/
    order.constants.ts
```

### Consistency over perfection

The most important rule is consistency within the project. If the team decides to use `.hook.ts`, use it everywhere. If the team prefers no suffix for hooks, skip it everywhere. Do not mix conventions.
