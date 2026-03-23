---
title: Offline-First Architecture
impact: HIGH
tags: offline, sync, optimistic-updates, network, persistence
---

## Offline-First Architecture

Mobile users frequently lose connectivity. An offline-first approach queues mutations locally, applies them optimistically, and syncs when the network returns.

**Incorrect (mutations fail silently offline):**

```tsx
async function addComment(postId: string, text: string) {
  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  // If offline, this throws and the comment is lost
  return res.json();
}
```

**Correct (offline mutation queue with optimistic UI):**

```tsx
import NetInfo from "@react-native-community/netinfo";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

interface PendingMutation {
  id: string;
  url: string;
  method: "POST" | "PUT" | "DELETE";
  body: string;
  createdAt: number;
  retryCount: number;
}

// Queue management
function getPendingMutations(): PendingMutation[] {
  const raw = storage.getString("pending-mutations");
  return raw ? JSON.parse(raw) : [];
}

function savePendingMutations(mutations: PendingMutation[]): void {
  storage.set("pending-mutations", JSON.stringify(mutations));
}

function queueMutation(mutation: Omit<PendingMutation, "id" | "createdAt" | "retryCount">) {
  const pending = getPendingMutations();
  pending.push({
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
  });
  savePendingMutations(pending);
}

// Sync engine — runs when network returns
async function syncPendingMutations() {
  const pending = getPendingMutations();
  const failed: PendingMutation[] = [];

  for (const mutation of pending) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: mutation.body,
      });
      if (!res.ok && mutation.retryCount < 3) {
        failed.push({ ...mutation, retryCount: mutation.retryCount + 1 });
      }
    } catch {
      if (mutation.retryCount < 3) {
        failed.push({ ...mutation, retryCount: mutation.retryCount + 1 });
      }
    }
  }

  savePendingMutations(failed);
}

// Hook that listens for connectivity changes
function useOfflineSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        syncPendingMutations();
      }
    });
    return () => unsubscribe();
  }, []);
}
```

**Correct (optimistic update in component):**

```tsx
function useAddComment(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);

  const addComment = useCallback(
    async (text: string) => {
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        text,
        author: currentUser,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      // Optimistic: show immediately
      setComments((prev) => [optimistic, ...prev]);

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        try {
          const real = await createComment(postId, text);
          setComments((prev) => prev.map((c) => (c.id === optimistic.id ? real : c)));
        } catch {
          queueMutation({
            url: `/api/posts/${postId}/comments`,
            method: "POST",
            body: JSON.stringify({ text }),
          });
        }
      } else {
        queueMutation({
          url: `/api/posts/${postId}/comments`,
          method: "POST",
          body: JSON.stringify({ text }),
        });
      }
    },
    [postId]
  );

  return { comments, addComment };
}
```

Rules:
- Queue mutations in MMKV when offline
- Apply changes optimistically to the UI immediately
- Sync the queue when connectivity returns via NetInfo listener
- Cap retry attempts to prevent infinite loops on permanent failures
- Show pending state indicators (spinner, dimmed text) for unsynced items
