# AgentOps

> Open-source, publishable **skills** and **agents** for Claude-style workflows, plus a Next.js showcase app to browse them.

[![CI](https://github.com/sadamkhan7679/agent-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/sadamkhan7679/agent-skills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## What Is This?

AgentOps is both:

- A curated content registry of reusable **skills** and specialized **agents**
- A Next.js application for browsing, previewing, and documenting that content

The repository is designed for open-source collaboration. Skills and agents live as markdown content with frontmatter, while the app reads them from disk and renders searchable catalogs and detail pages.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` and browse:

- `/skills`
- `/agents`

## Stats

- **5 skills** available locally
- **20 agents** available locally
- **15 unique skill tags**
- **20 unique agent roles**

## Featured Skills

| Skill | Slug | Category | Description |
| --- | --- | --- | --- |
| React Best Practices | `react-best-practices` | React | Production-grade React best practices covering performance, hooks, state management, error handling, Suspense, accessibility, and Server Components |
| React Component Patterns | `react-component-patterns` | React | Advanced React component patterns with TypeScript including compound components, render props, HOCs, polymorphic components, and more |
| React Hook Form + Zod + shadcn/ui | `react-hook-form-zod-shadcn` | Forms | Complete guide to building type-safe forms with react-hook-form v7, Zod v4, and shadcn/ui Form components |
| shadcn/ui Dialog Builder | `shadcn-dialog-builder` | UI Components | Comprehensive patterns for building confirmation, form, wizard, and responsive dialogs with shadcn/ui and TypeScript |
| shadcn/ui Shared Form Fields | `shadcn-shared-form-fields` | Forms | Reusable, type-safe form field components wrapping shadcn/ui primitives with react-hook-form useFormContext |

## Featured Agents

| Agent | Slug | Role | Description |
| --- | --- | --- | --- |
| AI/ML Engineer | `ai-ml-engineer` | ai-ml-engineer | Expert AI/ML engineer specializing in LLM integration, RAG pipelines, prompt engineering, AI agent architecture, and model evaluation with TypeScript |
| API Architect | `api-architect` | api-architect | Expert API architect specializing in RESTful design, GraphQL federation, tRPC, and schema-first development with comprehensive governance |
| Senior Backend Developer | `backend-developer` | backend-developer | Expert backend developer specializing in Node.js, API design, authentication, database integration, and server-side architecture |
| Cloud Architect | `cloud-architect` | cloud-architect | Expert cloud architect specializing in AWS, Vercel, serverless patterns, edge computing, and infrastructure-as-code for scalable cloud-native applications |
| Code Reviewer | `code-reviewer` | code-reviewer | Expert code reviewer specializing in code quality analysis, security detection, performance optimization, and constructive feedback for TypeScript codebases |
| Data Engineer | `data-engineer` | data-engineer | Expert data engineer specializing in ETL pipelines, data modeling, analytics infrastructure, observability, and event streaming systems |
| Database Architect | `database-architect` | database-architect | Expert database architect specializing in PostgreSQL schema design, query optimization, migrations, and data integrity patterns |
| Design System Lead | `design-system-lead` | design-system-lead | Expert design system architect specializing in token architecture, component library governance, theming, and cross-platform design consistency |
| DevOps Engineer | `devops-engineer` | devops-engineer | Expert DevOps engineer specializing in CI/CD pipelines, container orchestration, infrastructure automation, and deployment strategies |
| Senior Frontend Developer | `frontend-developer` | frontend-developer | Expert frontend developer specializing in React 19, Next.js 16, Tailwind CSS v4, and shadcn/ui with accessibility-first, component-driven development |
| Full-Stack Developer | `full-stack-developer` | full-stack-developer | End-to-end feature developer bridging frontend and backend with type safety, vertical slice development, and full deployment awareness |
| Senior Mobile Developer | `mobile-developer` | mobile-developer | Expert mobile developer specializing in React Native, Expo, and cross-platform development with offline-first architecture and native performance |
| Performance Engineer | `performance-engineer` | performance-engineer | Expert performance engineer specializing in Core Web Vitals optimization, bundle analysis, database profiling, and runtime performance for web applications |
| QA Engineer | `qa-engineer` | qa-engineer | Expert QA engineer specializing in test automation with Playwright, Vitest, and comprehensive testing strategies for modern web applications |
| Security Engineer | `security-engineer` | security-engineer | Expert security engineer specializing in threat modeling, authentication systems, vulnerability assessment, and compliance implementation |
| SEO Specialist | `seo-specialist` | seo-specialist | Expert SEO specialist specializing in technical SEO, metadata optimization, structured data, Core Web Vitals, and AI search engine optimization |
| System Architect | `system-architect` | system-architect | Expert system architect specializing in scalable distributed systems, microservices decomposition, and event-driven architecture design |
| Technical Product Manager | `technical-pm` | technical-pm | Expert technical product manager specializing in requirements analysis, sprint planning, technical specifications, and stakeholder communication |
| Technical Writer | `technical-writer` | technical-writer | Expert technical writer specializing in API documentation, architecture decision records, developer guides, and code documentation standards |
| UI/UX Designer | `ui-ux-designer` | ui-ux-designer | Expert UI/UX designer specializing in user research, interface design, prototyping, and design system creation with accessibility-first principles |

## Project Structure

```text
agent-skills/
|-- app/
|-- components/
|-- content/
|-- data/
|-- lib/
|-- public/
|-- templates/
`-- scripts/
```

## Development

```bash
pnpm dev
pnpm generate:readme
pnpm typecheck
pnpm lint
pnpm build
```

## Content Model

Skills live in:

```text
content/skills/<slug>/SKILL.md
```

Agents live in:

```text
content/agents/<slug>/AGENT.md
```

## Contributing

Contributions are welcome for:

- New skills and agents
- Improvements to the app experience
- Metadata and rendering fixes
- Docs, automation, and CI improvements

Start with [CONTRIBUTING.md](./CONTRIBUTING.md), and follow the security guidance in [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
