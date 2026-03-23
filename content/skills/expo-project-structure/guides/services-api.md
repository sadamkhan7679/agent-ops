---
title: API Services
tags: services, api, fetch, typed-clients
---

## API Services

`services/<domain>/` holds functions that communicate with external APIs. Services own the request/response contract and transform raw API data into domain types.

### Structure

```text
services/
  app/
    api-client.service.ts       # Shared fetch wrapper
  auth/
    auth.service.ts
  products/
    product.service.ts
  orders/
    order.service.ts
  profile/
    profile.service.ts
```

### Example: Shared API client

```tsx
// services/app/api-client.service.ts
import { getAuthToken } from "@/store/auth/auth.store";
import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? "https://api.example.com";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message ?? "Request failed");
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}
```

### Example: Domain service

```tsx
// services/products/product.service.ts
import { apiClient } from "@/services/app/api-client.service";
import type { Product, ProductFilters } from "@/types/products/product.types";

export async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.query) params.set("q", filters.query);
  if (filters.page) params.set("page", String(filters.page));

  return apiClient<Product[]>(`/products?${params.toString()}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return apiClient<Product>(`/products/${id}`);
}

export async function searchProducts(query: string): Promise<Product[]> {
  return apiClient<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
}
```

### Service rules

1. **Services own the API contract.** They accept domain types and return domain types. Raw API shapes stay inside the service.
2. **One service file per domain.** `product.service.ts` handles all product API calls. Split only if the file exceeds 200 lines.
3. **No UI imports.** Services never import components, hooks, or navigation.
4. **Error handling at the boundary.** Services throw typed errors. Hooks and components decide how to display them.
5. **Testable in isolation.** Services should work without React. They are pure async functions.

### Transform responses

If the API shape differs from your domain types, transform inside the service:

```tsx
// services/orders/order.service.ts
import { apiClient } from "@/services/app/api-client.service";
import type { Order } from "@/types/orders/order.types";

type ApiOrder = {
  order_id: string;
  order_number: number;
  created_at: string;
  total_cents: number;
  status: string;
};

function toOrder(raw: ApiOrder): Order {
  return {
    id: raw.order_id,
    number: raw.order_number,
    createdAt: new Date(raw.created_at),
    total: raw.total_cents / 100,
    status: raw.status as Order["status"],
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const raw = await apiClient<ApiOrder[]>("/orders");
  return raw.map(toOrder);
}
```

### App-wide services

Place shared integration services in `services/app/`:

- `services/app/api-client.service.ts` — Fetch wrapper
- `services/app/analytics.service.ts` — Event tracking
- `services/app/push-notifications.service.ts` — Notification registration
