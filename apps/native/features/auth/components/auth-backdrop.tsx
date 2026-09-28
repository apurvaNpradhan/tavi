import { View } from "react-native";

/**
 * Soft brand shapes behind the welcome screen.
 *
 * Purely decorative: the layer is hidden from assistive technology and never
 * takes a touch, so it can never sit between a finger and a button.
 */
export function AuthBackdrop() {
  return (
    <View
      className="absolute inset-0 overflow-hidden"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary opacity-5" />
      <View className="absolute -left-28 top-40 h-64 w-64 rounded-full bg-accent opacity-10" />
      <View className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-primary opacity-5" />
      <View className="absolute bottom-28 left-10 h-16 w-16 rounded-full border-2 border-primary opacity-10" />
    </View>
  );
}
