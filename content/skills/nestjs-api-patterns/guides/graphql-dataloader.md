---
title: DataLoader for N+1 Prevention
tags: graphql, dataloader, batching, n+1
---

## DataLoader for N+1 Prevention

Use DataLoader to batch and cache database requests within a single GraphQL query execution.

### DataLoader Setup

```typescript
// modules/users/users.loader.ts
import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { UsersRepository } from './users.repository';

@Injectable({ scope: Scope.REQUEST }) // new instance per request
export class UsersLoader {
  constructor(private readonly usersRepo: UsersRepository) {}

  readonly byId = new DataLoader<string, User | null>(async (ids) => {
    const users = await this.usersRepo.findByIds([...ids]);
    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id) ?? null);
  });
}
```

### Using DataLoader in Resolvers

```typescript
// modules/posts/posts.resolver.ts
@Resolver(() => PostModel)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersLoader: UsersLoader,
  ) {}

  @Query(() => [PostModel])
  posts() {
    return this.postsService.findAll();
  }

  // Without DataLoader: N queries for N posts
  // With DataLoader: 1 batched query for all unique author IDs
  @ResolveField(() => UserModel)
  author(@Parent() post: PostModel) {
    return this.usersLoader.byId.load(post.authorId);
  }
}
```

### Repository Batch Method

```typescript
// modules/users/users.repository.ts
async findByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];

  return this.db
    .select()
    .from(users)
    .where(inArray(users.id, ids));
}
```

### Multiple DataLoaders

```typescript
@Injectable({ scope: Scope.REQUEST })
export class PostsLoader {
  constructor(private readonly postsRepo: PostsRepository) {}

  // Load posts by author
  readonly byAuthorId = new DataLoader<string, Post[]>(async (authorIds) => {
    const posts = await this.postsRepo.findByAuthorIds([...authorIds]);
    const grouped = new Map<string, Post[]>();
    for (const post of posts) {
      const list = grouped.get(post.authorId) ?? [];
      list.push(post);
      grouped.set(post.authorId, list);
    }
    return authorIds.map((id) => grouped.get(id) ?? []);
  });

  // Load post count by author
  readonly countByAuthorId = new DataLoader<string, number>(async (authorIds) => {
    const counts = await this.postsRepo.countByAuthorIds([...authorIds]);
    const countMap = new Map(counts.map((c) => [c.authorId, c.count]));
    return authorIds.map((id) => countMap.get(id) ?? 0);
  });
}
```

### Module Registration

```typescript
@Module({
  providers: [
    PostsResolver,
    PostsService,
    PostsLoader,
    UsersLoader,
  ],
})
export class PostsModule {}
```

### Rules

- Use `Scope.REQUEST` on DataLoaders — they must not share cached data across requests
- DataLoader batch functions must return results in the same order as the input keys
- Return `null` for missing records — don't throw in the batch function
- Create separate DataLoaders for different query patterns (by ID, by foreign key, counts)
- Register DataLoaders as providers in the module — inject them into resolvers
- DataLoader solves N+1 for GraphQL field resolvers — not needed for REST endpoints
