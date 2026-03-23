# Expo Component Patterns

A structured skill for advanced React Native component patterns optimized for agents and LLMs.

## Structure

- `guides/` - Individual pattern files (one per pattern)
  - `_sections.md` - Section metadata (titles, complexity, descriptions)
  - `prefix-description.md` - Individual pattern files
- `SKILL.md` - Skill definition with overview and quick reference
- `AGENTS.md` - Compiled complete guide (generated)

## Guide File Structure

Each pattern file follows this structure:

```markdown
---
title: Pattern Title Here
impact: MEDIUM
tags: tag1, tag2, tag3
---

## Pattern Title Here

Brief explanation of the pattern and when to use it.

### Implementation

\`\`\`tsx
// Full production-ready code
\`\`\`

### Usage

\`\`\`tsx
// Usage example
\`\`\`
```

## File Naming Convention

- Files starting with `_` are special (metadata)
- Pattern files: `category-description.md` (e.g., `compound-bottom-sheet.md`)
- Section is inferred from filename prefix

## Technologies Covered

- Expo SDK 52+, React Native 0.76+, React 19, TypeScript 5.x
- @gorhom/bottom-sheet, react-native-gesture-handler
- Reanimated 3, expo-router
