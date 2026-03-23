---
title: Network Resilience Patterns
impact: MEDIUM
tags: retry, timeout, offline, network, resilience
---

## Network Resilience Patterns

Mobile networks are unreliable — tunnels, elevators, congested cells. Every network call needs timeout handling, retry logic, and offline detection.

**Correct (fetch wrapper with timeout and retry):**

```tsx
interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

async function resilientFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 10000, retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) return response;

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new ApiError(response.status, await response.text());
      }

      // Retry server errors (5xx)
      if (attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      throw new ApiError(response.status, "Server error after retries");
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) throw error;

      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < retries) {
          await delay(retryDelay * Math.pow(2, attempt));
          continue;
        }
        throw new NetworkError("Request timed out");
      }

      if (attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt));
        continue;
      }

      throw new NetworkError("Network request failed");
    }
  }

  throw new NetworkError("Unexpected retry exit");
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Correct (useNetworkStatus hook):**

```tsx
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useState, useEffect } from "react";

function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}

// Offline banner component
function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>You are offline. Changes will sync when reconnected.</Text>
    </View>
  );
}
```

Rules:
- Always set timeouts on fetch (10s default, 30s for uploads)
- Use exponential backoff for retries (1s, 2s, 4s)
- Don't retry 4xx errors — they won't succeed on retry
- Show offline state to users with a persistent banner
- Queue mutations when offline (see offline-first guide)
