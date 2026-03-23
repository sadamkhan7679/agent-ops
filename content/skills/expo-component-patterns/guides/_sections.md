# Sections

This file defines all sections, their ordering, complexity levels, and descriptions.
The prefix (in parentheses) is the filename prefix used to group patterns.

---

## 1. Compound Components (compound)

**Complexity:** MEDIUM
**Description:** Compound components share implicit state through React Context, enabling flexible native UI composition like bottom sheets and action menus.

## 2. Headless/Renderless (headless)

**Complexity:** LOW-MEDIUM
**Description:** Headless components manage logic (pagination, swipe actions) while letting consumers control rendering — essential for custom native UIs.

## 3. Higher-Order Components (hoc)

**Complexity:** MEDIUM
**Description:** HOCs wrap screens or components to inject cross-cutting behavior like auth gates and keyboard handling.

## 4. Polymorphic Components (polymorphic)

**Complexity:** HIGH
**Description:** Polymorphic components let consumers choose the underlying native element while maintaining full type safety.

## 5. Controlled/Uncontrolled (controlled)

**Complexity:** MEDIUM
**Description:** Components that work in both controlled and uncontrolled modes, essential for form inputs and toggles in React Native.

## 6. Ref & Imperative Handle (ref)

**Complexity:** MEDIUM
**Description:** Expose imperative methods (scroll, focus, blur) from custom components using useImperativeHandle.

## 7. Slot Pattern (slot)

**Complexity:** LOW
**Description:** Slots give consumers control over which visual sections to customize in cards, layouts, and screens.

## 8. Provider Pattern (provider)

**Complexity:** MEDIUM
**Description:** Providers manage app-wide concerns like theming and notifications with context-based dependency injection.

## 9. Animated Patterns (animated)

**Complexity:** HIGH
**Description:** Reanimated-powered patterns for shared element transitions and layout animations running on the UI thread.

## 10. Platform-Adaptive (platform)

**Complexity:** MEDIUM
**Description:** Components that render differently on iOS and Android to match platform conventions while sharing logic.
