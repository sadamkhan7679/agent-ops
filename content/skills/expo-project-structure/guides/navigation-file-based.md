---
title: File-Based Routing Conventions
tags: navigation, expo-router, routing, conventions
---

## File-Based Routing Conventions

Expo Router maps the `app/` directory to routes. Understanding the conventions is critical for structuring navigation correctly.

### Route file types

| File pattern | Purpose | Example URL |
|-------------|---------|-------------|
| `index.tsx` | Index route for a directory | `/` or `/products` |
| `about.tsx` | Static named route | `/about` |
| `[id].tsx` | Dynamic segment | `/products/123` |
| `[...rest].tsx` | Catch-all segment | `/docs/a/b/c` |
| `+not-found.tsx` | 404 handler | Any unmatched route |
| `_layout.tsx` | Layout wrapper | N/A (wraps children) |

### Route groups

Groups organize routes without affecting URLs. They are defined with parentheses:

```text
app/
  (tabs)/               # Tab-based navigation group
    _layout.tsx
    index.tsx            # "/"
    search.tsx           # "/search"
  (auth)/               # Authentication flow group
    _layout.tsx
    login.tsx            # "/login"
    register.tsx         # "/register"
  (settings)/           # Settings stack group
    _layout.tsx
    index.tsx            # "/settings"
    notifications.tsx    # "/notifications"
```

### Nested routes

Directories create route nesting:

```text
app/
  products/
    _layout.tsx          # Stack navigator for products
    index.tsx            # "/products"
    [id].tsx             # "/products/123"
    [id]/
      reviews.tsx        # "/products/123/reviews"
      edit.tsx           # "/products/123/edit"
```

### Modal routes

Present routes as modals using groups and screen options:

```text
app/
  (modals)/
    _layout.tsx          # Stack with presentation: "modal"
    confirm-delete.tsx   # "/confirm-delete" (presented as modal)
    image-viewer.tsx     # "/image-viewer" (presented as modal)
```

```tsx
// app/(modals)/_layout.tsx
import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ presentation: "modal", headerShown: false }}>
      <Stack.Screen name="confirm-delete" />
      <Stack.Screen name="image-viewer" />
    </Stack>
  );
}
```

### Deep linking

Expo Router generates deep links automatically from the file structure. The route `/products/[id]` maps to `myapp://products/123`.

Configure custom schemes in `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "plugins": [
      ["expo-router", { "origin": "https://myapp.com" }]
    ]
  }
}
```

### Route organization rules

1. **Keep the `app/` directory shallow.** Avoid more than 3 levels of nesting.
2. **Use groups to separate navigation paradigms** (tabs, auth, modals), not to organize by domain.
3. **Route files should be thin.** Delegate to `components/screens/` for the actual UI.
4. **Name dynamic segments descriptively.** Use `[productId]` over `[id]` when the parent folder does not provide enough context.
5. **Place shared layouts at the highest common ancestor.** Do not duplicate layout logic.
