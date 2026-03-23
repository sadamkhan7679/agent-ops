# Sections

This file defines all sections, their ordering, and descriptions.
The prefix (in parentheses) is the filename prefix used to group guides.

---

## 1. Architecture Principles (architecture)

**Description:** Core architectural decisions for Expo apps: layer-first organization with domain folders, feature boundaries, and why mobile needs stricter boundaries than web.

## 2. App Directory & Routing (app-directory)

**Description:** Expo Router file-based routing conventions, route groups, dynamic routes, layouts for Stack/Tabs/Drawer navigators.

## 3. Components Organization (components)

**Description:** Where components live: ui/ for primitives, shared/ for cross-domain, screens/ for section extraction, domain/ for domain-owned.

## 4. Hooks Organization (hooks)

**Description:** Domain hooks and native API hooks. When to extract, where to place.

## 5. Services Layer (services)

**Description:** API clients, storage abstractions, and integration logic that should not live in components.

## 6. State Management (store)

**Description:** When to use global vs local state, offline sync patterns, Zustand vs Context decisions.

## 7. Navigation Patterns (navigation)

**Description:** File-based routing conventions and type-safe navigation with Expo Router.

## 8. Naming Conventions (naming)

**Description:** File naming with kebab-case and responsibility suffixes (.screen.tsx, .hook.ts, .service.ts).

## 9. Splitting Guidelines (splitting)

**Description:** When and how to split screens and components by responsibility.

## 10. Native Modules & Config (native-modules)

**Description:** Expo config plugins, native module wrappers, and where they live in the project.
