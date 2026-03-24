---
title: GraphQL Resolvers
tags: graphql, resolvers, queries, mutations
---

## GraphQL Resolvers

Build GraphQL APIs with NestJS using the code-first approach for full TypeScript integration.

### Setup

```typescript
// app.module.ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true, // code-first: generate schema from decorators
      sortSchema: true,
      playground: process.env.NODE_ENV === 'development',
    }),
  ],
})
export class AppModule {}
```

### Object Types

```typescript
// modules/users/models/user.model.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  createdAt: Date;

  // passwordHash is not decorated — excluded from schema
}
```

### Resolver

```typescript
// modules/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserModel], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => UserModel, { name: 'user', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findById(id);
  }

  @Mutation(() => UserModel)
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => UserModel)
  updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }
}
```

### Input Types

```typescript
// modules/users/dto/create-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(2)
  name: string;

  @Field()
  @MinLength(8)
  password: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}
```

### Field Resolver

```typescript
@Resolver(() => UserModel)
export class UsersResolver {
  @ResolveField(() => [PostModel])
  posts(@Parent() user: UserModel) {
    return this.postsService.findByAuthor(user.id);
  }

  @ResolveField(() => Int)
  postCount(@Parent() user: UserModel) {
    return this.postsService.countByAuthor(user.id);
  }
}
```

### Rules

- Use code-first approach (`autoSchemaFile: true`) for TypeScript-native development
- Decorate only public fields with `@Field()` — undecorated fields are excluded from the schema
- Use `@InputType()` for mutations, `@ObjectType()` for responses
- Use `@ResolveField()` for computed fields and relationships
- Keep resolvers thin — delegate to services, same as REST controllers
- Combine `class-validator` with GraphQL input types for validation
