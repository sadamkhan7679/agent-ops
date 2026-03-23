# Expo Best Practices

A structured skill for creating and maintaining Expo/React Native best practices optimized for agents and LLMs.

## Structure

- `guides/` - Individual guide files (one per topic)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `prefix-description.md` - Individual guide files
- `SKILL.md` - Skill definition with overview and quick reference
- `AGENTS.md` - Compiled complete guide (generated)

## Guide File Structure

Each guide file follows this structure:

```markdown
---
title: Guide Title Here
impact: MEDIUM
tags: tag1, tag2, tag3
---

## Guide Title Here

Brief explanation of why it matters.

**Incorrect (description):**

\`\`\`tsx
// Bad code example
\`\`\`

**Correct (description):**

\`\`\`tsx
// Good code example
\`\`\`
```

## File Naming Convention

- Files starting with `_` are special (metadata)
- Guide files: `area-description.md` (e.g., `performance-list-optimization.md`)
- Section is inferred from filename prefix

## Impact Levels

- `CRITICAL` - Highest priority, major performance gains
- `HIGH` - Significant improvements
- `MEDIUM-HIGH` - Moderate-high gains
- `MEDIUM` - Moderate improvements
- `LOW-MEDIUM` - Incremental improvements

## Technologies Covered

- Expo SDK 52+
- React Native 0.76+
- React 19 + TypeScript 5.x
- Expo Router v4
- React Navigation 7
- Reanimated 3
- expo-image, MMKV, react-native-gesture-handler
