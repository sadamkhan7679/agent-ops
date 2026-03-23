# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The prefix (in parentheses) is the filename prefix used to group guides.

---

## 1. Performance Optimization (performance)

**Impact:** CRITICAL
**Description:** Mobile performance directly affects user retention. Janky scrolling, slow images, and memory leaks are the top causes of poor app reviews.

## 2. Navigation Patterns (navigation)

**Impact:** HIGH
**Description:** Navigation architecture defines the user experience. Proper stack management, deep linking, and tab optimization prevent crashes and improve perceived speed.

## 3. State Management (state)

**Impact:** HIGH
**Description:** Mobile apps need offline-capable, fast state management. AsyncStorage is slow — MMKV and proper context splitting are essential for responsive UIs.

## 4. Custom Hooks for Native (hooks)

**Impact:** MEDIUM-HIGH
**Description:** Native APIs (camera, location, permissions) require careful lifecycle management to prevent leaks and handle permission states correctly.

## 5. Platform-Specific Code (platform)

**Impact:** MEDIUM
**Description:** iOS and Android differ in safe areas, gestures, and UI conventions. Platform-aware code delivers a native-feeling experience on both.

## 6. Error Handling & Resilience (error)

**Impact:** MEDIUM
**Description:** Mobile apps face unique challenges: flaky networks, background kills, and native crashes. Resilient error handling prevents data loss and user frustration.

## 7. OTA Updates (ota)

**Impact:** MEDIUM
**Description:** Over-the-air updates allow shipping fixes without app store review. Proper versioning and rollback strategies prevent bricking user devices.

## 8. Testing (testing)

**Impact:** LOW-MEDIUM
**Description:** Mobile testing requires device-specific E2E testing and native-aware component tests to catch platform-specific regressions.

## 9. Accessibility (a11y)

**Impact:** LOW-MEDIUM
**Description:** Mobile accessibility requires screen reader support, proper touch targets, and dynamic type handling for visually impaired users.
