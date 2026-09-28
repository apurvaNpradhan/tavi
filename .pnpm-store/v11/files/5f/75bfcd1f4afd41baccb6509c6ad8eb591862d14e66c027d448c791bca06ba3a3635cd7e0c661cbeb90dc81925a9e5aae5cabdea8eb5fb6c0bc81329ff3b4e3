const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
const require_spaces = require("./utils/spaces.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/heading/heading.tsx
const Heading = react.forwardRef(({ as: Tag = "h1", children, style, m, mx, my, mt, mr, mb, ml, ...props }, ref) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
		...props,
		ref,
		style: {
			...require_spaces.withMargin({
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
require_element_marker.markAsElement(Heading);
//#endregion
exports.Heading = Heading;
