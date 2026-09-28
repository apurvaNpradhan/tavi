import { markAsElement } from "../element-marker.mjs";
import { marginProperties, paddingProperties } from "./margin-properties.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/body/body.tsx
const Body = React$1.forwardRef(({ children, style, ...props }, ref) => {
	const bodyStyle = {
		background: style?.background,
		backgroundColor: style?.backgroundColor
	};
	if (style) for (const property of [...marginProperties, ...paddingProperties]) bodyStyle[property] = style[property] !== void 0 ? 0 : void 0;
	return /* @__PURE__ */ jsx("body", {
		...props,
		dir: props.dir ?? "ltr",
		lang: props.lang ?? "en",
		style: bodyStyle,
		ref,
		children: /* @__PURE__ */ jsx("table", {
			border: 0,
			width: "100%",
			cellPadding: "0",
			cellSpacing: "0",
			role: "presentation",
			align: "center",
			children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
				dir: props.dir ?? "ltr",
				lang: props.lang ?? "en",
				style,
				children
			}) }) })
		})
	});
});
Body.displayName = "Body";
markAsElement(Body);
//#endregion
export { Body };
