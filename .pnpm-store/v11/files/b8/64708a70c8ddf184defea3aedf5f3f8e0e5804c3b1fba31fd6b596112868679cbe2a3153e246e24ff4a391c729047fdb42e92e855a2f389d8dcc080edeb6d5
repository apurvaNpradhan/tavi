const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/code-inline/code-inline.tsx
/**
* If you are sending emails for users that have the Orange.fr email client,
* beware that this component will only work when you have a head containing meta tags.
*/
const CodeInline = react.forwardRef(({ children, ...props }, ref) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: `
        meta ~ .cino {
          display: none !important;
          opacity: 0 !important;
        }

        meta ~ .cio {
          display: block !important;
        }
      ` }),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
			...props,
			className: `${props.className ? props.className : ""} cino`,
			children
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			...props,
			className: `${props.className ? props.className : ""} cio`,
			ref,
			style: {
				display: "none",
				...props.style
			},
			children
		})
	] });
});
CodeInline.displayName = "CodeInline";
require_element_marker.markAsElement(CodeInline);
//#endregion
exports.CodeInline = CodeInline;
