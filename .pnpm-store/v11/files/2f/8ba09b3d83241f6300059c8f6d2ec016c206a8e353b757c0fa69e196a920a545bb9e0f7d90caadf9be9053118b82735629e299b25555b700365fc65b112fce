import { TailwindConfig } from "../../tailwind.mjs";
import { StyleSheet } from "css-tree";

//#region src/components/tailwind/utils/tailwindcss/setup-tailwind.d.ts
type TailwindSetup = Awaited<ReturnType<typeof setupTailwind>>;
interface CSSConfigs {
  theme?: string;
  utility?: string;
}
interface SetupTailwindProps {
  config?: TailwindConfig;
  cssConfigs?: CSSConfigs;
}
declare function setupTailwind(props?: SetupTailwindProps): Promise<{
  addUtilities: (candidates: string[]) => void;
  getStyleSheet: () => StyleSheet;
}>;
//#endregion
export { TailwindSetup, setupTailwind };