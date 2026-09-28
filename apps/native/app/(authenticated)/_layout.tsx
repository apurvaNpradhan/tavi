import { Stack } from "expo-router";

/** Orders authenticated navigation with tabs first and workspace routes as siblings. */
export default function AuthenticatedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="workspace-picker" />
      <Stack.Screen name="workspace/[slug]" />
    </Stack>
  );
}
