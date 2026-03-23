---
title: Expo Router File-Based Routing
tags: expo-router, routing, app-directory, navigation
---

## Expo Router File-Based Routing

Expo Router v4 uses the `app/` directory for file-based routing. Every file in `app/` becomes a route. This is the primary navigation mechanism for Expo SDK 52+.

### Basic conventions

```text
app/
  _layout.tsx           # Root layout (wraps all routes)
  index.tsx             # "/" — home screen
  settings.tsx          # "/settings"
  [id].tsx              # "/123" — dynamic segment
  [...missing].tsx      # Catch-all for 404
```

### Route groups

Parenthesized folders create **groups** without affecting the URL path:

```text
app/
  (tabs)/
    _layout.tsx         # Tab navigator layout
    index.tsx           # "/" — first tab
    explore.tsx         # "/explore" — second tab
    profile.tsx         # "/profile" — third tab
  (auth)/
    _layout.tsx         # Auth stack layout
    login.tsx           # "/login"
    register.tsx        # "/register"
    forgot-password.tsx # "/forgot-password"
  (modals)/
    _layout.tsx         # Modal presentation stack
    confirm.tsx         # "/confirm"
```

### Dynamic routes

```text
app/
  products/
    [id].tsx            # "/products/123"
    [id]/
      reviews.tsx       # "/products/123/reviews"
  users/
    [userId]/
      posts/
        [postId].tsx    # "/users/42/posts/7"
```

Access params with `useLocalSearchParams`:

```tsx
import { useLocalSearchParams } from "expo-router";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // ...
}
```

### What belongs in route files

Route files should:

- Compose screen sections from `components/screens/`
- Apply route-level data fetching or suspense boundaries
- Define route-specific metadata or head elements
- Wire up route params to domain hooks

Route files should **not**:

- Contain 200+ lines of inline UI markup
- Define reusable components
- Contain business logic or API calls directly
- Export shared hooks or utilities

### Keep routes lean

A well-structured route file looks like:

```tsx
import { ProfileHeader } from "@/components/screens/profile-header.screen";
import { ProfileActivity } from "@/components/screens/profile-activity.screen";
import { ProfileStats } from "@/components/screens/profile-stats.screen";
import { ScreenContainer } from "@/components/ui/screen-container";

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ProfileHeader />
      <ProfileStats />
      <ProfileActivity />
    </ScreenContainer>
  );
}
```

### API routes

Expo Router supports API routes for server-side logic when using Expo with server output:

```text
app/
  api/
    auth+api.ts         # POST /api/auth
    users/[id]+api.ts   # GET /api/users/123
```

Keep API route logic thin — delegate to services.
