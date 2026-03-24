---
title: GraphQL Subscriptions
tags: graphql, subscriptions, websocket, real-time
---

## GraphQL Subscriptions

Implement real-time data push with GraphQL subscriptions over WebSocket.

### Setup

```typescript
// app.module.ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (context) => {
            // Authenticate WebSocket connections
            const token = context.connectionParams?.authorization as string;
            if (!token) throw new Error('Missing auth token');
          },
        },
      },
    }),
  ],
})
export class AppModule {}
```

### PubSub Setup

```typescript
// common/pubsub/pubsub.module.ts
import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const PUB_SUB = Symbol('PUB_SUB');

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: new PubSub(),
    },
  ],
  exports: [PUB_SUB],
})
export class PubSubModule {}

// For production with multiple instances, use Redis PubSub:
// import { RedisPubSub } from 'graphql-redis-subscriptions';
```

### Subscription Resolver

```typescript
// modules/messages/messages.resolver.ts
import { Resolver, Mutation, Subscription, Args } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '@/common/pubsub/pubsub.module';
import { PubSub } from 'graphql-subscriptions';

@Resolver(() => MessageModel)
export class MessagesResolver {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => MessageModel)
  async sendMessage(@Args('input') input: SendMessageInput) {
    const message = await this.messagesService.create(input);

    // Publish to subscribers
    await this.pubSub.publish('messageAdded', {
      messageAdded: message,
      channelId: input.channelId,
    });

    return message;
  }

  @Subscription(() => MessageModel, {
    // Filter: only receive messages for subscribed channel
    filter: (payload, variables) => {
      return payload.channelId === variables.channelId;
    },
  })
  messageAdded(@Args('channelId') channelId: string) {
    return this.pubSub.asyncIterableIterator('messageAdded');
  }
}
```

### Rules

- Use `graphql-ws` protocol (not the deprecated `subscriptions-transport-ws`)
- Authenticate WebSocket connections in `onConnect` — validate tokens before allowing subscriptions
- Use `filter` on subscriptions to scope events (e.g., only messages in a specific channel)
- Use in-memory `PubSub` for development, Redis-backed `RedisPubSub` for production multi-instance
- Publish events from mutations or services after successful operations
- Keep subscription payloads small — clients can query for full data after receiving the notification
