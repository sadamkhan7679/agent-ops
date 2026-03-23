---
name: expo-best-practices
description: Production-grade Expo and React Native best practices covering performance, navigation, state management, native APIs, platform-specific code, OTA updates, testing, and accessibility
version: 1.0.0
type: skill
tags: [expo, react-native, typescript, performance, mobile, best-practices]
category: Mobile
author: agent-skills
---

# Expo Best Practices

Comprehensive best practices for building production Expo and React Native applications with TypeScript, Expo SDK 52+, and React Navigation.

## When to Apply

Reference these guidelines when:
- Writing new React Native components or screens
- Implementing navigation patterns
- Optimizing FlatList and list performance
- Managing offline state and AsyncStorage
- Handling platform-specific code (iOS/Android)
- Working with native APIs and permissions
- Setting up OTA updates with EAS Update

## Guide Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Performance Optimization | CRITICAL | `performance-` |
| 2 | Navigation Patterns | HIGH | `navigation-` |
| 3 | State Management | HIGH | `state-` |
| 4 | Custom Hooks for Native | MEDIUM-HIGH | `hooks-` |
| 5 | Platform-Specific Code | MEDIUM | `platform-` |
| 6 | Error Handling & Resilience | MEDIUM | `error-` |
| 7 | OTA Updates | MEDIUM | `ota-` |
| 8 | Testing | LOW-MEDIUM | `testing-` |
| 9 | Accessibility | LOW-MEDIUM | `a11y-` |

## Quick Reference

### 1. Performance Optimization (CRITICAL)
- `performance-list-optimization` - FlatList/FlashList tuning for smooth 60fps scrolling
- `performance-image-handling` - Image caching, placeholders, and blurhash with expo-image
- `performance-memory-management` - Preventing memory leaks, cleanup patterns
- `performance-animation-bridge` - UI thread animations with Reanimated, avoiding bridge overhead

### 2. Navigation Patterns (HIGH)
- `navigation-stack-patterns` - Native stack vs JS stack, screen options, gestures
- `navigation-deep-linking` - Universal links, URL schemes, Expo Router linking
- `navigation-tab-optimization` - Lazy tabs, unmountOnBlur, preloading strategies

### 3. State Management (HIGH)
- `state-async-storage` - AsyncStorage patterns and MMKV as fast alternative
- `state-context-patterns` - Context splitting for mobile performance
- `state-offline-first` - Offline-first architecture with optimistic updates

### 4. Custom Hooks for Native (MEDIUM-HIGH)
- `hooks-native-apis` - Camera, location, notifications hooks with cleanup
- `hooks-permissions` - Permission request patterns with rationale dialogs
- `hooks-app-lifecycle` - AppState changes, background/foreground detection

### 5. Platform-Specific Code (MEDIUM)
- `platform-specific-code` - Platform.select, Platform.OS, and .ios.tsx/.android.tsx files
- `platform-safe-areas` - SafeAreaView and useSafeAreaInsets patterns
- `platform-gestures` - Gesture handler patterns for iOS/Android differences

### 6. Error Handling & Resilience (MEDIUM)
- `error-crash-reporting` - Sentry integration, error tracking, breadcrumbs
- `error-network-resilience` - Retry logic, timeout handling, offline detection
- `error-boundaries-native` - Error boundaries adapted for React Native screens

### 7. OTA Updates (MEDIUM)
- `ota-updates-expo` - EAS Update setup, rollback strategies, update channels
- `ota-versioning` - Runtime versioning, native compatibility checks

### 8. Testing (LOW-MEDIUM)
- `testing-detox-patterns` - E2E testing with Detox for iOS/Android
- `testing-component-native` - React Native Testing Library patterns

### 9. Accessibility (LOW-MEDIUM)
- `a11y-screen-readers` - VoiceOver/TalkBack support, accessibilityLabel/Role/Hint
- `a11y-touch-targets` - Minimum 44x44 touch targets, hitSlop patterns
- `a11y-dynamic-type` - Dynamic type support, scaled fonts, layout adaptation

## How to Use

Read individual guide files for detailed explanations and code examples:

```
guides/performance-list-optimization.md
guides/navigation-stack-patterns.md
```

Each guide file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all content expanded: `AGENTS.md`
