# AgentOps

> Open-source, publishable **skills** and **agents** for Claude-style workflows, plus a Next.js showcase app to browse them.

[![CI](https://github.com/sadamkhan7679/agent-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/sadamkhan7679/agent-ops/actions/workflows/ci.yml)
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

{{STATS}}

## Agent Teams

{{TEAM_STATS}}

## Featured Skills

{{SKILLS_TABLE}}

## Agents By Team

{{AGENTS_BY_TEAM}}

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
content/agents/<team>-<slug>/AGENT.md
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
