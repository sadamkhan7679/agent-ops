---
title: Module-First Architecture
tags: architecture, modules, layers, organization
---

## Module-First Architecture

NestJS modules are the natural boundary for domain ownership. Each module encapsulates its controllers, services, repositories, DTOs, and entities. Inside each module, separate code by layer (controller → service → repository).

### Recommended Structure

```text
src/
  app.module.ts               # Root module — imports all feature modules
  main.ts                     # Bootstrap
  common/                     # Cross-cutting (guards, filters, pipes, interceptors)
    decorators/
      current-user.decorator.ts
      roles.decorator.ts
    filters/
      all-exceptions.filter.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    interceptors/
      logging.interceptor.ts
      transform.interceptor.ts
    pipes/
      parse-uuid.pipe.ts
  config/                     # Typed configuration
    config.module.ts
    app.config.ts
    database.config.ts
    auth.config.ts
  modules/                    # Domain modules
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
        user-response.dto.ts
      entities/
        user.entity.ts
      users.controller.spec.ts
      users.service.spec.ts
    orders/
      orders.module.ts
      orders.controller.ts
      orders.service.ts
      orders.repository.ts
      dto/
      entities/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
      strategies/
        jwt.strategy.ts
        local.strategy.ts
  shared/                     # Infrastructure modules
    database/
      database.module.ts
      drizzle.provider.ts
      schema/                 # Drizzle schema files
        users.schema.ts
        orders.schema.ts
        index.ts
    mail/
      mail.module.ts
      mail.service.ts
    logger/
      logger.module.ts
      logger.service.ts
  lib/                        # Pure utilities (no NestJS dependencies)
    pagination/
      paginate.ts
    crypto/
      hash.ts
    dates/
      format.ts
test/
  e2e/
    app.e2e-spec.ts
    auth.e2e-spec.ts
```

### Why Module-First

```text
# BAD: Layer-first at top level — modules hidden inside layers
src/
  controllers/
    users.controller.ts
    orders.controller.ts
  services/
    users.service.ts
    orders.service.ts
  repositories/
    users.repository.ts
```

Problems:
- Related files scattered across folders
- No clear ownership boundaries
- Hard to extract a module into a separate package
- NestJS module system ignored

Module-first keeps **all related code together** while maintaining layer separation **inside** each module.
