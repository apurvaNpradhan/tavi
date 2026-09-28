const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
const require_margin_properties = require("./margin-properties.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/body/body.tsx
const Body = react.forwardRef(({ children, style, ...props }, ref) => {
	const bodyStyle = {
		background: style?.background,
		backgroundColor: style?.backgroundColor
	};
	if (style) for (const property of [...require_margin_properties.marginProperties, ...require_margin_properties.paddingProperties]) bodyStyle[property] = style[property] !== void 0 ? 0 : void 0;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("body", {
		...props,
		dir: props.dir ?? "ltr",
		lang: props.lang ?? "en",
		style: bodyStyle,
		ref,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("table", {
			border: 0,
			width: "100%",
			cellPadding: "0",
			cellSpacing: "0",
			role: "presentation",
			align: "center",
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
				dir: props.dir ?? "ltr",
				lang: props.lang ?? "en",
				style,
				children
			}) }) })
		})
	});
});
Body.displayName = "Body";
require_element_marker.markAsElement(Body);
//#endregion
exports.Body = Body;
