---
name: shadcn/ui Dialog Builder
description: Comprehensive patterns for building confirmation, form, wizard, and responsive dialogs with shadcn/ui and TypeScript
version: 1.0.0
type: skill
tags: [react, shadcn-ui, dialog, modal, typescript, patterns]
category: UI Components
author: agent-skills
---

# shadcn/ui Dialog Builder

Production-ready dialog patterns using shadcn/ui Dialog, AlertDialog, and Drawer components. All examples use TypeScript and React 19+.

---

## 1. Confirmation Dialog (AlertDialog Pattern)

A reusable confirmation dialog for destructive or important actions.

```tsx
// components/dialogs/confirm-dialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" })
            )}
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Usage

```tsx
function DeleteButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteItem(itemId);
    setIsDeleting(false);
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Item"
        description="This action cannot be undone. This will permanently delete the item and all associated data."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
```

---

## 2. Form Dialog with Validation

A dialog containing a validated form that submits and closes on success.

```tsx
// components/dialogs/form-dialog.tsx
"use client";

import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">{children}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Usage with react-hook-form

```tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { FormInput, FormSelect } from "@/components/form-fields";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: CreateUserValues) => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "viewer" },
  });

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const data = form.getValues();
    await createUser(data);
    onSuccess(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) form.reset();
        onOpenChange(val);
      }}
      title="Create User"
      description="Add a new user to the workspace."
      onSubmit={handleSubmit}
      isSubmitting={form.formState.isSubmitting}
      submitLabel="Create User"
    >
      <FormProvider {...form}>
        <div className="space-y-4">
          <FormInput<CreateUserValues> name="name" label="Name" required />
          <FormInput<CreateUserValues> name="email" label="Email" type="email" required />
          <FormSelect<CreateUserValues>
            name="role"
            label="Role"
            required
            options={[
              { label: "Admin", value: "admin" },
              { label: "Editor", value: "editor" },
              { label: "Viewer", value: "viewer" },
            ]}
          />
        </div>
      </FormProvider>
    </FormDialog>
  );
}
```

---

## 3. Multi-Step Wizard Dialog

A dialog with multiple steps, progress tracking, and per-step validation.

```tsx
// components/dialogs/wizard-dialog.tsx
"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WizardStep {
  title: string;
  description?: string;
  content: ReactNode;
  validate?: () => Promise<boolean> | boolean;
}

interface WizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  isSubmitting?: boolean;
}

export function WizardDialog({
  open,
  onOpenChange,
  title,
  steps,
  onComplete,
  isSubmitting = false,
}: WizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (step.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }

    if (isLastStep) {
      await onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setCurrentStep(0);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {step.description && (
            <DialogDescription>{step.description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pb-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i < currentStep && "bg-primary text-primary-foreground",
                  i === currentStep && "border-2 border-primary text-primary",
                  i > currentStep && "border border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {i < currentStep ? "\u2713" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8",
                    i < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h3 className="text-lg font-semibold">{step.title}</h3>

        {/* Step content */}
        <div className="py-2">{step.content}</div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!isFirstStep && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isLastStep
              ? isSubmitting
                ? "Completing..."
                : "Complete"
              : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Usage

```tsx
function OnboardingWizard() {
  const [open, setOpen] = useState(true);
  const form = useForm<OnboardingValues>({ /* ... */ });

  return (
    <WizardDialog
      open={open}
      onOpenChange={setOpen}
      title="Welcome! Let's get started"
      steps={[
        {
          title: "Your Profile",
          description: "Tell us about yourself",
          content: <ProfileStep />,
          validate: () => form.trigger(["name", "email"]),
        },
        {
          title: "Your Team",
          description: "Set up your workspace",
          content: <TeamStep />,
          validate: () => form.trigger(["teamName"]),
        },
        {
          title: "Preferences",
          description: "Customize your experience",
          content: <PreferencesStep />,
        },
      ]}
      onComplete={async () => {
        await saveOnboarding(form.getValues());
        setOpen(false);
      }}
    />
  );
}
```

---

## 4. Async Action Dialog with Loading States

A dialog that handles async operations with loading, success, and error states.

```tsx
// components/dialogs/async-action-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type DialogState = "idle" | "loading" | "success" | "error";

interface AsyncActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  action: () => Promise<void>;
  confirmLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  variant?: "default" | "destructive";
}

export function AsyncActionDialog({
  open,
  onOpenChange,
  title,
  description,
  action,
  confirmLabel = "Confirm",
  successMessage = "Action completed successfully.",
  errorMessage = "Something went wrong. Please try again.",
  variant = "default",
}: AsyncActionDialogProps) {
  const [state, setState] = useState<DialogState>("idle");

  const handleAction = async () => {
    setState("loading");
    try {
      await action();
      setState("success");
      setTimeout(() => {
        onOpenChange(false);
        setState("idle");
      }, 1500);
    } catch {
      setState("error");
    }
  };

  const handleClose = (val: boolean) => {
    if (state === "loading") return; // Prevent closing during action
    onOpenChange(val);
    if (!val) setState("idle");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {state === "idle" && (
          <>
            <DialogDescription>{description}</DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button variant={variant} onClick={handleAction}>
                {confirmLabel}
              </Button>
            </DialogFooter>
          </>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing...</p>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive">{errorMessage}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleAction}>Retry</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Controlled Dialog State Management

A centralized approach for managing multiple dialogs in a page.

```tsx
// hooks/use-dialog.ts
"use client";

import { useState, useCallback } from "react";

interface UseDialogReturn<T = undefined> {
  isOpen: boolean;
  data: T | undefined;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useDialog<T = undefined>(): UseDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((data?: T) => {
    setData(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data so exit animation can use it
    setTimeout(() => setData(undefined), 300);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) setIsOpen(true);
      else close();
    },
    [close]
  );

  return { isOpen, data, open, close, toggle, onOpenChange };
}
```

### Usage

```tsx
function UsersPage() {
  const createDialog = useDialog();
  const editDialog = useDialog<User>();
  const deleteDialog = useDialog<{ id: string; name: string }>();

  return (
    <div>
      <Button onClick={() => createDialog.open()}>Create User</Button>

      <UserTable
        onEdit={(user) => editDialog.open(user)}
        onDelete={(user) => deleteDialog.open({ id: user.id, name: user.name })}
      />

      <CreateUserDialog
        open={createDialog.isOpen}
        onOpenChange={createDialog.onOpenChange}
      />

      {editDialog.data && (
        <EditUserDialog
          open={editDialog.isOpen}
          onOpenChange={editDialog.onOpenChange}
          user={editDialog.data}
        />
      )}

      {deleteDialog.data && (
        <ConfirmDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.onOpenChange}
          title={`Delete ${deleteDialog.data.name}?`}
          description="This action cannot be undone."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={() => deleteUser(deleteDialog.data!.id)}
        />
      )}
    </div>
  );
}
```

---

## 6. Dialog with Data Fetching

A dialog that fetches data when opened, with loading and error states.

```tsx
// components/dialogs/data-dialog.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface DataDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fetchData: () => Promise<T>;
  children: (data: T) => ReactNode;
  loadingFallback?: ReactNode;
}

export function DataDialog<T>({
  open,
  onOpenChange,
  title,
  fetchData,
  children,
  loadingFallback,
}: DataDialogProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    setError(null);

    fetchData()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setIsLoading(false));
  }, [open, fetchData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          loadingFallback ?? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          )
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && !isLoading && !error && children(data)}
      </DialogContent>
    </Dialog>
  );
}

// Usage
function UserDetailDialog({ userId, ...props }: { userId: string } & DialogProps) {
  return (
    <DataDialog<UserDetail>
      {...props}
      title="User Details"
      fetchData={useCallback(() => fetchUserDetail(userId), [userId])}
    >
      {(user) => (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Joined</p>
            <p className="font-medium">{format(user.createdAt, "PPP")}</p>
          </div>
        </div>
      )}
    </DataDialog>
  );
}
```

---

## 7. Nested / Stacked Dialogs

Handle stacking dialogs where one dialog opens another.

```tsx
// components/dialogs/stacked-dialog-example.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";

export function EditItemDialog({ open, onOpenChange, item }: EditItemDialogProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleClose = (val: boolean) => {
    if (!val && hasChanges) {
      // Show confirmation before closing if there are unsaved changes
      setShowConfirm(true);
      return;
    }
    onOpenChange(val);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-lg"
          onPointerDownOutside={(e) => {
            if (hasChanges) e.preventDefault(); // Prevent closing on outside click
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit {item.name}</DialogTitle>
          </DialogHeader>

          {/* Form fields that set hasChanges on change */}
          <div className="py-4">
            <input
              defaultValue={item.name}
              onChange={() => setHasChanges(true)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={() => { /* save */ onOpenChange(false); }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested confirmation dialog */}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to close?"
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={() => {
          setShowConfirm(false);
          setHasChanges(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
```

---

## 8. Responsive Dialog (Drawer on Mobile, Dialog on Desktop)

Use shadcn/ui Drawer on mobile and Dialog on desktop, with a unified API.

```tsx
// components/dialogs/responsive-dialog.tsx
"use client";

import { type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4">{children}</div>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}

// The useMediaQuery hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
```

### Usage

```tsx
function EditProfileDialog({ open, onOpenChange }: DialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Profile"
      description="Update your profile information."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Save Changes</Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        <Input placeholder="Name" />
        <Input placeholder="Email" />
        <Textarea placeholder="Bio" />
      </div>
    </ResponsiveDialog>
  );
}
```

---

## 9. useDialog Custom Hook -- Full API

Extended version of the hook with additional utilities.

```tsx
// hooks/use-dialog.ts
"use client";

import { useState, useCallback, useRef } from "react";

interface UseDialogOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

interface UseDialogReturn<T = undefined> {
  isOpen: boolean;
  data: T | undefined;
  open: T extends undefined ? () => void : (data: T) => void;
  close: () => void;
  toggle: () => void;
  onOpenChange: (open: boolean) => void;
  /** Returns props to spread on Dialog component */
  dialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
}

export function useDialog<T = undefined>(
  options?: UseDialogOptions
): UseDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(options?.defaultOpen ?? false);
  const [data, setData] = useState<T | undefined>(undefined);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const open = useCallback((...args: T extends undefined ? [] : [T]) => {
    if (args.length > 0) setData(args[0] as T);
    setIsOpen(true);
    callbacksRef.current?.onOpen?.();
  }, []) as UseDialogReturn<T>["open"];

  const close = useCallback(() => {
    setIsOpen(false);
    callbacksRef.current?.onClose?.();
    setTimeout(() => setData(undefined), 300);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) callbacksRef.current?.onOpen?.();
      else callbacksRef.current?.onClose?.();
      return next;
    });
  }, []);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setIsOpen(true);
        callbacksRef.current?.onOpen?.();
      } else {
        close();
      }
    },
    [close]
  );

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    onOpenChange,
    dialogProps: { open: isOpen, onOpenChange },
  };
}
```

### Usage with dialogProps spread

```tsx
function ProjectsPage() {
  const createDialog = useDialog({
    onClose: () => console.log("Dialog closed"),
  });
  const editDialog = useDialog<Project>();

  return (
    <div>
      <Button onClick={() => createDialog.open()}>New Project</Button>

      <ProjectList onEdit={(project) => editDialog.open(project)} />

      <Dialog {...createDialog.dialogProps}>
        <DialogContent>
          <DialogTitle>Create Project</DialogTitle>
          {/* form */}
        </DialogContent>
      </Dialog>

      <Dialog {...editDialog.dialogProps}>
        <DialogContent>
          <DialogTitle>Edit {editDialog.data?.name}</DialogTitle>
          {/* form pre-filled with editDialog.data */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Summary

| Pattern | Component | Best For |
|---------|-----------|----------|
| Confirmation | `ConfirmDialog` | Delete, logout, destructive actions |
| Form | `FormDialog` | Create/edit with validation |
| Wizard | `WizardDialog` | Multi-step onboarding, complex forms |
| Async Action | `AsyncActionDialog` | Import, export, long-running operations |
| Data Fetching | `DataDialog` | Detail views, previews |
| Nested | Stacked dialogs | Unsaved changes confirmation |
| Responsive | `ResponsiveDialog` | Mobile-friendly dialogs/drawers |
| State Management | `useDialog` hook | Centralized dialog state |
