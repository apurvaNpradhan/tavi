import { markAsElement } from "../element-marker.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/link/link.tsx
const Link = React$1.forwardRef(({ target = "_blank", style, ...props }, ref) => /* @__PURE__ */ jsx("a", {
	...props,
	ref,
	style: {
		color: "#067df7",
		textDecorationLine: "none",
		...style
	},
	target,
	children: props.children
}));
Link.displayName = "Link";
markAsElement(Link);
//#endregion
export { Link };
