# Agent Team Prefix, README Grouping, and Home View Refactor

## Summary

This change introduces team-prefixed agent directory slugs as the source of truth for agent grouping. The README generator and UI will derive team sections directly from those prefixed slugs. The homepage will also be refactored into leaner view components under `components/views/*`.

## Goals

- Encode the team in each agent directory slug.
- Group agents by team in generated documentation and UI.
- Keep frontmatter `name` human-readable and free of the team prefix.
- Reduce rendering complexity in `app/page.tsx` by extracting view components.

## Non-Goals

- Introducing a separate `team` frontmatter field.
- Redesigning the entire visual language of the site.
- Preserving old unprefixed agent URLs unless redirect support is explicitly added later.

## Content Model

### New slug format

Each agent directory under `content/agents` will follow:

```text
<team>-<agent-slug>
```

Examples:

```text
engineering-frontend-developer
engineering-backend-developer
marketing-seo-specialist
product-technical-pm
```

### Source of truth

- Team is derived from the leading slug segment.
- The rest of the slug identifies the agent within that team.
- Frontmatter `name` remains display-friendly, for example `Frontend Developer`.

### Derived metadata

`lib/agents.ts` should expose:

- `slug`: full slug, including team prefix
- `name`: display name from frontmatter
- `team`: normalized team key derived from slug
- `teamLabel`: formatted team label for display
- `shortSlug`: suffix slug without the team prefix
- existing metadata fields such as `description`, `role`, `capabilities`, and `skills`

## Data and Loader Changes

### `lib/agents.ts`

Refactor the loader to:

- parse team from the directory slug
- format team labels in one place
- provide helper utilities for grouped rendering

Suggested utilities:

- `getAllAgentsGroupedByTeam()`
- `getAllTeams()`
- `formatTeamLabel(team: string)`

The grouping contract should be stable so both the UI and README generator can use the same logic.

## README Generator Changes

### Current issue

The generator emits a single flat agents table, which makes the collection harder to scan as it grows.

### Target output

The generated README should include:

- overall stats
- optional team distribution stats
- a grouped agents section with one subsection per team

Suggested shape:

```markdown
## Agents by Team

### Engineering

| Agent | Slug | Role | Description |
| --- | --- | --- | --- |
...

### Marketing

| Agent | Slug | Role | Description |
| --- | --- | --- | --- |
...
```

### Script changes

Update `scripts/generate-readme.ts` to:

- parse prefixed slugs
- derive team metadata
- group agents by team
- render team sections instead of one flat agents table

The template should be adjusted to accept a grouped agents block rather than a single `{{AGENTS_TABLE}}` placeholder.

## UI Changes

### Agent catalog

`components/agents/agent-grid.tsx` should render grouped sections:

- section heading per team
- count badge or small count label
- grid of `AgentCard` items under each team

The grouping should be derived data, not hardcoded.

### Homepage

`app/page.tsx` is currently doing too much rendering inline. It should become a composition layer only.

Create view components under `components/views/*` for:

- hero
- stats
- featured skills
- featured agents or featured teams

Suggested files:

```text
components/views/home-hero.tsx
components/views/home-stats.tsx
components/views/home-featured-skills.tsx
components/views/home-featured-agents.tsx
```

If team-grouped showcase logic becomes more involved, add:

```text
components/views/home-agent-teams.tsx
```

### Card treatment

`AgentCard` should surface the team cleanly where useful, but avoid duplicating noise if the card is already shown inside a team section.

## Migration Plan

1. Rename all agent directories to the prefixed slug format.
2. Update the agent loader to derive team metadata from slug prefixes.
3. Update any code that depends on the old unprefixed slugs.
4. Refactor the README generator and template.
5. Refactor the homepage into `components/views/*`.
6. Update grouped rendering in the agents catalog.
7. Regenerate `README.md`.
8. Run validation checks.

## Risks

- Renaming agent directories changes route slugs.
- Existing deep links to `/agents/<old-slug>` will break without redirects.
- Any code or docs assuming old slugs must be updated in the same change.

## Testing

- Confirm every renamed agent still loads in the catalog and detail route.
- Confirm README generation succeeds and diff is clean after regeneration.
- Confirm homepage renders correctly with extracted components.
- Confirm team grouping appears consistently in both the homepage and agents catalog.

## Open Follow-Up

- If old URLs need to be preserved, add redirect handling in a separate change or extend this one with a legacy slug map.
