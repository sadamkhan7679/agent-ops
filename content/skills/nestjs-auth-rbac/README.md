# NestJS Auth & RBAC

A structured skill for authentication and authorization in NestJS, optimized for agents and LLMs.

## Structure

- `guides/` - Individual guide files (one per topic)
  - `_sections.md` - Section metadata
  - `prefix-description.md` - Individual guides
- `SKILL.md` - Skill definition with overview
- `AGENTS.md` - Compiled complete guide (generated)

## Technologies Covered

- NestJS 11+, TypeScript 5.x
- @nestjs/passport, @nestjs/jwt
- Argon2/bcrypt for password hashing
- Redis for session/token storage
- OAuth2 with Google, GitHub providers
