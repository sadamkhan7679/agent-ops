---
title: E2E Testing with Detox
impact: LOW-MEDIUM
tags: detox, e2e, testing, automation, ios, android
---

## E2E Testing with Detox

Detox runs E2E tests on real simulators/emulators with native-level synchronization. Unlike Appium, it automatically waits for animations, network calls, and timers to settle.

**Correct (Detox test setup):**

```tsx
// e2e/login.test.ts
describe("Login Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should show login screen", async () => {
    await expect(element(by.id("login-screen"))).toBeVisible();
    await expect(element(by.id("email-input"))).toBeVisible();
    await expect(element(by.id("password-input"))).toBeVisible();
  });

  it("should show error for invalid credentials", async () => {
    await element(by.id("email-input")).typeText("bad@email.com");
    await element(by.id("password-input")).typeText("wrongpassword");
    await element(by.id("login-button")).tap();

    await expect(element(by.id("error-message"))).toBeVisible();
    await expect(element(by.text("Invalid credentials"))).toBeVisible();
  });

  it("should navigate to home on successful login", async () => {
    await element(by.id("email-input")).typeText("user@example.com");
    await element(by.id("password-input")).typeText("correctpassword");
    await element(by.id("login-button")).tap();

    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

**Correct (adding testID to components for Detox):**

```tsx
function LoginScreen() {
  return (
    <View testID="login-screen" style={styles.container}>
      <TextInput
        testID="email-input"
        placeholder="Email"
        accessibilityLabel="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        testID="password-input"
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
      />
      <Pressable testID="login-button" onPress={handleLogin}>
        <Text>Log In</Text>
      </Pressable>
      {error && (
        <Text testID="error-message" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
```

Rules:
- Add `testID` props to all interactive elements and key landmarks
- Use `waitFor(...).toBeVisible().withTimeout()` for async transitions
- Use `device.reloadReactNative()` in `beforeEach` for clean state
- Keep `testID` values kebab-case and descriptive
- Never use text matchers for dynamic content — use `testID` instead
