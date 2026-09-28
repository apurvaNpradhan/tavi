import { markAsElement } from "../element-marker.mjs";
import { withMargin } from "./utils/spaces.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/heading/heading.tsx
const Heading = React$1.forwardRef(({ as: Tag = "h1", children, style, m, mx, my, mt, mr, mb, ml, ...props }, ref) => {
	return /* @__PURE__ */ jsx(Tag, {
		...props,
		ref,
		style: {
			...withMargin({
				m,
				mx,
				my,
				mt,
				mr,
				mb,
				ml
			}),
			...style
		},
		children
	});
});
Heading.displayName = "Heading";
markAsElement(Heading);
//#endregion
export { Heading };
