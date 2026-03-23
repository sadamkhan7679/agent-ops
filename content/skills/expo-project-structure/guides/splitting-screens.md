---
title: Splitting Screens
tags: splitting, screens, refactoring, composition
---

## Splitting Screens

Large screen files are the most common structural problem in React Native apps. A screen file that mixes layout, data fetching, interaction logic, and dense markup becomes impossible to maintain.

### When to split a screen

Split a route file when:

- It exceeds 150-200 lines
- It renders 3+ visually distinct sections
- It mixes data fetching, state management, and rendering in the same function
- It contains inline helper components that could stand alone
- Multiple developers need to work on different parts of the same screen

### How to split

1. **Identify visual sections.** Each major block of the screen becomes a screen section component.
2. **Extract to `components/screens/`.** Each section gets a `.screen.tsx` file.
3. **Move data fetching into the section** or into a domain hook.
4. **Keep the route file as a composition root.**

### Before: Monolithic screen

```tsx
// app/(tabs)/profile.tsx — 400+ lines
export default function ProfileScreen() {
  const { user, isLoading } = useProfile();
  const { posts, loadMore } = useUserPosts(user?.id);
  const [activeTab, setActiveTab] = useState("posts");

  if (isLoading) return <LoadingOverlay />;

  return (
    <ScrollView>
      {/* 50 lines of header markup */}
      <View>
        <Image source={{ uri: user.avatar }} />
        <Text>{user.name}</Text>
        <Text>{user.bio}</Text>
        <View style={styles.statsRow}>
          {/* 30 lines of stats */}
        </View>
        <Button title="Edit Profile" onPress={...} />
      </View>

      {/* 40 lines of tab bar */}
      <View style={styles.tabs}>
        {/* tab buttons */}
      </View>

      {/* 100+ lines of content based on active tab */}
      {activeTab === "posts" && (
        <FlatList data={posts} renderItem={...} />
      )}
      {activeTab === "saved" && (
        <SavedItemsList userId={user.id} />
      )}

      {/* 50 lines of footer */}
    </ScrollView>
  );
}
```

### After: Composed screen

```tsx
// app/(tabs)/profile.tsx — 20 lines
import { ScreenContainer } from "@/components/ui/screen-container";
import { ProfileHeader } from "@/components/screens/profile-header.screen";
import { ProfileTabs } from "@/components/screens/profile-tabs.screen";

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ProfileHeader />
      <ProfileTabs />
    </ScreenContainer>
  );
}
```

```tsx
// components/screens/profile-header.screen.tsx
import { View, Text, Image, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/profile/use-profile.hook";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeader() {
  const { user, isLoading } = useProfile();

  if (isLoading) return <ProfileHeaderSkeleton />;

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      <ProfileStats followers={user.followers} following={user.following} posts={user.postCount} />
      <Button title="Edit Profile" onPress={() => {}} variant="secondary" />
    </View>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width="60%" height={20} />
      <Skeleton width="80%" height={16} />
    </View>
  );
}
```

### Splitting rules

1. **Each section owns its loading and error states.** Do not hoist all loading states to the parent screen.
2. **Sections receive minimal props.** Ideally zero — they fetch their own data via hooks.
3. **Name sections by screen + role:** `profile-header.screen.tsx`, `profile-tabs.screen.tsx`.
4. **Keep the route file under 30 lines** after splitting.
5. **Do not split prematurely.** A screen with one section and 100 lines is fine as-is.

### FlatList and SectionList screens

For screens dominated by a single list, the route file may own the list directly. Split when:

- The list has a complex header that justifies extraction
- The list item renderer exceeds 50 lines
- The screen has both a list and non-list content

```tsx
// Keep list in route when it IS the screen
export default function OrdersScreen() {
  const { orders, isLoading } = useOrders();
  return (
    <FlatList
      data={orders}
      renderItem={({ item }) => <OrderCard order={item} />}
      ListEmptyComponent={<EmptyState title="No orders yet" />}
    />
  );
}
```
