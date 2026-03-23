---
title: Component Testing with RNTL
impact: LOW-MEDIUM
tags: testing, rntl, react-native-testing-library, components, unit
---

## Component Testing with React Native Testing Library

RNTL renders components in a simulated native environment, enabling tests that mirror user interactions without a device.

**Correct (component test with user interactions):**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { CounterCard } from "@/components/counter-card";

describe("CounterCard", () => {
  it("renders initial count", () => {
    render(<CounterCard initialCount={5} />);

    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("Counter")).toBeTruthy();
  });

  it("increments on press", () => {
    render(<CounterCard initialCount={0} />);

    fireEvent.press(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("calls onMaxReached when hitting limit", () => {
    const onMaxReached = jest.fn();
    render(<CounterCard initialCount={9} max={10} onMaxReached={onMaxReached} />);

    fireEvent.press(screen.getByRole("button", { name: "Increment" }));
    expect(onMaxReached).toHaveBeenCalledTimes(1);
  });
});
```

**Correct (testing async operations):**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ProfileScreen } from "@/components/screens/profile-screen";

// Mock the API
jest.mock("@/services/user/user.service", () => ({
  fetchUserProfile: jest.fn().mockResolvedValue({
    name: "Jane Doe",
    email: "jane@example.com",
  }),
}));

describe("ProfileScreen", () => {
  it("shows loading then profile data", async () => {
    render(<ProfileScreen userId="123" />);

    // Loading state
    expect(screen.getByTestId("loading-skeleton")).toBeTruthy();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeTruthy();
    });

    expect(screen.getByText("jane@example.com")).toBeTruthy();
    expect(screen.queryByTestId("loading-skeleton")).toBeNull();
  });
});
```

**Correct (testing form submission):**

```tsx
describe("ContactForm", () => {
  it("submits with valid data", async () => {
    const onSubmit = jest.fn();
    render(<ContactForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText("Name"), "John");
    fireEvent.changeText(screen.getByLabelText("Email"), "john@example.com");
    fireEvent.changeText(screen.getByLabelText("Message"), "Hello!");
    fireEvent.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "John",
        email: "john@example.com",
        message: "Hello!",
      });
    });
  });
});
```

Rules:
- Query by accessibility role and label first (`getByRole`, `getByLabelText`)
- Fall back to `getByTestId` for elements without semantic roles
- Use `waitFor` for any assertion after async operations
- Mock services, not components — test real rendering behavior
- Use `screen.queryBy*` (returns null) to assert absence
