---
name: React Project Structure
description: Opinionated React + Next.js + TypeScript project structure and component-splitting guidance. Use this whenever the user asks how to organize a frontend codebase, where files should live, how to split large pages or components, how to structure components, hooks, services, store, constants, lib, types, data, schema, or actions, or when a Next.js app feels messy and needs a consistent architecture.
version: 1.0.0
type: skill
tags: [react, nextjs, typescript, architecture, folder-structure, components]
category: React
author: agent-skills
---

# React Project Structure

Use this skill for **React + Next.js + TypeScript** codebases when the real problem is structure, ownership, and boundaries.

This skill is not only about drawing a folder tree. It defines:

- where code should live
- when to keep code local vs promote it to shared
- how to split large routes and components
- how to name files consistently
- how to include validation, user feedback, loading states, skeletons, and graceful error handling as part of the structure

The default architecture is:

- **layer-first**
- with a **shared foundation**
- and **domain folders inside each layer**

If the repo already has clear, good conventions, preserve them unless they are directly causing problems.

## When To Use

Use this skill when the user asks any variation of:

- "How should I organize this React or Next.js app?"
- "This page/component is too large."
- "Where should this hook/service/store/types/constants/schema/action file live?"
- "How should we structure `components`, `hooks`, `services`, `store`, `lib`, or `actions`?"
- "How do I make this frontend architecture scalable?"
- "Can you refactor this messy frontend folder structure?"
- "What naming convention should we use for frontend files?"

Use it even if the user does not explicitly ask for "folder structure," but the actual problem is architectural sprawl.

## Core Principle

Organize by **responsibility first** and **domain second**.

The main questions are:

1. What kind of thing is this file?
2. Which domain owns it?
3. Is it route-local, domain-local, shared across domains, or app-global?
4. Is it UI, stateful logic, external communication, static data, validation, mutation orchestration, or pure utility logic?

The answer to those questions determines where the code lives.

## Recommended Structure

Use this as the default structure for React + Next.js + TypeScript projects:

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

### Why this structure

This structure avoids two failure modes:

1. one giant flat folder per layer, such as `components/` or `hooks/` with unrelated files mixed together
2. one giant `features/` bucket that becomes a second app root and hides technical responsibilities

Layer-first, domain-second keeps:

- technical responsibilities explicit
- domain ownership visible
- route files lean
- shared vs local boundaries easier to reason about

## Folder Responsibilities

### `app/`

Use `app/` for:

- routes
- layouts
- metadata
- route-level composition
- route-level loading and error boundaries
- route-level orchestration

Do not turn route files into giant mixed-responsibility files. Pages should compose. They should not become the home for most of the UI tree, reusable logic, or external communication.

### `components/ui/`

Use `components/ui/` for reusable low-level UI primitives:

- button
- input
- card shell
- dialog shell
- tabs
- badge
- separator

These should be domain-agnostic building blocks.

Examples:

- `button.tsx`
- `input.tsx`
- `tabs.tsx`

### `components/shared/`

Use `components/shared/` for reusable cross-domain composites:

- empty states used in multiple areas
- section wrappers
- shared loaders
- shared content chrome

These are more opinionated than `ui`, but still not owned by one domain.

Examples:

- `empty-state.shared.tsx`
- `loader.shared.tsx`
- `section-header.shared.tsx`

### `components/views/`

Use `components/views/` for route and page composition sections:

- homepage hero
- landing page stats block
- catalog intro section
- marketing CTA section

These exist to keep route files lean.

Examples:

- `home-hero.view.tsx`
- `pricing-grid.view.tsx`
- `agents-overview.view.tsx`

### `components/<domain>/`

Use `components/<domain>/` for domain-owned components.

Examples:

- `components/agents/agent-card.tsx`
- `components/blog/blog-grid.tsx`
- `components/account/account-form.tsx`

This should be the default place for non-primitive app components before promoting them to `shared`.

### `hooks/<domain>/`

Use `hooks/<domain>/` for domain-owned hooks.

Examples:

- `hooks/agents/use-agent-search.hook.ts`
- `hooks/blog/use-blog-filter.hook.ts`

If a hook is genuinely cross-domain, then move it to a shared root-level hook or a clearly shared concern.

### `services/<domain>/`

Use `services/<domain>/` for domain-owned external communication and integration logic.

Examples:

- `services/agents/agent.service.ts`
- `services/blog/blog.service.ts`

Use this for:

- API calls
- persistence adapters
- analytics calls tied to a domain
- integration logic that should not live in components

### `store/<domain>/`

Use `store/<domain>/` for domain-level client state that is broader than one component but not truly global.

Examples:

- `store/agents/agent.store.ts`
- `store/app/theme.store.ts`

Prefer local state first. Only move to `store/` when state has enough surface area to justify it.

### `constants/<domain>/`

Use `constants/<domain>/` for domain-owned constants.

Examples:

- `constants/app/app.constants.ts`
- `constants/agents/agent.constants.ts`

### `types/<domain>/`

Use `types/<domain>/` for domain-owned types.

Examples:

- `types/agents/agent.types.ts`
- `types/user/user.types.ts`

### `data/<domain>/`

Use `data/<domain>/` for structured static or semi-static domain data.

Examples:

- `data/blog/blog.data.ts`
- `data/app/app.data.ts`

### `schema/<domain>/`

Use `schema/<domain>/` for validation schemas and form contracts.

Examples:

- `schema/contact/contact-form.schema.ts`
- `schema/auth/login.schema.ts`

Keep validation close to the domain that owns it.

### `actions/<domain>/`

Use `actions/<domain>/` for user-triggered mutations, server actions, and action orchestration.

Examples:

- `actions/agents/publish-agent.action.ts`
- `actions/contact/submit-contact-form.action.ts`

This is a good home for mutation orchestration that should not be buried in a component body.

### `lib/<concern>/`

Use `lib/` for pure helpers, adapters, parsers, and formatters.

Examples:

- `lib/markdown/markdown.lib.ts`
- `lib/dates/date.lib.ts`
- `lib/search/search-params.lib.ts`

`lib/` should not become a junk drawer.

## Placement Rules By Artifact Type

Use these rules when deciding where a file belongs.

### Route files

Place in `app/`.

Route files should:

- orchestrate
- compose sections
- pass data down
- define metadata or route boundaries

Route files should not be the main home for:

- dense UI markup across many sections
- repeated event handlers
- reusable business logic
- reusable fetch helpers

### Layouts

Place in `app/`.

Layouts own route shell concerns:

- navigation frame
- shared route chrome
- metadata boundaries
- route-level providers if justified

### Page sections

Place in `components/views/` when they are route composition pieces.

If the section is clearly domain-owned and not a route composition concern, place it in `components/<domain>/`.

### Reusable UI primitives

Place in `components/ui/`.

These should be low-level and domain-agnostic.

### Shared composite components

Place in `components/shared/`.

Use this for reusable composed UI that spans multiple domains.

### Domain-specific components

Place in `components/<domain>/`.

This should be the default for domain-owned UI.

### View components

Place in `components/views/` when the component exists to keep route files lean and represents a whole page section or route composition block.

Naming examples:

- `agents.view.tsx`
- `home-hero.view.tsx`

### Domain hooks

Place in `hooks/<domain>/`.

Naming example:

- `use-agent-search.hook.ts`

### Shared hooks

Keep only truly cross-domain hooks in a shared root-level hook location if the repo chooses to have one. Otherwise keep hooks inside their domain folder.

### Domain services

Place in `services/<domain>/`.

This includes domain-owned API access, transformations, or integrations.

### App-wide services

Place shared integrations in a clearly shared service module, still keeping the responsibility explicit.

Examples:

- `services/app/analytics.service.ts`
- `services/app/api.service.ts`

### Global store

Place in `store/app/` or another clearly global store module.

Only use this for real app-wide client state.

### Domain state

Keep domain state local first.

If multiple domain files need the state, use `store/<domain>/` or a domain hook before promoting it globally.

### Types

Keep types in `types/<domain>/` by default.

Naming example:

- `user.types.ts`

### Constants

Keep constants in `constants/<domain>/` by default.

Naming example:

- `app.constants.ts`

### Static data

Place in `data/<domain>/`.

Naming example:

- `blog.data.ts`

### Parsing and formatting helpers

Place in `lib/<concern>/`.

Naming example:

- `markdown.lib.ts`

### API clients

Place in `services/<domain>/` for domain-owned clients or `services/app/` for shared app-wide clients.

### Validation schemas

Place in `schema/<domain>/`.

Keep schemas close to the forms or mutations they validate.

### Server actions or route-facing action helpers

Place in `actions/<domain>/` when they represent domain mutations or submission flows.

### Loading skeletons

Keep skeletons close to the UI they represent.

Use:

- `components/views/` for route-level skeletons
- `components/<domain>/` for domain-specific skeletons

Examples:

- `blog-list-skeleton.tsx`
- `agents-grid-skeleton.tsx`

### Error fallback components

Keep error fallback UI close to the domain or route it protects.

Promote only if the fallback is truly shared.

### Empty states

Keep empty states close to the owning domain unless you have a stable shared empty-state pattern.

### Analytics helpers

Domain-specific tracking stays close to the domain.

Shared analytics integration belongs in `services/app/analytics.service.ts` or a focused helper in `lib/`.

## Keep Local Vs Promote Shared

Use this rule consistently.

### Keep code local when

- it has one consumer
- it belongs to one domain
- its abstraction is still unstable
- moving it would make navigation harder, not easier

### Promote to a domain folder when

- multiple files in one domain need it
- the concern has enough complexity to justify a dedicated file

### Promote to shared/app-wide when

- multiple domains actually use it
- the responsibility is stable and generic enough
- it represents platform infrastructure or reusable primitives

Do not move code to shared because it "might be reused later."

## Component Splitting Rules

Split by **responsibility**, not only by line count.

### Split a route file when

- it renders multiple page sections
- it mixes orchestration and detailed markup
- it contains complex interaction logic and view composition together

### Split a component when

- it handles multiple visual regions with distinct responsibilities
- the logic obscures the rendering
- internal subparts have meaningful boundaries
- loading, error, and success states are all mixed into one large render block

### Extract a hook when

- stateful logic is reused
- state transitions dominate the component
- the component becomes harder to read because logic and markup are tangled

### Extract a service when

- code talks to external systems
- requests, persistence, analytics, or integration logic are mixed into UI files

### Extract an action when

- mutation orchestration or server actions are cluttering the UI layer
- submission logic needs a named home outside the component

### Do not oversplit

Do not create tiny files when:

- the code is still easy to read
- the child component would only wrap a few lines with no meaningful boundary
- the abstraction name is weaker than the inline code

## Naming Conventions

Prefer **kebab-case** file names with **responsibility suffixes** where they add clarity.

### Recommended patterns

- component: `my-component.tsx`
- types: `user.types.ts`
- store: `user.store.ts`
- lib helper: `markdown.lib.ts`
- hook: `use-something.hook.ts`
- constants: `app.constants.ts`
- static data: `blog.data.ts`
- action: `publish-agent.action.ts`
- schema: `contact-form.schema.ts`
- view component: `acme.view.tsx`
- shared reusable loader: `loader.shared.ts`

### Notes

- Use `.tsx` for components and view files.
- Use `.ts` for hooks, types, services, constants, data, lib helpers, store modules, actions, and schema files unless JSX is required.
- Use suffixes only when they clarify ownership and role.

### Avoid names like

- `utils.ts`
- `helpers.ts`
- `common.ts`
- `misc.ts`
- `temp.ts`

These names hide responsibility.

## Forms, Feedback, Loading, and Error Handling

Structure is incomplete if these concerns are ignored.

### Forms and validation

Every meaningful form should have:

- a schema or clear validation layer
- field-level validation
- submit-level failure handling
- disabled or pending submit states

Keep schemas with the owning domain by default.

Example:

```text
components/account/
  account-form.tsx
hooks/account/
  use-account-form.hook.ts
services/account/
  account.service.ts
schema/account/
  account-form.schema.ts
actions/account/
  submit-account-form.action.ts
```

### User feedback

For user-triggered actions, the UI should usually show:

- pending state
- success feedback if the action matters
- failure feedback with a useful message

Do not leave async actions silent.

### Loading states and skeletons

Use loading UI that matches the final layout.

Prefer skeletons when structure matters more than just "something is loading."

Keep loading UI close to the view or domain it represents.

### Error handling

Handle recoverable errors explicitly.

Show:

- fallback messaging
- retry actions where practical
- contextual errors instead of generic route collapse

### Graceful crash boundaries

Use error boundaries where isolation matters.

Examples:

- a dashboard widget failing should not always crash the full page
- a rich editor error may need a local boundary and fallback UI

Graceful failure is part of architecture, not an afterthought.

### Accessibility

Ensure loading, pending, invalid, and error states remain accessible:

- communicate invalid fields clearly
- do not hide important feedback in color alone
- make disabled and pending states understandable

## Refactor Workflow

When using this skill in a real codebase:

1. inspect the current structure
2. identify unclear ownership and bloated files
3. decide what is route-local, domain-local, shared, or global
4. move code to the narrowest valid scope first
5. apply naming conventions consistently
6. include missing validation, loading, feedback, and error concerns in the refactor

## Examples

### Example 1: Oversized route file

**Before**

```text
app/page.tsx
```

This file contains:

- hero section
- stats section
- featured cards
- agent section
- inline helper components

**After**

```text
app/page.tsx
components/views/
  home-hero.view.tsx
  home-stats.view.tsx
  home-featured-skills.view.tsx
  home-featured-agents.view.tsx
```

Reasoning:

- `app/page.tsx` becomes a composition root
- each section gets a clear boundary
- section-level rendering is easier to change and test

### Example 2: Domain folders across layers

```text
components/agents/
  agent-card.tsx
  agent-grid.tsx
  agent-search.tsx
hooks/agents/
  use-agent-search.hook.ts
services/agents/
  agent.service.ts
types/agents/
  agent.types.ts
schema/agents/
  agent-filter.schema.ts
actions/agents/
  publish-agent.action.ts
constants/agents/
  agent.constants.ts
data/agents/
  agent.data.ts
store/agents/
  agent.store.ts
```

Reasoning:

- responsibilities stay explicit by layer
- the `agents` domain stays easy to navigate
- no single folder becomes a giant dump

### Example 3: Shared vs domain-owned vs view

```text
components/ui/card.tsx
components/shared/section-header.shared.tsx
components/views/marketing-hero.view.tsx
components/agents/agent-card.tsx
```

Use them like this:

- `components/ui/card.tsx`: low-level primitive shell
- `components/shared/section-header.shared.tsx`: repeated composed pattern across pages
- `components/views/marketing-hero.view.tsx`: route section
- `components/agents/agent-card.tsx`: domain-owned card with agent-specific behavior

### Example 4: Form handling with schema and action

```text
components/contact/
  contact-form.tsx
  contact-success-state.tsx
  contact-error-state.tsx
hooks/contact/
  use-contact-form.hook.ts
services/contact/
  contact.service.ts
schema/contact/
  contact-form.schema.ts
actions/contact/
  submit-contact-form.action.ts
```

Reasoning:

- the schema is colocated with the contact domain
- feedback states are explicit
- mutation orchestration is not buried in the component
- the hook handles state transitions and keeps rendering lean

### Example 5: Shared naming examples

```text
user.types.ts
user.store.ts
markdown.lib.ts
use-auth.hook.ts
app.constants.ts
blog.data.ts
agents.view.tsx
loader.shared.ts
publish-agent.action.ts
contact-form.schema.ts
```

## Anti-Patterns

Avoid these.

### Giant `components/` folder with no ownership model

This mixes unrelated domains and creates discovery problems.

### Bloated route files

If `app/.../page.tsx` contains most of the UI and logic, the route has become the app structure by accident.

### `utils.ts` junk drawer

This hides intent and creates low-trust code organization.

### Premature promotion to shared

Shared code should come from real repeated use, not guesswork.

### Global state for local concerns

This increases coupling and makes reasoning harder.

### Excessive fragmentation

Ten tiny files with weak names can be worse than one focused file.

### One giant flat layer folder

If every domain file sits directly in `components/`, `hooks/`, or `services/`, navigation quality drops quickly.

## Decision Checklist

Before placing or moving a file, ask:

1. Is this route-local, domain-local, shared, or app-global?
2. Is this UI, logic, integration, static data, validation, mutation orchestration, state, or a pure helper?
3. Does this component do more than one job?
4. Should this logic become a hook, service, action, schema, or helper?
5. Is the code actually reused enough to move to shared?
6. Are validation, feedback, loading, and error states accounted for?
7. Does the file name reveal the responsibility clearly?

## Output Expectations

When applying this skill, produce:

- a recommended target structure
- clear placement decisions for the affected files
- any needed split plan for oversized routes or components
- naming convention updates
- notes on missing validation, user feedback, loading states, skeletons, and graceful error handling if relevant
