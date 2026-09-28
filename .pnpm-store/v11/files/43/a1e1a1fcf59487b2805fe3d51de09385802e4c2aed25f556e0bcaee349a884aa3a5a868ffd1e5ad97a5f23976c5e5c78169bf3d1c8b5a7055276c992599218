import { markAsElement } from "../element-marker.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/column/column.tsx
const Column = React$1.forwardRef(({ children, style, ...props }, ref) => {
	return /* @__PURE__ */ jsx("td", {
		...props,
		"data-id": "__react-email-column",
		ref,
		style,
		children
	});
});
Column.displayName = "Column";
markAsElement(Column);
//#endregion
export { Column };
