import * as React$1 from "react";
import { Config } from "tailwindcss";

//#region src/components/tailwind/tailwind.d.ts
type TailwindConfig = Omit<Config, 'content'>;
interface EmailElementProps {
  children?: React$1.ReactNode;
  className?: string;
  style?: React$1.CSSProperties;
}
declare const pixelBasedPreset: TailwindConfig;
interface TailwindProps {
  children: React$1.ReactNode;
  config?: TailwindConfig;
  theme?: string;
  utility?: string;
}
declare function Tailwind({
  children,
  config,
  theme,
  utility
}: TailwindProps): React$1.ReactNode;
//#endregion
export { EmailElementProps, Tailwind, TailwindConfig, TailwindProps, pixelBasedPreset };