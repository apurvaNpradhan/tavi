import * as React$1 from "react";

//#region src/components/element-marker.d.ts
interface ResolvedTailwind {
  style: React$1.CSSProperties;
  className: string | undefined;
  classProperties: Record<string, string[]>;
}
interface ElementOptions<Props = object> {
  resolveTailwind?: (props: Props, resolved: ResolvedTailwind) => Props;
}
declare const markAsElement: <Props>(component: unknown, options?: ElementOptions<Props>) => void;
//#endregion
export { ElementOptions, ResolvedTailwind, markAsElement };