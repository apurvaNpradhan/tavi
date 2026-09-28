import { Stack } from "expo-router";

/**
 * Signed-out routes.
 *
 * A nested stack keeps the welcome screen and the sign-in form as two screens
 * of one guard, so `router.push` between them animates and back works, while
 * the root layout still owns the single `(auth)` entry in its `Stack.Protected`.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
