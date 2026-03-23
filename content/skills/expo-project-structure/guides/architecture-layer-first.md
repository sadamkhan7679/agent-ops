---
title: Layer-First Architecture
tags: architecture, layers, mobile, structure
---

## Layer-First Architecture

Organize an Expo project by **responsibility first** and **domain second**. Each top-level folder represents a technical layer. Inside each layer, domain folders group related files.

### Why layer-first for mobile

Mobile apps have tighter coupling between navigation, native APIs, and platform behavior. Layer-first keeps these concerns separated so a change to navigation does not ripple into business logic, and a change to a native module does not force UI edits.

### The default structure

```text
app/                    # Expo Router file-based routes
components/
  ui/                   # Primitives: Button, Input, Card
  shared/               # Cross-domain composites
  screens/              # Screen composition sections
  <domain>/             # Domain-owned components
hooks/
  <domain>/
  native/               # Platform-specific hooks
services/
  <domain>/
store/
  <domain>/
constants/
  <domain>/
types/
  <domain>/
lib/
  <concern>/
assets/
  images/
  fonts/
plugins/                # Expo config plugins
```

### Layer responsibilities

| Layer | Owns | Does not own |
|-------|------|-------------|
| `app/` | Routes, layouts, route-level composition | Business logic, reusable UI |
| `components/` | All UI components by category | Data fetching, state management |
| `hooks/` | Stateful logic, side effects | Direct API calls (delegate to services) |
| `services/` | External communication, API clients | UI rendering, state storage |
| `store/` | Client state that spans components | API calls, UI rendering |
| `lib/` | Pure helpers, formatters, parsers | Side effects, state |

### Domain folders inside layers

Every layer except `app/` and `assets/` uses domain subfolders when files accumulate:

```text
hooks/
  auth/
    use-auth.hook.ts
    use-session.hook.ts
  profile/
    use-profile.hook.ts
  native/
    use-permissions.hook.ts
    use-app-state.hook.ts
```

### When a file does not belong to a domain

Place it in a general-purpose subfolder that names the concern:

- `lib/dates/format-date.lib.ts`
- `lib/analytics/track-event.lib.ts`
- `constants/app/app.constants.ts`

### Decision flow

1. What kind of thing is this file? (component, hook, service, type, constant, helper)
2. Which domain owns it? (auth, profile, orders, app-wide)
3. Is it route-local, domain-local, shared, or global?
4. Place it in the narrowest valid scope.

If a file could live in two layers, pick the one that matches its **primary responsibility**. A function that fetches data is a service, even if a hook calls it.
