---
name: React Hook Form + Zod + shadcn/ui
description: Complete guide to building type-safe forms with react-hook-form v7, Zod v4, and shadcn/ui Form components
version: 1.0.0
type: skill
tags: [react, forms, zod, shadcn-ui, validation, typescript]
category: Forms
author: agent-skills
---

# React Hook Form + Zod + shadcn/ui

Build production-grade, type-safe forms using react-hook-form v7, Zod v4 schema validation, and shadcn/ui Form primitives. All examples use TypeScript.

---

## 1. Setting Up react-hook-form with Zod v4 Resolver

### Installation

```bash
pnpm add react-hook-form @hookform/resolvers zod
npx shadcn@latest add form input label select checkbox textarea switch radio-group
```

### Basic Form Setup

```tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 1. Define schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
});

// 2. Infer TypeScript type from schema
type ContactFormValues = z.infer<typeof contactSchema>;

// 3. Build the form
export function ContactForm() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    console.log("Valid form data:", data);
    // data is fully typed: { name: string; email: string; phone?: string; message: string }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormDescription>We will never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Your message..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 2. Creating Type-Safe Form Schemas with Zod v4

### Common Schema Patterns

```tsx
import { z } from "zod/v4";

// String validations
const userSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, hyphens, and underscores"),
  email: z.email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  age: z.number().int().min(13, "Must be at least 13 years old").max(120),
  website: z.url("Invalid URL").optional(),
});

// Enum and literal unions
const roleSchema = z.enum(["admin", "editor", "viewer"]);

// Discriminated unions
const notificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    emailAddress: z.email(),
    frequency: z.enum(["daily", "weekly", "monthly"]),
  }),
  z.object({
    type: z.literal("sms"),
    phoneNumber: z.string().min(10),
  }),
  z.object({
    type: z.literal("push"),
    deviceToken: z.string(),
  }),
]);

// Refinements for cross-field validation
const passwordFormSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Transform values
const priceSchema = z.object({
  amount: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().positive("Amount must be positive")),
  currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
});

// Conditional fields with superRefine
const registrationSchema = z
  .object({
    accountType: z.enum(["personal", "business"]),
    companyName: z.string().optional(),
    taxId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "business") {
      if (!data.companyName || data.companyName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name is required for business accounts",
          path: ["companyName"],
        });
      }
      if (!data.taxId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tax ID is required for business accounts",
          path: ["taxId"],
        });
      }
    }
  });
```

---

## 3. Integrating with shadcn/ui Form Component

### Select Field

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox Field

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<FormField
  control={form.control}
  name="acceptTerms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Accept terms and conditions</FormLabel>
        <FormDescription>
          You agree to our Terms of Service and Privacy Policy.
        </FormDescription>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Switch Field

```tsx
import { Switch } from "@/components/ui/switch";

<FormField
  control={form.control}
  name="notifications"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Email Notifications</FormLabel>
        <FormDescription>Receive emails about account activity.</FormDescription>
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```

---

## 4. Field-Level and Form-Level Validation

### Field-Level Custom Validation

```tsx
<FormField
  control={form.control}
  name="slug"
  render={({ field }) => (
    <FormItem>
      <FormLabel>URL Slug</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
  rules={{
    validate: {
      noSpaces: (value: string) =>
        !value.includes(" ") || "Slug cannot contain spaces",
      noUppercase: (value: string) =>
        value === value.toLowerCase() || "Slug must be lowercase",
    },
  }}
/>
```

### Form-Level Validation with Zod refine

```tsx
const checkoutSchema = z
  .object({
    shippingMethod: z.enum(["standard", "express", "pickup"]),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    pickupLocation: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethod !== "pickup") {
      if (!data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address is required for delivery",
          path: ["address"],
        });
      }
      if (!data.city) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required for delivery",
          path: ["city"],
        });
      }
      if (!data.zip) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ZIP code is required for delivery",
          path: ["zip"],
        });
      }
    } else {
      if (!data.pickupLocation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a pickup location",
          path: ["pickupLocation"],
        });
      }
    }
  });
```

---

## 5. Async Validation Patterns

```tsx
const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .refine(
      async (username) => {
        const response = await fetch(`/api/check-username?q=${username}`);
        const { available } = await response.json();
        return available;
      },
      { message: "Username is already taken" }
    ),
  email: z.email(),
});

// Form with async validation and debounce
export function SignupForm() {
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "" },
    mode: "onBlur", // Validate on blur to avoid too many async calls
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input {...field} />
                  {form.formState.isValidating && (
                    <Spinner className="absolute right-3 top-2.5 h-4 w-4" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
```

---

## 6. Dynamic Form Fields (useFieldArray)

```tsx
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

const invoiceSchema = z.object({
  client: z.string().min(1, "Client name is required"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().int().min(1, "Minimum quantity is 1"),
        unitPrice: z.number().min(0.01, "Price must be positive"),
      })
    )
    .min(1, "At least one line item is required"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceForm() {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const total = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <FormControl>
                <Input placeholder="Client name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-5">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Description</FormLabel>}
                      <FormControl>
                        <Input placeholder="Item description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Qty</FormLabel>}
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Unit Price</FormLabel>}
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2 flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className={index === 0 ? "mt-8" : ""}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {form.formState.errors.items?.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.items.root.message}
            </p>
          )}
        </div>

        <div className="text-right text-lg font-semibold">
          Total: ${total.toFixed(2)}
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Create Invoice
        </Button>
      </form>
    </Form>
  );
}
```

---

## 7. Multi-Step Forms with Schema Composition

```tsx
import { z } from "zod/v4";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Step schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email"),
});

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
});

const preferencesSchema = z.object({
  newsletter: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
});

// Composed full schema
const fullSchema = personalInfoSchema.merge(addressSchema).merge(preferencesSchema);
type FullFormValues = z.infer<typeof fullSchema>;

// Step schemas array for per-step validation
const stepSchemas = [personalInfoSchema, addressSchema, preferencesSchema] as const;

const STEPS = ["Personal Info", "Address", "Preferences"] as const;

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FullFormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      newsletter: false,
      theme: "system",
      language: "en",
    },
    mode: "onTouched",
  });

  const nextStep = async () => {
    // Validate only the current step's fields
    const currentSchema = stepSchemas[currentStep];
    const fields = Object.keys(currentSchema.shape) as (keyof FullFormValues)[];
    const isValid = await form.trigger(fields);

    if (isValid) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = async (data: FullFormValues) => {
    console.log("Complete form data:", data);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Step indicator */}
        <nav aria-label="Form steps" className="flex gap-2">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex-1 rounded-full h-2 ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </nav>

        <h2 className="text-xl font-semibold">{STEPS[currentStep]}</h2>

        {/* Step content */}
        {currentStep === 0 && <PersonalInfoStep />}
        {currentStep === 1 && <AddressStep />}
        {currentStep === 2 && <PreferencesStep />}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Complete"}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
```

---

## 8. Error Message Customization

```tsx
import { z } from "zod/v4";

// Custom error map for the entire form
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  // Handle specific issue codes
  if (issue.code === z.ZodIssueCode.too_small && issue.minimum === 1) {
    return { message: "This field is required" };
  }
  if (issue.code === z.ZodIssueCode.invalid_type && issue.expected === "string") {
    return { message: "Please enter a valid value" };
  }
  // Fall back to default
  return { message: ctx.defaultError };
};

// Apply globally
z.config({ customError: customErrorMap });

// Or per-schema with custom messages
const formSchema = z.object({
  age: z
    .number({ error: "Please enter a valid number" })
    .int("Age must be a whole number")
    .min(18, "You must be at least 18 years old")
    .max(120, "Please enter a valid age"),
  email: z.email("Please enter a valid email address"),
});
```

---

## 9. File Upload Handling

```tsx
import { z } from "zod/v4";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, "Please select an image")
    .refine(
      (files) => files[0]?.size <= MAX_FILE_SIZE,
      "Image must be less than 5MB"
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Only .jpg, .png, and .webp formats are supported"
    ),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadForm() {
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: "" },
  });

  const imageRef = form.register("image");

  async function onSubmit(data: UploadFormValues) {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("image", data.image[0]);

    await fetch("/api/upload", { method: "POST", body: formData });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} {...imageRef} />
              </FormControl>
              <FormDescription>Max 5MB. JPG, PNG, or WebP.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Upload
        </Button>
      </form>
    </Form>
  );
}
```

---

## Quick Reference

| Feature | Approach |
|---------|----------|
| Schema definition | `z.object({...})` with Zod v4 |
| Type inference | `z.infer<typeof schema>` |
| Resolver | `zodResolver(schema)` from `@hookform/resolvers/zod` |
| Field rendering | `<FormField>` with render prop |
| Dynamic arrays | `useFieldArray` from react-hook-form |
| Multi-step | Schema composition + `form.trigger(fields)` |
| Async validation | `z.string().refine(async () => ...)` |
| File uploads | `z.instanceof(FileList)` + `form.register()` |
| Cross-field validation | `schema.refine()` or `schema.superRefine()` |
