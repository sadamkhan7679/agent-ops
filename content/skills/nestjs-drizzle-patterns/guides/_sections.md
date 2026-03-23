# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The prefix (in parentheses) is the filename prefix used to group guides.

---

## 1. Setup & Integration (setup)

**Impact:** CRITICAL
**Description:** Drizzle module provider, connection pooling, drizzle.config.ts, and environment configuration for NestJS.

## 2. Schema Design (schema)

**Impact:** CRITICAL
**Description:** Table definitions with pgTable, columns, constraints, PostgreSQL enums, custom types, and index strategies.

## 3. Relations & Joins (relations)

**Impact:** HIGH
**Description:** One-to-many, many-to-many with junction tables, and self-referential relations using the Drizzle relations API.

## 4. Query Builder (queries)

**Impact:** HIGH
**Description:** Select, insert, update, upsert, and raw SQL patterns using the Drizzle query builder and sql template literal.

## 5. Transactions (transactions)

**Impact:** HIGH
**Description:** Transaction patterns with rollback, nested transactions with savepoints, and cross-service transaction management.

## 6. Repository Pattern (repository)

**Impact:** MEDIUM
**Description:** Generic base repository with Drizzle, domain-specific repository methods, and NestJS provider integration.

## 7. Migrations (migrations)

**Impact:** MEDIUM
**Description:** Migration generation with drizzle-kit, push workflow, rollback strategies, and database seeding patterns.

## 8. Performance (performance)

**Impact:** MEDIUM
**Description:** Connection pooling with pg/postgres.js, prepared statements, partial selects, and efficient pagination queries.

## 9. Testing (testing)

**Impact:** LOW-MEDIUM
**Description:** Test database setup with migrations, repository integration testing, and transaction-based test isolation.
