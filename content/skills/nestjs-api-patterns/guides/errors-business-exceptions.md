---
title: Business Exception Hierarchy
tags: errors, exceptions, domain, custom
---

## Business Exception Hierarchy

Create a domain-specific exception hierarchy to separate business errors from HTTP concerns.

### Base Business Exception

```typescript
// common/exceptions/business.exception.ts
export abstract class BusinessException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}
```

### Domain Exceptions

```typescript
// common/exceptions/domain.exceptions.ts
import { HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends BusinessException {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`, { entity, id });
  }
}

export class DuplicateEntityException extends BusinessException {
  readonly code = 'DUPLICATE_ENTITY';
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists`, { entity, field, value });
  }
}

export class InsufficientStockException extends BusinessException {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}`, { productId, requested, available });
  }
}

export class InvalidStateTransitionException extends BusinessException {
  readonly code = 'INVALID_STATE_TRANSITION';
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(entity: string, currentState: string, targetState: string) {
    super(`Cannot transition ${entity} from ${currentState} to ${targetState}`);
  }
}
```

### Business Exception Filter

```typescript
// common/filters/business-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    response.status(exception.httpStatus).json({
      error: {
        statusCode: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### Service Usage

```typescript
@Injectable()
export class OrdersService {
  async ship(orderId: string) {
    const order = await this.ordersRepo.findById(orderId);

    if (!order) {
      throw new EntityNotFoundException('Order', orderId);
    }

    if (order.status !== 'confirmed') {
      throw new InvalidStateTransitionException('Order', order.status, 'shipped');
    }

    return this.ordersRepo.updateStatus(orderId, 'shipped');
  }
}
```

### Rules

- Services throw business exceptions — they don't import `@nestjs/common` HTTP exceptions
- Each business exception has a unique `code` for client error handling (e.g., `INSUFFICIENT_STOCK`)
- The exception filter maps business exceptions to HTTP responses — services stay HTTP-agnostic
- Include `details` for machine-readable context (product ID, field name, available quantity)
- Keep the exception hierarchy flat — don't create deep inheritance chains
