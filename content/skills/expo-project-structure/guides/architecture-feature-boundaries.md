---
title: Feature Boundaries
tags: architecture, features, boundaries, mobile
---

## Feature Boundaries

Layer-first is the default. Feature folders are an alternative when a domain grows large enough that navigating across layers becomes painful.

### When to stay layer-first

Stay layer-first when:

- The app has fewer than 8-10 domains
- Most domains have 3-5 files per layer
- Team members work across domains regularly
- You want maximum consistency and discoverability

### When to consider feature folders

Consider feature folders when:

- A domain has 15+ files spread across 5+ layers
- A dedicated team owns the entire feature end-to-end
- The feature ships independently (e.g., a standalone module in a super-app)
- The feature has its own navigation stack and rarely shares components

### Feature folder structure

```text
features/
  checkout/
    components/
      checkout-summary.tsx
      checkout-item-row.tsx
    hooks/
      use-checkout.hook.ts
    services/
      checkout.service.ts
    store/
      checkout.store.ts
    types/
      checkout.types.ts
    screens/
      checkout-review.screen.tsx
```

### Hybrid approach

Most Expo apps benefit from a hybrid: layer-first for most code, feature folders for one or two large bounded contexts.

```text
app/
components/
  ui/
  shared/
  screens/
  profile/
  settings/
hooks/
  auth/
  profile/
services/
  auth/
  profile/
features/
  checkout/           # Large enough to warrant isolation
    components/
    hooks/
    services/
    store/
    types/
```

### Rules for feature folders

1. A feature folder must be self-contained. It should not import from another feature folder.
2. Features may import from shared layers: `components/ui/`, `components/shared/`, `lib/`, `types/`, `constants/`.
3. If two features need the same code, promote it to the shared layer — do not create cross-feature imports.
4. Feature folders still use the same naming conventions and file suffixes.

### Mobile-specific boundary concerns

React Native apps have stricter boundary needs than web apps because:

- **Navigation coupling**: Screen components are tightly bound to navigator configuration. Isolating a feature means isolating its navigation stack.
- **Native module dependencies**: A feature that uses the camera, location, or notifications pulls in native configuration. Bundling that configuration with the feature makes it easier to add or remove.
- **Bundle size**: Unlike web apps with route-based code splitting, React Native bundles everything. Feature boundaries help identify what can be lazy-loaded with `React.lazy` or deferred.
- **Platform forks**: A feature may need `.ios.tsx` and `.android.tsx` variants. Keeping these inside the feature folder prevents platform files from scattering.

### Do not over-isolate

Creating a feature folder for every domain leads to the same discovery problems as a giant `features/` bucket on the web. Reserve feature folders for genuinely large, self-contained domains.
