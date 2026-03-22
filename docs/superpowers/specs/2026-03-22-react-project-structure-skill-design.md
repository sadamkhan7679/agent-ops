# React Project Structure Skill Design

## Summary

Create a new skill named `react-project-structure` for React + Next.js + TypeScript codebases. The skill defines one recommended frontend project structure, clear rules for splitting components and files, naming conventions, and essential implementation quality practices such as validation, loading states, user feedback, and graceful error handling.

## Goals

- Create a reusable skill for organizing modern React + Next.js + TypeScript applications.
- Define one default structure rather than offering many competing patterns.
- Explain how to split route files, view components, shared components, hooks, services, store modules, constants, schema, actions, lib helpers, types, and data files.
- Include naming conventions for files and folders.
- Include operational frontend best practices that should accompany structure decisions.

## Non-Goals

- Cover every frontend framework.
- Support multiple architecture styles equally.
- Act as a generic React best-practices replacement.
- Provide backend architecture guidance.

## Skill Identity

- **Slug**: `react-project-structure`
- **Name**: `React Project Structure`
- **Category**: `React`
- **Audience**: developers working in React + Next.js + TypeScript repositories
- **Tone**: opinionated, direct, practical

## Triggering Intent

The skill should trigger when the user asks about:

- structuring a React or Next.js app
- organizing frontend folders
- splitting large page or component files
- deciding where code belongs across `components`, `hooks`, `services`, `store`, `lib`, `constants`, `types`, `data`, `schema`, or `actions`
- refactoring a messy frontend architecture
- setting naming conventions for frontend code
- standardizing a team-wide React folder structure

The description should push slightly toward under-triggered cases such as:

- "where should this hook live?"
- "this page is too big"
- "how do I organize services and state?"
- "how should we structure a Next.js frontend?"

## Recommended Architecture

The skill should prescribe a **layer-first structure with shared foundations and domain folders inside each layer**.

### Recommended top-level structure

```text
app/
components/
  ui/
  shared/
  views/
  <domain>/
hooks/
  <domain>/
services/
  <domain>/
store/
  <domain>/
constants/
  <domain>/
types/
  <domain>/
data/
  <domain>/
schema/
  <domain>/
actions/
  <domain>/
lib/
  <concern>/
```

### Ownership rules

- `app/` is for route composition, layout boundaries, metadata, and route-level data orchestration.
- `components/ui/` is for reusable low-level primitives.
- `components/shared/` is for reusable cross-domain composites.
- `components/views/` is for page sections and route composition helpers.
- domain folders inside each top-level layer are the default for product code.
- `hooks/` uses domain subfolders by default, with root-level shared hooks only when truly cross-domain.
- `services/` uses domain subfolders for external communication and integration logic.
- `store/` uses domain subfolders, with app-level state only when truly global.
- `constants/` uses domain subfolders, with `constants/app/` for app-wide constants.
- `types/` uses domain subfolders, with shared top-level types only when truly cross-domain.
- `data/` uses domain subfolders for structured content or static domain data.
- `schema/` is for validation schemas and form contracts.
- `actions/` is for user-triggered mutations, server actions, and action orchestration.
- `lib/` is for pure helpers, adapters, parsers, formatters, and utility logic that should not become a junk drawer.

## Splitting Rules

This should be the core of the skill.

### Route and page rules

- Keep files under `app/` lean.
- Route files should compose sections, not hold dense rendering logic.
- If a route contains multiple sections, move those sections into `components/views/` or a domain folder inside `components/`.
- If route-specific data shaping becomes complex, extract it into `lib/`, `services/`, `actions/`, or another appropriate layer.

### Component rules

- A component should have one clear rendering responsibility.
- Split components when they contain multiple visual regions with separate responsibilities.
- Keep low-level primitives in `components/ui/`.
- Keep reusable cross-domain composites in `components/shared/`.
- Keep page or route section components in `components/views/`.
- Keep domain-specific components inside `components/<domain>/`.

### Hook rules

- Extract a hook when stateful logic is reused or obscures the component.
- Keep domain-specific hooks in `hooks/<domain>/`.
- Promote to top-level shared hooks only when the hook is reused across domains.

### Service rules

- If logic talks to an API, browser storage, analytics, or another external system, it should usually live in a service or adapter.
- Keep domain-specific services in `services/<domain>/`.
- Promote to shared app-wide services only when multiple domains depend on the same integration.

### State rules

- Prefer local state first.
- Use domain-level state before global state.
- Put only durable cross-app client state in `store/app/` or another clearly global module.
- Do not create global store slices for one page or one isolated concern.

### Constant, type, data, schema, and action rules

- Keep files in the relevant top-level layer under the owning domain.
- Promote them only when there are multiple real consumers.
- Avoid generic dumping grounds.

## Naming Conventions

The skill should define explicit naming patterns.

### Files

- components: `my-component.tsx`
- hooks: `use-something.hook.ts`
- store modules: `user.store.ts`
- types: `user.types.ts`
- lib helpers: `markdown.lib.ts`
- constants: `app.constants.ts`
- static data: `blog.data.ts`
- schemas: `contact-form.schema.ts`
- actions: `publish-agent.action.ts`
- view components: `acme.view.tsx`
- shared loaders or cross-domain helpers: `loader.shared.ts`

### Folder conventions

- layer folders are top-level: `components`, `hooks`, `services`, `store`, `constants`, `types`, `data`, `schema`, `actions`, `lib`
- most layer folders should use a domain folder one level deeper: `components/agents`, `hooks/agents`, `services/blog`
- `components/ui`, `components/shared`, and `components/views` are special-purpose shared sublayers
- avoid deep nesting unless it reflects clear ownership

### General rules

- prefer kebab-case for file names
- use suffix-based naming to reveal responsibility
- avoid generic names like `utils.ts`, `helpers.ts`, `misc.ts`, or `common.ts`

## Operational Frontend Best Practices

The skill should include a section that ties structure to shipping quality.

### Forms

- add proper validation for user input
- colocate validation schemas with the owning domain unless reused broadly
- ensure field-level and form-level feedback are both handled

### User feedback

- show success, warning, and error feedback for user-triggered actions
- do not leave async actions silent
- prefer explicit empty states over blank screens

### Loading states

- use loading states or skeletons for async UI
- keep loading UI aligned with the final layout
- avoid spinner-only experiences when skeletons communicate structure better

### Error handling

- handle recoverable UI errors explicitly
- show actionable error states
- use error boundaries where crashes should be isolated
- prefer graceful failure over route-wide collapse when possible

### Crash resilience

- define boundaries for route-level and widget-level failure
- provide fallback UI and retry paths where practical

### Accessibility and UX guardrails

- loading, validation, and error states should remain accessible
- disabled, pending, and invalid states must be visually and semantically clear

## Examples

The skill should include:

### Example 1: Lean route composition

- before: oversized `app/page.tsx`
- after: route composed from `components/views/*`

### Example 2: Domain folders across layers

```text
components/agents/
hooks/agents/
services/agents/
types/agents/
schema/agents/
actions/agents/
```

### Example 3: Shared vs domain-owned code

- when code belongs in `components/shared/`
- when it should stay under `components/<domain>/`

### Example 4: Naming examples

- `user.types.ts`
- `user.store.ts`
- `markdown.lib.ts`
- `use-auth.hook.ts`
- `app.constants.ts`
- `blog.data.ts`
- `marketing-hero.view.tsx`
- `publish-agent.action.ts`
- `contact-form.schema.ts`

## Anti-Patterns

The skill should explicitly reject:

- giant route files with mixed data, rendering, and interactions
- one giant `components/` folder with no ownership model
- one giant flat `hooks/` or `services/` folder with unrelated domains mixed together
- top-level `utils.ts` or `helpers.ts` junk drawers
- promoting domain code to shared too early
- global store for isolated local concerns
- deeply nested trees without a clear ownership reason
- splitting components too early into tiny fragments with no readability gain

## Deliverable Behavior

When the skill is used, it should:

1. inspect the current structure
2. identify where boundaries are unclear
3. propose the recommended target structure
4. decide what stays route-local, domain-local, shared, or app-global
5. apply naming conventions consistently
6. include missing operational concerns such as validation, loading states, feedback, and error handling in the refactor plan

## Suggested Skill Shape

The new skill should likely contain:

- frontmatter with strong trigger-oriented description
- overview of the architecture
- recommended folder tree
- decision rules for file placement
- naming conventions
- frontend best practices section
- examples
- anti-patterns

## Required Depth

The skill must be fully detailed rather than a short checklist. It should read like an operating manual for structuring React + Next.js + TypeScript applications.

### Minimum detail expectations

- explain not only **what** folder to use, but **why**
- define **when to use what** for each major layer
- include concrete placement rules for common frontend artifacts
- include examples for both small and growing codebases
- include "keep local vs promote shared" guidance
- include refactor heuristics for oversized pages and components
- include anti-patterns and the reason they fail at scale

### Recommended section depth

The skill should include dedicated sections for:

1. **When to Use**
2. **Core Architecture**
3. **Recommended Folder Tree**
4. **Placement Rules by Artifact Type**
5. **Component Splitting Rules**
6. **Naming Conventions**
7. **Forms, Feedback, Loading, and Error Handling**
8. **Examples**
9. **Anti-Patterns**
10. **Decision Checklist**

## Placement Rules By Artifact Type

The skill should explicitly answer where each of these belongs and when:

- route files
- layouts
- page sections
- reusable UI primitives
- shared composite components
- domain-specific components
- view components
- domain hooks
- shared hooks
- domain services
- app-wide services
- global store
- domain state
- types
- constants
- static data
- parsing and formatting helpers
- API clients
- validation schemas
- server actions or route-facing action helpers
- loading skeletons
- error fallback components
- empty states
- analytics helpers

The skill should make it easy for a developer to answer:

> "I have this file. Where should it live?"

## Decision Guidance

The skill should include practical decision frameworks such as:

### Keep local first

- keep code next to its only consumer
- move to a domain folder inside the appropriate layer when multiple files in one domain use it
- promote to shared/global only after repeated real use or clear architectural need

### Split by responsibility, not by size alone

- split when one file holds multiple responsibilities
- do not create tiny files that reduce readability without improving boundaries
- route files should compose
- view files should render sections
- hooks should own reusable stateful logic
- services should own external communication

### Shared promotion rule

The skill should define that code should not move to shared simply because it "might" be reused. Shared code should represent:

- real reuse across multiple domains
- app-wide platform concerns
- stable primitives with clear interfaces

## Required Examples

The skill should include multiple detailed examples, not just one folder tree.

### Example set

1. **Small route composition**
   - before: single large `app/page.tsx`
   - after: route composed from `components/views/*`

2. **Layer-first domain grouping**
   - show a realistic `components/agents`, `hooks/agents`, `services/agents`, `types/agents`, `schema/agents`, `actions/agents` structure
   - explain why each file belongs there

3. **Shared vs domain-specific**
   - compare a domain-owned card, a shared card wrapper, and a view section

4. **Form handling**
   - show where schema, submit action, feedback state, and loading UI should live

5. **Error and loading states**
   - show where skeletons, fallbacks, and boundaries belong

6. **Naming convention examples**
   - `user.types.ts`
   - `user.store.ts`
   - `markdown.lib.ts`
   - `use-auth.hook.ts`
   - `app.constants.ts`
   - `blog.data.ts`
   - `agents.view.tsx`
   - `loader.shared.ts`
   - `publish-agent.action.ts`
   - `contact-form.schema.ts`

### Example style

Examples should include:

- file tree
- short explanation
- reason for each placement decision

## Guidelines And Best Practices

The skill should have a dedicated guidance section that goes beyond folders.

### Forms and validation

- colocate form schema with the owning domain unless genuinely reused
- provide field-level validation messaging
- provide submit-level failure messaging
- disable or guard double-submit states

### User feedback

- show pending, success, and failure feedback for user actions
- use explicit empty states
- avoid silent operations

### Loading and skeletons

- prefer skeletons when structure matters
- keep skeletons near the view they represent
- keep loading components consistent with the final layout

### Error handling and graceful crash

- use local fallback UI for recoverable failures
- add error boundaries for crash isolation where needed
- avoid collapsing the entire route when one widget fails if isolation is possible
- include retry affordances where reasonable

### Accessibility

- loading, invalid, and error states must remain accessible
- feedback should be perceivable and semantically represented

## Decision Checklist

The skill should end with a concise checklist a model can apply during refactors:

1. Is this file route-local, domain-local, shared, or app-global?
2. Is this component doing more than one job?
3. Should this logic become a hook, service, action, schema, or helper?
4. Is this code reused enough to justify promotion?
5. Are validation, loading, feedback, and error states covered?
6. Is the file name revealing responsibility clearly?

## Testing Direction

After drafting the skill, evaluate it with prompts such as:

- "My Next.js page is 400 lines. Split it using a sane folder structure."
- "Where should API clients, shared hooks, constants, schemas, and view components live in a React app?"
- "Refactor this messy React codebase into a consistent project structure."

## Open Follow-Up

- later, this can be expanded into a framework family skill with variants for Vite, Remix, and React Native, but that is explicitly out of scope for the first version
