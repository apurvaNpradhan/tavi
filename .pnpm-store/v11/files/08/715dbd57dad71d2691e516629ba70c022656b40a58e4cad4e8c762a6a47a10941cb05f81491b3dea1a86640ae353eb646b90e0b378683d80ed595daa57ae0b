import { markAsElement } from "../element-marker.mjs";
import { computeMargins } from "./utils/compute-margins.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/text/text.tsx
const Text = React$1.forwardRef(({ style, ...props }, ref) => {
	/**
	* we do this clunky way of spreading these default margins because
	* if we were to simply spread, the ordering of the margins would be lost
	*
	* ex:
	* ```js
	* { ...{ marginTop: '16px', marginBottom: '16px' }, ...{ marginTop: '24px' } }
	* // would result in
	* { marginTop: '24px', marginBottom: '16px' }
	* // not the expected
	* { marginBottom: '16px', marginTop: '24px' }
	* ```
	*/
	const defaultMargins = {};
	if (style?.marginTop === void 0) defaultMargins.marginTop = "16px";
	if (style?.marginBottom === void 0) defaultMargins.marginBottom = "16px";
	const margins = computeMargins({
		...defaultMargins,
		...style
	});
	return /* @__PURE__ */ jsx("p", {
		...props,
		ref,
		style: {
			fontSize: "14px",
			lineHeight: "24px",
			...style,
			...margins
		}
	});
});
Text.displayName = "Text";
markAsElement(Text);
//#endregion
export { Text };
