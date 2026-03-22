---
name: shadcn-shared-form-fields
description: Reusable, type-safe form field components wrapping shadcn/ui primitives with react-hook-form useFormContext
version: 1.0.0
type: skill
tags: [react, shadcn-ui, forms, react-hook-form, typescript, components]
category: Forms
author: agent-skills
---

# shadcn/ui Shared Form Fields

Create a library of reusable form field components that wrap shadcn/ui primitives with react-hook-form's `useFormContext`. These components eliminate boilerplate while maintaining full type safety, consistent styling, and accessible error handling.

---

## 1. Base FormFieldWrapper

A shared wrapper that handles the common label, description, and error message layout for all field types.

```tsx
// components/form-fields/form-field-wrapper.tsx
"use client";

import { type ReactNode } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

export interface BaseFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

interface FormFieldWrapperProps<T extends FieldValues> extends BaseFieldProps<T> {
  children: (field: any) => ReactNode;
}

export function FormFieldWrapper<T extends FieldValues>({
  name,
  label,
  description,
  className,
  required,
  children,
}: FormFieldWrapperProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>{children(field)}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

---

## 2. FormInput

A reusable text input field supporting all standard HTML input types.

```tsx
// components/form-fields/form-input.tsx
"use client";

import { type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormFieldWrapper, type BaseFieldProps } from "./form-field-wrapper";

interface FormInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  autoComplete?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: FormInputProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
      className={className}
      required={required}
    >
      {(field) => (
        <Input
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          {...field}
          onChange={(e) => {
            if (type === "number") {
              const val = e.target.value;
              field.onChange(val === "" ? undefined : parseFloat(val));
            } else {
              field.onChange(e);
            }
          }}
        />
      )}
    </FormFieldWrapper>
  );
}
```

### Usage

```tsx
import { FormInput } from "@/components/form-fields/form-input";

// Inside a FormProvider context
<FormInput<MyFormValues>
  name="email"
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  description="We'll never share your email."
  required
/>

<FormInput<MyFormValues>
  name="age"
  label="Age"
  type="number"
  placeholder="25"
/>
```

---

## 3. FormTextarea

```tsx
// components/form-fields/form-textarea.tsx
"use client";

import { type FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldWrapper, type BaseFieldProps } from "./form-field-wrapper";

interface FormTextareaProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder,
  rows = 4,
  maxLength,
  showCount = false,
}: FormTextareaProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
      className={className}
      required={required}
    >
      {(field) => (
        <div className="relative">
          <Textarea
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            {...field}
          />
          {showCount && maxLength && (
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {(field.value as string)?.length ?? 0}/{maxLength}
            </span>
          )}
        </div>
      )}
    </FormFieldWrapper>
  );
}
```

### Usage

```tsx
<FormTextarea<MyFormValues>
  name="bio"
  label="Biography"
  placeholder="Tell us about yourself..."
  rows={6}
  maxLength={500}
  showCount
  required
/>
```

---

## 4. FormSelect

```tsx
// components/form-fields/form-select.tsx
"use client";

import { type FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldWrapper, type BaseFieldProps } from "./form-field-wrapper";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FormSelectProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  options: SelectOption[];
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder = "Select an option",
  options,
}: FormSelectProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
      className={className}
      required={required}
    >
      {(field) => (
        <Select
          onValueChange={field.onChange}
          value={field.value}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormFieldWrapper>
  );
}
```

### Usage

```tsx
<FormSelect<MyFormValues>
  name="country"
  label="Country"
  placeholder="Select your country"
  required
  options={[
    { label: "United States", value: "us" },
    { label: "Canada", value: "ca" },
    { label: "United Kingdom", value: "uk" },
  ]}
/>
```

---

## 5. FormCheckbox

```tsx
// components/form-fields/form-checkbox.tsx
"use client";

import { type FieldValues, useFormContext, type Path } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
}: FormCheckboxProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={`flex flex-row items-start space-x-3 space-y-0 ${className ?? ""}`}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="cursor-pointer">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Usage

```tsx
<FormCheckbox<MyFormValues>
  name="acceptTerms"
  label="I accept the terms and conditions"
  description="You agree to our Terms of Service and Privacy Policy."
/>
```

---

## 6. FormRadioGroup

```tsx
// components/form-fields/form-radio-group.tsx
"use client";

import { type FieldValues, useFormContext, type Path } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface FormRadioGroupProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  options: RadioOption[];
  orientation?: "horizontal" | "vertical";
}

export function FormRadioGroup<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  options,
  orientation = "vertical",
}: FormRadioGroupProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
              className={
                orientation === "horizontal"
                  ? "flex flex-row gap-4"
                  : "flex flex-col gap-3"
              }
            >
              {options.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-start space-x-3 space-y-0"
                >
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel className="cursor-pointer font-normal">
                      {option.label}
                    </FormLabel>
                    {option.description && (
                      <FormDescription>{option.description}</FormDescription>
                    )}
                  </div>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Usage

```tsx
<FormRadioGroup<MyFormValues>
  name="plan"
  label="Select Plan"
  required
  options={[
    { label: "Free", value: "free", description: "Up to 5 projects" },
    { label: "Pro", value: "pro", description: "Unlimited projects" },
    { label: "Enterprise", value: "enterprise", description: "Custom limits" },
  ]}
/>
```

---

## 7. FormSwitch

```tsx
// components/form-fields/form-switch.tsx
"use client";

import { type FieldValues, useFormContext, type Path } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

interface FormSwitchProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
}: FormSwitchProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`flex flex-row items-center justify-between rounded-lg border p-4 ${className ?? ""}`}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Usage

```tsx
<FormSwitch<MyFormValues>
  name="emailNotifications"
  label="Email Notifications"
  description="Receive email updates about your account activity."
/>
```

---

## 8. FormCombobox

An autocomplete/searchable select field using shadcn/ui's Command (Popover + Command).

```tsx
// components/form-fields/form-combobox.tsx
"use client";

import { useState } from "react";
import { type FieldValues, useFormContext, type Path } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

interface ComboboxOption {
  label: string;
  value: string;
}

interface FormComboboxProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxOption[];
}

export function FormCombobox<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  options,
}: FormComboboxProps<T>) {
  const { control } = useFormContext<T>();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className={cn(
                  "w-full justify-between font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value
                  ? options.find((o) => o.value === field.value)?.label
                  : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{emptyText}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          field.onChange(
                            option.value === field.value ? "" : option.value
                          );
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === option.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Usage

```tsx
<FormCombobox<MyFormValues>
  name="framework"
  label="Framework"
  placeholder="Select a framework..."
  searchPlaceholder="Search frameworks..."
  required
  options={[
    { label: "Next.js", value: "nextjs" },
    { label: "Remix", value: "remix" },
    { label: "Astro", value: "astro" },
    { label: "SvelteKit", value: "sveltekit" },
  ]}
/>
```

---

## 9. FormDatePicker

```tsx
// components/form-fields/form-date-picker.tsx
"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type FieldValues, useFormContext, type Path } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

interface FormDatePickerProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  fromDate?: Date;
  toDate?: Date;
}

export function FormDatePicker<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder = "Pick a date",
  fromDate,
  toDate,
}: FormDatePickerProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? format(field.value, "PPP") : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={disabled}
                fromDate={fromDate}
                toDate={toDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Usage

```tsx
<FormDatePicker<MyFormValues>
  name="birthDate"
  label="Date of Birth"
  required
  toDate={new Date()} // Can't select future dates
/>
```

---

## 10. Barrel Export and Complete Example

### Barrel Export

```tsx
// components/form-fields/index.ts
export { FormFieldWrapper, type BaseFieldProps } from "./form-field-wrapper";
export { FormInput } from "./form-input";
export { FormTextarea } from "./form-textarea";
export { FormSelect, type SelectOption } from "./form-select";
export { FormCheckbox } from "./form-checkbox";
export { FormRadioGroup } from "./form-radio-group";
export { FormSwitch } from "./form-switch";
export { FormCombobox } from "./form-combobox";
export { FormDatePicker } from "./form-date-picker";
```

### Complete Form Example

```tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
  FormSwitch,
  FormCombobox,
  FormDatePicker,
} from "@/components/form-fields";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email"),
  bio: z.string().max(500).optional(),
  role: z.enum(["admin", "editor", "viewer"]),
  plan: z.enum(["free", "pro", "enterprise"]),
  country: z.string().min(1, "Country is required"),
  birthDate: z.date({ error: "Please select a date" }),
  newsletter: z.boolean().default(false),
  darkMode: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      role: "viewer",
      plan: "free",
      country: "",
      newsletter: false,
      darkMode: false,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    await saveProfile(data);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormInput<ProfileFormValues> name="name" label="Full Name" required />
        <FormInput<ProfileFormValues> name="email" label="Email" type="email" required />
        <FormTextarea<ProfileFormValues>
          name="bio"
          label="Bio"
          maxLength={500}
          showCount
        />
        <FormSelect<ProfileFormValues>
          name="role"
          label="Role"
          required
          options={[
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" },
          ]}
        />
        <FormRadioGroup<ProfileFormValues>
          name="plan"
          label="Plan"
          required
          options={[
            { label: "Free", value: "free" },
            { label: "Pro", value: "pro" },
            { label: "Enterprise", value: "enterprise" },
          ]}
        />
        <FormCombobox<ProfileFormValues>
          name="country"
          label="Country"
          required
          options={[
            { label: "United States", value: "us" },
            { label: "Canada", value: "ca" },
            { label: "United Kingdom", value: "uk" },
          ]}
        />
        <FormDatePicker<ProfileFormValues>
          name="birthDate"
          label="Date of Birth"
          required
          toDate={new Date()}
        />
        <FormCheckbox<ProfileFormValues>
          name="newsletter"
          label="Subscribe to newsletter"
        />
        <FormSwitch<ProfileFormValues>
          name="darkMode"
          label="Dark Mode"
          description="Use dark theme across the application."
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </FormProvider>
  );
}
```

---

## Summary

| Component        | shadcn/ui Primitive | Key Feature                              |
| ---------------- | ------------------- | ---------------------------------------- |
| `FormInput`      | Input               | Auto number parsing, all input types     |
| `FormTextarea`   | Textarea            | Character count, max length              |
| `FormSelect`     | Select              | Option array, placeholder                |
| `FormCheckbox`   | Checkbox            | Inline label + description layout        |
| `FormRadioGroup` | RadioGroup          | Horizontal/vertical, option descriptions |
| `FormSwitch`     | Switch              | Card-style layout with description       |
| `FormCombobox`   | Command + Popover   | Searchable, autocomplete                 |
| `FormDatePicker` | Calendar + Popover  | Date range constraints                   |

All components use `useFormContext` so they work inside any `FormProvider` without explicit `control` passing.
