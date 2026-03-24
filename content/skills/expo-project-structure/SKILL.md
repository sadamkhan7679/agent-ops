---
name: expo-project-structure
description: Opinionated Expo + React Native + TypeScript project structure and screen-splitting guidance. Use this whenever the user asks how to organize a mobile codebase, where files should live, how to split large screens or components, how to structure components, hooks, services, store, constants, types, or navigation, or when an Expo app feels messy and needs a consistent architecture.
version: 1.0.0
type: skill
tags: [expo, react-native, typescript, architecture, folder-structure, mobile]
category: Mobile
author: agent-skills
---

# Expo Project Structure

Use this skill for **Expo + React Native + TypeScript** codebases when the real problem is structure, ownership, and boundaries.

This skill defines:

- where code should live in an Expo app
- when to keep code local vs promote it to shared
- how to split large screens and components
- how to name files consistently
- how Expo Router file-based routing affects architecture
- how native modules and config plugins fit into the structure

The default architecture is:

- **layer-first**
- with a **shared foundation**
- and **domain folders inside each layer**

If the repo already has clear, good conventions, preserve them unless they are directly causing problems.

## When to Use

Use this skill when the user asks any variation of:

- "How should I organize this Expo/React Native app?"
- "This screen is too large."
- "Where should this hook/service/store/types file live?"
- "How should we structure navigation?"
- "How do I make this mobile architecture scalable?"
- "Can you refactor this messy mobile folder structure?"

Use it even if the user does not explicitly ask for "folder structure," but the actual problem is architectural sprawl.

## Guide Categories

| Priority | Category | Prefix |
|----------|----------|--------|
| 1 | Architecture Principles | `architecture-` |
| 2 | App Directory & Routing | `app-directory-` |
| 3 | Components Organization | `components-` |
| 4 | Hooks Organization | `hooks-` |
| 5 | Services Layer | `services-` |
| 6 | State Management | `store-` |
| 7 | Navigation Patterns | `navigation-` |
| 8 | Naming Conventions | `naming-` |
| 9 | Splitting Guidelines | `splitting-` |
| 10 | Native Modules & Config | `native-modules-` |

## Recommended Structure

```text
app/                    # Expo Router file-based routes
  (tabs)/               # Tab group layout
    _layout.tsx
    index.tsx
    profile.tsx
  (auth)/               # Auth flow group
    _layout.tsx
    login.tsx
    register.tsx
  (modals)/             # Modal presentation group
    _layout.tsx
    confirm.tsx
  _layout.tsx           # Root layout
  +not-found.tsx        # 404 screen
components/
  ui/                   # Primitives (Button, Input, Card)
  shared/               # Cross-domain composites
  screens/              # Screen composition sections
  <domain>/             # Domain-owned components
hooks/
  <domain>/
  native/               # Platform-specific hooks
services/
  <domain>/
  app/                  # Shared services (API client, analytics)
store/
  <domain>/
  app/                  # App-wide state
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

## Quick Reference

- **architecture-layer-first** — Organize by responsibility first, domain second, adapted for mobile constraints.
- **architecture-feature-boundaries** — When to use feature folders vs layer-first in React Native apps.
- **app-directory-expo-router** — Expo Router file-based routing: `app/` directory conventions, groups, dynamic routes.
- **app-directory-layouts** — Layout patterns with `_layout.tsx` for Stack, Tabs, and Drawer navigators.
- **components-ui-primitives** — Native UI primitives: Button wrapping Pressable, themed Text, Card with shadows.
- **components-shared** — Cross-domain composites: EmptyState, LoadingOverlay, ErrorFallback.
- **components-domain** — Domain-owned components under `components/<domain>/`.
- **components-screens** — Screen section extraction to keep route files lean.
- **hooks-domain** — Domain hooks: `hooks/auth/use-auth.hook.ts`, `hooks/profile/use-profile.hook.ts`.
- **hooks-native** — Native hooks: `hooks/native/use-permissions.hook.ts`, `hooks/native/use-app-state.hook.ts`.
- **services-api** — API services with typed clients and response transformations.
- **services-storage** — Storage services abstracting MMKV, AsyncStorage, and SecureStore.
- **store-global-vs-local** — When to use Zustand/Jotai vs Context vs local state in React Native.
- **store-offline-sync** — Offline sync store patterns with persisted Zustand and mutation queues.
- **navigation-file-based** — File-based routing conventions with Expo Router groups and deep links.
- **navigation-type-safe** — Type-safe navigation with typed route params and link helpers.
- **naming-conventions** — kebab-case files with responsibility suffixes for mobile projects.
- **naming-suffixes** — Complete suffix reference: `.screen.tsx`, `.hook.ts`, `.service.ts`, `.store.ts`, `.types.ts`.
- **splitting-screens** — When and how to break apart large screen files.
- **splitting-components** — When and how to decompose components in React Native.
- **native-modules-config** — Where Expo config plugins live and `app.config.ts` conventions.
- **native-modules-plugins** — How to organize wrappers around native modules and Expo packages.

## Full Compiled Document

For the complete guide with all content expanded: [AGENTS.md](AGENTS)
