# Expo Project Structure Skill

Opinionated Expo + React Native + TypeScript project structure and screen-splitting guidance.

## What This Skill Covers

This skill provides a comprehensive guide for organizing Expo/React Native codebases using a layer-first architecture with domain folders. It covers:

- **Architecture** — Layer-first organization with feature boundary guidelines
- **Expo Router** — File-based routing conventions, layouts, and navigation patterns
- **Components** — UI primitives, shared composites, domain components, and screen sections
- **Hooks** — Domain hooks and native platform hooks
- **Services** — API clients and storage abstractions (MMKV, SecureStore)
- **State Management** — Zustand stores, offline sync, and state placement rules
- **Navigation** — Type-safe routing with Expo Router
- **Naming** — kebab-case conventions with responsibility suffixes
- **Splitting** — When and how to decompose screens and components
- **Native Modules** — Config plugins and native module wrappers

## Target Stack

- Expo SDK 52+
- Expo Router v4
- React Native 0.76+
- TypeScript 5.x
- Zustand for client state
- TanStack Query for server state
- MMKV for fast storage
- Expo SecureStore for sensitive data

## File Structure

```
expo-project-structure/
  SKILL.md          — Frontmatter, overview, and quick reference table
  README.md         — This file: usage guide and contribution guidelines
  AGENTS.md         — Full compiled guide with all content expanded (700+ lines)
  guides/
    _sections.md    — Section metadata (titles, impacts, descriptions)
    22 guide files  — Individual guides organized by category
```

## Usage

### As an AI Coding Agent Skill

Reference this skill when users ask about Expo/React Native project organization. The `SKILL.md` provides a quick overview and the `AGENTS.md` has the full compiled content.

### As a Team Reference

Share the `AGENTS.md` file as a standalone architecture document for your team. It contains all guides expanded with examples and placement rules.

## Guide Categories

| Priority | Category | File prefix | Guides |
|----------|----------|-------------|--------|
| 1 | Architecture | `architecture-` | layer-first, feature-boundaries |
| 2 | App Directory | `app-directory-` | expo-router, layouts |
| 3 | Components | `components-` | ui-primitives, shared, domain, screens |
| 4 | Hooks | `hooks-` | domain, native |
| 5 | Services | `services-` | api, storage |
| 6 | State | `store-` | global-vs-local, offline-sync |
| 7 | Navigation | `navigation-` | file-based, type-safe |
| 8 | Naming | `naming-` | conventions, suffixes |
| 9 | Splitting | `splitting-` | screens, components |
| 10 | Native | `native-modules-` | config, plugins |

## Contributing

### Adding a new guide

1. Create a new `.md` file in `guides/` with the appropriate prefix.
2. Use the standard frontmatter format:

```markdown
---
title: Your Guide Title
tags: tag1, tag2
---

## Your Guide Title

Content here.
```

3. Add the guide to `guides/_sections.md` with its order number, impact level, and description.
4. Add a one-line entry to the Quick Reference section in `SKILL.md`.
5. Add the full content to `AGENTS.md` in the correct section order.

### Editing an existing guide

1. Edit the guide file in `guides/`.
2. Update the corresponding section in `AGENTS.md` to match.
3. Update the version in `SKILL.md` frontmatter if the change is significant.

### Style guidelines

- Use production-quality code examples with real types and patterns.
- Target Expo SDK 52+, Expo Router v4, React Native 0.76+.
- Prefer `pnpm` over `npm` or `npx` in any command examples.
- Use kebab-case for file names in examples.
- Keep individual guides between 50-100 lines.
- Include both structure trees and code examples.
