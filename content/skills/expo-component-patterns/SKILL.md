---
name: expo-component-patterns
description: Advanced React Native component patterns with TypeScript including compound components, headless components, HOCs, polymorphic pressables, animated patterns, and platform-adaptive components
version: 1.0.0
type: skill
tags: [expo, react-native, typescript, patterns, components, architecture]
category: Mobile
author: agent-skills
---

# Expo Component Patterns

A comprehensive guide to advanced React Native component patterns using TypeScript, Expo SDK 52+, and React Native 0.76+. Each pattern includes production-ready code examples with full type safety.

## When to Apply

Reference these patterns when:
- Building reusable React Native component libraries
- Creating compound components (bottom sheets, action menus)
- Implementing headless/renderless patterns for native
- Building platform-adaptive components
- Working with Reanimated animated components
- Implementing imperative handles for scroll/focus

## Pattern Categories

| Priority | Category | Complexity | Prefix |
|----------|----------|------------|--------|
| 1 | Compound Components | MEDIUM | `compound-` |
| 2 | Headless/Renderless | LOW-MEDIUM | `headless-` |
| 3 | Higher-Order Components | MEDIUM | `hoc-` |
| 4 | Polymorphic Components | HIGH | `polymorphic-` |
| 5 | Controlled/Uncontrolled | MEDIUM | `controlled-` |
| 6 | Ref & Imperative Handle | MEDIUM | `ref-` |
| 7 | Slot Pattern | LOW | `slot-` |
| 8 | Provider Pattern | MEDIUM | `provider-` |
| 9 | Animated Patterns | HIGH | `animated-` |
| 10 | Platform-Adaptive | MEDIUM | `platform-` |

## Quick Reference

### 1. Compound Components (MEDIUM)
- `compound-bottom-sheet` - Bottom sheet with compound API using @gorhom/bottom-sheet
- `compound-action-menu` - Context-driven action menu with shared state
- `compound-form-group` - Form group with shared validation context

### 2. Headless/Renderless (LOW-MEDIUM)
- `headless-list` - Headless list controller for pagination, refresh, empty state
- `headless-swipeable` - Swipeable row with render callback

### 3. Higher-Order Components (MEDIUM)
- `hoc-auth-gate` - Authentication gate wrapping screens
- `hoc-keyboard-aware` - KeyboardAvoidingView + scroll behavior wrapper

### 4. Polymorphic Components (HIGH)
- `polymorphic-pressable` - Pressable that renders as TouchableOpacity or Link
- `polymorphic-text` - Text with variant-based typography

### 5. Controlled/Uncontrolled (MEDIUM)
- `controlled-input` - Native TextInput with dual-mode state
- `controlled-toggle` - Switch with controllable state

### 6. Ref & Imperative Handle (MEDIUM)
- `ref-imperative-scroll` - ScrollView with imperative scrollTo
- `ref-native-handle` - Custom input with focus/blur handle

### 7. Slot Pattern (LOW)
- `slot-card-native` - Card with native slots (header, media, footer)
- `slot-screen-layout` - Screen layout with header, content, footer, FAB slots

### 8. Provider Pattern (MEDIUM)
- `provider-theme` - Theme provider with system preference detection
- `provider-toast` - Toast notification provider with queue

### 9. Animated Patterns (HIGH)
- `animated-shared-element` - Shared element transitions with Reanimated
- `animated-layout-transition` - Layout animations with entering/exiting

### 10. Platform-Adaptive (MEDIUM)
- `platform-adaptive-component` - iOS/Android adaptive rendering
- `platform-responsive-grid` - Responsive grid using useWindowDimensions

## How to Use

Read individual guide files for detailed pattern explanations and code:

```
guides/compound-bottom-sheet.md
guides/animated-shared-element.md
```

## Full Compiled Document

For the complete guide with all patterns expanded: `AGENTS.md`
