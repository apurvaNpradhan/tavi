import { PrismLanguage } from "./languages-available.mjs";
import { Theme } from "./themes.mjs";
import * as React$1 from "react";

//#region src/components/code-block/code-block.d.ts
interface CodeBlockProps extends React$1.ComponentPropsWithoutRef<'pre'> {
  lineNumbers?: boolean;
  /**
   * This applies a certain font family on all elements render in this component,
   * it is mostly meant to override a global font that has already been used with
   * our `<Font>` component
   */
  fontFamily?: string;
  theme: Theme;
  language: PrismLanguage;
  code: string;
}
declare const CodeBlock: React$1.ForwardRefExoticComponent<CodeBlockProps & React$1.RefAttributes<HTMLPreElement>>;
//#endregion
export { CodeBlock, CodeBlockProps };