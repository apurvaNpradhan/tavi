import { markAsElement } from "../element-marker.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/img/img.tsx
const Img = React$1.forwardRef(({ alt, src, width, height, style, ...props }, ref) => /* @__PURE__ */ jsx("img", {
	...props,
	alt: alt ?? "",
	height,
	ref,
	src,
	style: {
		display: "block",
		outline: "none",
		border: "none",
		textDecoration: "none",
		...style
	},
	width
}));
Img.displayName = "Img";
markAsElement(Img);
//#endregion
export { Img };
