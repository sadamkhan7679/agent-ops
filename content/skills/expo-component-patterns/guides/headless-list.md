---
title: Headless List Controller
impact: MEDIUM
tags: headless, list, pagination, refresh, renderless
---

## Headless List Controller

A headless hook manages list logic (pagination, refresh, empty state) while letting consumers control rendering entirely.

### Implementation

```tsx
import { useState, useCallback } from "react";

interface UseListControllerOptions<T> {
  fetchPage: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  pageSize?: number;
}

interface ListControllerResult<T> {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  isEmpty: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  flatListProps: {
    data: T[];
    onEndReached: () => void;
    onEndReachedThreshold: number;
    refreshing: boolean;
    onRefresh: () => void;
  };
}

function useListController<T>({
  fetchPage,
  pageSize = 20,
}: UseListControllerOptions<T>): ListControllerResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        const result = await fetchPage(pageNum);
        setData((prev) => (isRefresh ? result.data : [...prev, ...result.data]));
        setHasMore(result.hasMore);
        setPage(pageNum);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Fetch failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchPage]
  );

  // Initial load
  useEffect(() => {
    load(1, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) load(page + 1);
  }, [isLoading, hasMore, page, load]);

  const refresh = useCallback(() => load(1, true), [load]);

  return {
    data,
    isLoading,
    isRefreshing,
    isEmpty: !isLoading && data.length === 0,
    hasMore,
    error,
    loadMore,
    refresh,
    flatListProps: {
      data,
      onEndReached: loadMore,
      onEndReachedThreshold: 0.5,
      refreshing: isRefreshing,
      onRefresh: refresh,
    },
  };
}
```

### Usage

```tsx
function ProductListScreen() {
  const list = useListController<Product>({
    fetchPage: (page) => api.getProducts({ page, limit: 20 }),
  });

  if (list.isLoading && list.data.length === 0) return <ProductSkeleton />;
  if (list.error) return <ErrorView error={list.error} onRetry={list.refresh} />;
  if (list.isEmpty) return <EmptyState message="No products found" />;

  return (
    <FlatList
      {...list.flatListProps}
      renderItem={({ item }) => <ProductCard product={item} />}
      keyExtractor={(item) => item.id}
      ListFooterComponent={list.hasMore ? <ActivityIndicator /> : null}
    />
  );
}
```
