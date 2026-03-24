---
title: Nested DTO Validation
tags: dto, nested, validation, class-validator
---

## Nested DTO Validation

Validate complex, nested request payloads with `class-validator` and `class-transformer`.

### Nested Object Validation

```typescript
// dto/create-order.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsInt, Min, IsUUID, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';

class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class ShippingAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsString()
  note?: string;
}
```

### Conditional Validation

```typescript
import { ValidateIf } from 'class-validator';

export class PaymentDto {
  @IsEnum(['credit_card', 'bank_transfer', 'paypal'])
  method: string;

  // Only validate card fields when method is credit_card
  @ValidateIf((o) => o.method === 'credit_card')
  @IsString()
  cardNumber: string;

  @ValidateIf((o) => o.method === 'credit_card')
  @IsString()
  expiryDate: string;

  @ValidateIf((o) => o.method === 'bank_transfer')
  @IsString()
  accountNumber: string;
}
```

### Custom Validation

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom decorator: ensure end date is after start date
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value > relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}`;
        },
      },
    });
  };
}

// Usage
export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsAfter('startDate', { message: 'endDate must be after startDate' })
  endDate: string;
}
```

### Global Validation Pipe Setup

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,         // strip undecorated properties
    forbidNonWhitelisted: true, // throw on unknown properties
    transform: true,         // auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Rules

- Always use `@ValidateNested()` + `@Type(() => ChildDto)` for nested objects
- Use `{ each: true }` on arrays: `@ValidateNested({ each: true })`
- Set `whitelist: true` and `forbidNonWhitelisted: true` globally to reject unknown fields
- Use `@ValidateIf()` for conditional validation based on other fields
- Create custom decorators for cross-field validation (date ranges, password confirmation)
- Set `transform: true` so query string numbers are automatically converted
