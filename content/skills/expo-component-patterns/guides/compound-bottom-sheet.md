---
title: Bottom Sheet Compound Component
impact: HIGH
tags: compound, bottom-sheet, gorhom, context, composition
---

## Bottom Sheet Compound Component

A compound bottom sheet shares open/close state through context, letting consumers compose handles, content, and backdrops flexibly.

### Context Setup

```tsx
import { createContext, use, useCallback, useRef, type ReactNode } from "react";
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetModal,
} from "@gorhom/bottom-sheet";

interface BottomSheetContextValue {
  open: () => void;
  close: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

function useBottomSheet() {
  const ctx = use(BottomSheetContext);
  if (!ctx) throw new Error("BottomSheet components must be inside BottomSheet.Root");
  return ctx;
}
```

### Root Component

```tsx
interface RootProps {
  children: ReactNode;
  snapPoints?: string[];
}

function Root({ children, snapPoints = ["25%", "50%"] }: RootProps) {
  const ref = useRef<BottomSheetModal>(null);

  const open = useCallback(() => ref.current?.expand(), []);
  const close = useCallback(() => ref.current?.close(), []);

  return (
    <BottomSheetContext value={{ open, close }}>
      <BottomSheetLib
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
      </BottomSheetLib>
    </BottomSheetContext>
  );
}
```

### Trigger and Content

```tsx
function Trigger({ children }: { children: ReactNode }) {
  const { open } = useBottomSheet();
  return <Pressable onPress={open}>{children}</Pressable>;
}

function Content({ children }: { children: ReactNode }) {
  return <View style={{ padding: 16 }}>{children}</View>;
}

function CloseButton({ children }: { children?: ReactNode }) {
  const { close } = useBottomSheet();
  return (
    <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close">
      {children ?? <Text>Close</Text>}
    </Pressable>
  );
}
```

### Attach and Usage

```tsx
const BottomSheet = { Root, Trigger, Content, CloseButton };

function Demo() {
  return (
    <BottomSheet.Root snapPoints={["30%"]}>
      <BottomSheet.Trigger>
        <Text>Open Sheet</Text>
      </BottomSheet.Trigger>
      <BottomSheet.Content>
        <Text>Sheet content here</Text>
        <BottomSheet.CloseButton />
      </BottomSheet.Content>
    </BottomSheet.Root>
  );
}
```
