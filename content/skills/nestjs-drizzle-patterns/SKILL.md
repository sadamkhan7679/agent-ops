---
name: nestjs-drizzle-patterns
description: Deep Drizzle ORM patterns for NestJS applications covering schema design, migrations, relations, transactions, query builder, repositories, and testing. Use when integrating Drizzle with NestJS, designing database schemas, writing complex queries, or managing migrations.
version: 1.0.0
type: skill
tags: [nestjs, drizzle, orm, database, typescript, postgresql, migrations]
category: Backend
author: agent-skills
---

# NestJS Drizzle Patterns

Comprehensive patterns for integrating Drizzle ORM with NestJS applications. Covers schema design through production deployment with PostgreSQL.

## When to Apply

Reference these patterns when:
- Setting up Drizzle ORM in a NestJS application
- Designing database schemas with relations
- Writing complex queries with the Drizzle query builder
- Managing database migrations
- Implementing the repository pattern with Drizzle
- Handling transactions across multiple tables
- Testing database operations

## Guide Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Setup & Integration | CRITICAL | `setup-` |
| 2 | Schema Design | CRITICAL | `schema-` |
| 3 | Relations & Joins | HIGH | `relations-` |
| 4 | Query Builder | HIGH | `queries-` |
| 5 | Transactions | HIGH | `transactions-` |
| 6 | Repository Pattern | MEDIUM | `repository-` |
| 7 | Migrations | MEDIUM | `migrations-` |
| 8 | Performance | MEDIUM | `performance-` |
| 9 | Testing | LOW-MEDIUM | `testing-` |

## Quick Reference

### 1. Setup & Integration (CRITICAL)
- `setup-nestjs-module` - Drizzle module provider with connection pooling
- `setup-config` - drizzle.config.ts and environment configuration

### 2. Schema Design (CRITICAL)
- `schema-tables` - Table definitions with pgTable, columns, constraints
- `schema-enums` - PostgreSQL enums and custom types
- `schema-indexes` - Index strategies for query performance

### 3. Relations & Joins (HIGH)
- `relations-one-to-many` - One-to-many with relations API
- `relations-many-to-many` - Many-to-many with junction tables
- `relations-self-referential` - Self-referential relations (tree structures)

### 4. Query Builder (HIGH)
- `queries-select` - Select queries with where, orderBy, limit, offset
- `queries-insert-update` - Insert, update, upsert patterns
- `queries-raw-sql` - Raw SQL with sql template literal

### 5. Transactions (HIGH)
- `transactions-basic` - Transaction patterns with rollback
- `transactions-nested` - Nested transactions with savepoints

### 6. Repository Pattern (MEDIUM)
- `repository-base` - Generic base repository with Drizzle
- `repository-domain` - Domain-specific repository methods

### 7. Migrations (MEDIUM)
- `migrations-workflow` - Migration generation, push, and rollback
- `migrations-seeding` - Database seeding patterns

### 8. Performance (MEDIUM)
- `performance-connection-pool` - Connection pooling with pg/postgres.js
- `performance-query-optimization` - Prepared statements, partial selects, pagination

### 9. Testing (LOW-MEDIUM)
- `testing-database` - Test database setup with migrations
- `testing-repositories` - Repository integration testing patterns

## Full Compiled Document

For the complete guide with all content expanded: `AGENTS.md`
