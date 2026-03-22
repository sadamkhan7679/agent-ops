# Contributing

Thanks for contributing to AgentOps.

## Development Setup

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm generate:readme
pnpm typecheck
pnpm lint
pnpm build
```

## Content Structure

Skills live in:

```text
content/skills/<slug>/SKILL.md
```

Agents live in:

```text
content/agents/<slug>/AGENT.md
```

## Required Frontmatter

Skills must include:

- `name`
- `description`
- `version`
- `type: skill`
- `tags`
- `author`

Agents must include:

- `name`
- `description`
- `version`
- `type: agent`
- `role`
- `tags`
- `capabilities`
- `skills`
- `author`

## Slug Rules

- Use lowercase kebab-case.
- Keep slugs stable once published.
- Match the directory name to the public slug.

## Pull Request Guidelines

- Keep changes focused.
- Include screenshots for UI changes.
- Update relevant content/docs when behavior changes.
- Regenerate `README.md` when content inventory changes.

## Reporting Problems

- Use GitHub Issues for bugs and feature requests.
- Use Discussions for questions, ideas, and showcase posts.
- Do not report security issues publicly. See [SECURITY.md](./SECURITY.md).
