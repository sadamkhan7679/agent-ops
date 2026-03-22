# AgentOps

A curated collection of publishable **skills** and **agents** for [Claude Code](https://claude.ai) and [skills.sh](https://skills.sh). This repository is both a content registry and a Next.js showcase app for browsing, previewing, and installing those assets.

---

## Project Structure

```text
agent-skills/
|-- app/                              # Next.js App Router routes
|   |-- agents/
|   |   |-- [slug]/page.tsx          # Dynamic agent detail page
|   |   `-- page.tsx                 # Agents catalog
|   |-- skills/
|   |   |-- [slug]/page.tsx          # Dynamic skill detail page
|   |   `-- page.tsx                 # Skills catalog
|   |-- favicon.ico
|   |-- globals.css                  # Global styles and theme tokens
|   |-- layout.tsx                   # Root layout, fonts, theme provider
|   `-- page.tsx                     # Landing page
|
|-- components/                       # Shared UI and feature components
|   |-- agents/
|   |   |-- agent-card.tsx
|   |   |-- agent-grid.tsx
|   |   `-- agent-search.tsx
|   |-- layout/
|   |   |-- footer.tsx
|   |   `-- header.tsx
|   |-- shared/
|   |   |-- code-block-wrapper.tsx   # MDX code block chrome
|   |   `-- copy-button.tsx
|   |-- skills/
|   |   |-- skill-card.tsx
|   |   |-- skill-grid.tsx
|   |   `-- skill-search.tsx
|   |-- ui/                          # Reusable shadcn-style primitives
|   |   |-- badge.tsx
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- input.tsx
|   |   |-- separator.tsx
|   |   |-- sonner.tsx
|   |   `-- tabs.tsx
|   `-- theme-provider.tsx
|
|-- content/                          # Publishable skill and agent source files
|   |-- agents/
|   |   |-- engineering-ai-ml-engineer/AGENT.md
|   |   |-- engineering-api-architect/AGENT.md
|   |   |-- engineering-backend-developer/AGENT.md
|   |   |-- engineering-cloud-architect/AGENT.md
|   |   |-- quality-code-reviewer/AGENT.md
|   |   |-- engineering-database-architect/AGENT.md
|   |   |-- engineering-data-engineer/AGENT.md
|   |   |-- design-design-system-lead/AGENT.md
|   |   |-- engineering-devops-engineer/AGENT.md
|   |   |-- engineering-frontend-developer/AGENT.md
|   |   |-- engineering-full-stack-developer/AGENT.md
|   |   |-- engineering-mobile-developer/AGENT.md
|   |   |-- engineering-performance-engineer/AGENT.md
|   |   |-- quality-qa-engineer/AGENT.md
|   |   |-- engineering-security-engineer/AGENT.md
|   |   |-- marketing-seo-specialist/AGENT.md
|   |   |-- engineering-system-architect/AGENT.md
|   |   |-- product-technical-pm/AGENT.md
|   |   |-- content-technical-writer/AGENT.md
|   |   `-- design-ui-ux-designer/AGENT.md
|   `-- skills/
|       |-- react-best-practices/SKILL.md
|       |-- react-component-patterns/SKILL.md
|       |-- react-hook-form-zod-shadcn/SKILL.md
|       |-- shadcn-dialog-builder/SKILL.md
|       `-- shadcn-shared-form-fields/SKILL.md
|
|-- data/
|   `-- app.data.ts                  # App branding and shared metadata
|
|-- hooks/                            # Reserved for custom hooks
|
|-- lib/                              # Content loaders and utilities
|   |-- agents.ts                    # Agent registry and metadata parsing
|   |-- markdown.ts                  # MDX rendering helpers
|   |-- skills.ts                    # Skill registry and metadata parsing
|   `-- utils.ts
|
|-- public/                           # Static assets
|-- mdx-components.tsx                # Global MDX component overrides
|-- AGENTS.md                         # This file
|-- components.json                   # shadcn/ui config
|-- eslint.config.mjs
|-- next.config.ts
|-- package.json
|-- postcss.config.mjs
`-- tsconfig.json
```

---

## Skills

Skills are focused, reusable prompt instructions that Claude can activate to follow a specific workflow, architecture pattern, or coding standard. In this repo, each skill lives in its own directory so it can be published independently and still carry a stable slug.

### Available Skills

| # | Skill | Slug | Description |
| --- | --- | --- | --- |
| 1 | **React Component Patterns** | `react-component-patterns` | Compound components, render props, HOCs, polymorphic components, and controlled vs uncontrolled patterns |
| 2 | **React Best Practices** | `react-best-practices` | Production React guidance covering performance, hooks, state management, error handling, Suspense, and accessibility |
| 3 | **React Hook Form + Zod + shadcn** | `react-hook-form-zod-shadcn` | Type-safe forms with Zod schemas, `react-hook-form`, and shadcn UI patterns |
| 4 | **shadcn Shared Form Fields** | `shadcn-shared-form-fields` | Reusable and composable field abstractions with consistent validation UX |
| 5 | **shadcn Dialog Builder** | `shadcn-dialog-builder` | Patterns for confirmation dialogs, form dialogs, multi-step flows, and async action dialogs |

### Skill File Format

Each skill is stored as:

```text
content/skills/<slug>/SKILL.md
```

Each `SKILL.md` file follows this structure:

```markdown
---
name: Skill Name
description: One-line description for discovery
version: 1.0.0
type: skill
tags: [react, shadcn, forms]
category: React
author: agent-skills
---

# Skill Name

## When to Use

[Trigger conditions for Claude to activate this skill]

## Instructions

[Detailed instructions, patterns, code examples]

## Examples

[Before/after examples demonstrating the skill]
```

---

## Agents

Agents are persona-driven prompt configurations that give Claude a specialized role, preferred stack, capability set, and opinionated workflow.

### Available Agents

| # | Agent | Slug | Expertise |
| --- | --- | --- | --- |
| 1 | **AI/ML Engineer** | `engineering-ai-ml-engineer` | LLM apps, RAG, inference workflows, model evaluation |
| 2 | **API Architect** | `engineering-api-architect` | API contracts, versioning, DX, REST and GraphQL design |
| 3 | **Backend Developer** | `engineering-backend-developer` | Node.js services, auth, APIs, persistence, server-side architecture |
| 4 | **Cloud Architect** | `engineering-cloud-architect` | Cloud infrastructure, deployment topology, scalability, resilience |
| 5 | **Code Reviewer** | `quality-code-reviewer` | PR analysis, regressions, maintainability, test coverage |
| 6 | **Database Architect** | `engineering-database-architect` | Schema design, migrations, indexing, and query optimization |
| 7 | **Data Engineer** | `engineering-data-engineer` | Pipelines, ETL, warehousing, data modeling |
| 8 | **Design System Lead** | `design-design-system-lead` | Design systems, component APIs, tokens, and consistency |
| 9 | **DevOps Engineer** | `engineering-devops-engineer` | CI/CD, infrastructure automation, observability, release workflows |
| 10 | **Frontend Developer** | `engineering-frontend-developer` | React, Next.js, Tailwind CSS v4, shadcn/ui, accessibility |
| 11 | **Full-Stack Developer** | `engineering-full-stack-developer` | End-to-end feature delivery across UI, API, and deployment |
| 12 | **Mobile Developer** | `engineering-mobile-developer` | React Native, Expo, mobile UX, and native integrations |
| 13 | **Performance Engineer** | `engineering-performance-engineer` | Profiling, Core Web Vitals, rendering and backend performance |
| 14 | **QA Engineer** | `quality-qa-engineer` | Test strategy, automation, regression prevention, reliability |
| 15 | **Security Engineer** | `engineering-security-engineer` | AppSec, auth, OWASP risks, secure architecture |
| 16 | **SEO Specialist** | `marketing-seo-specialist` | Technical SEO, metadata, structured data, search visibility |
| 17 | **System Architect** | `engineering-system-architect` | Distributed systems, service boundaries, reliability, scalability |
| 18 | **Technical PM** | `product-technical-pm` | Scope definition, delivery planning, product-technical alignment |
| 19 | **Technical Writer** | `content-technical-writer` | Documentation, guides, API docs, developer education |
| 20 | **UI/UX Designer** | `design-ui-ux-designer` | UX flows, interaction design, visual hierarchy, product UI |

### Agent File Format

Each agent is stored as:

```text
content/agents/<team>-<slug>/AGENT.md
```

Each `AGENT.md` file follows this structure:

```markdown
---
name: Agent Name
description: One-line description
version: 1.0.0
type: agent
role: specialized-role
tags: [frontend, react, nextjs]
capabilities: [Capability A, Capability B]
skills: [skill-slug-a, skill-slug-b]
author: agent-skills
---

# Agent Name

## Role

[Agent persona and expertise areas]

## Capabilities

[What this agent can do]

## Preferred Stack

[Technologies and tools this agent favors]

## Workflow

[How this agent approaches tasks]

## Guidelines

[Opinionated rules and best practices the agent follows]
```

---

## Presentation Layer

The Next.js application is the presentation layer for the content in `content/`. It reads frontmatter and markdown from disk, builds searchable catalogs, and renders detail pages with MDX.

### Current Features

- **Landing Page**: Overview of the project plus featured skills and agents.
- **Skills Catalog**: Search and tag filtering for all local skills.
- **Agents Catalog**: Search and team filtering for all local agents.
- **Dynamic Detail Pages**: Static params generated for every skill and agent slug.
- **MDX Rendering**: Markdown content is rendered with custom components and syntax highlighting.
- **Associated Skills UI**: Agent detail pages distinguish between local repo skills and external registry skills.
- **Theme Support**: `next-themes` based light and dark mode support.
- **Responsive Layout**: Shared header, footer, and mobile navigation.

### Rendering Flow

1. `lib/skills.ts` and `lib/agents.ts` scan `content/` directories and parse frontmatter with `gray-matter`.
2. `lib/markdown.ts` compiles markdown via `next-mdx-remote/rsc`.
3. `mdx-components.tsx` provides custom rendering for headings, lists, tables, links, and code blocks.
4. App routes under `app/skills` and `app/agents` render catalog and detail views from that data.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Components | shadcn-style UI primitives |
| Markdown | `next-mdx-remote`, `remark-gfm`, `rehype-pretty-code` |
| Metadata Parsing | `gray-matter` |
| Theme | `next-themes` |
| Package Manager | pnpm |

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (Turbopack)
pnpm dev

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Format TypeScript and TSX files
pnpm format

# Build for production
pnpm build
```

---

## Publishing Skills And Agents

Skills and agents in `content/` are designed to be published to:

- **skills.sh**: Community registry for Claude Code skills
- **Claude Code**: Direct use via local skills and agent configurations

Each item is self-contained inside its own slug directory, which keeps metadata, content, and install path stable.
