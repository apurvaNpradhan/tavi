const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
const require_compute_margins = require("./utils/compute-margins.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/text/text.tsx
const Text = react.forwardRef(({ style, ...props }, ref) => {
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
	const margins = require_compute_margins.computeMargins({
		...defaultMargins,
		...style
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
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
require_element_marker.markAsElement(Text);
//#endregion
exports.Text = Text;
