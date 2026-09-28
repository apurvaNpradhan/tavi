const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/row/row.tsx
const Row = react.forwardRef(({ children, style, ...props }, ref) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("table", {
		align: "center",
		width: "100%",
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		role: "presentation",
		...props,
		ref,
		style,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", {
			style: { width: "100%" },
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", {
				style: { width: "100%" },
				children
			})
		})
	});
});
Row.displayName = "Row";
require_element_marker.markAsElement(Row);
//#endregion
exports.Row = Row;
