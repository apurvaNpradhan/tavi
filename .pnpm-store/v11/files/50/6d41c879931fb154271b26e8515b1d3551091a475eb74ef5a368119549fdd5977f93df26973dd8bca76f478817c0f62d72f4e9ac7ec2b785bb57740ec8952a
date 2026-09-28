const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/preview/preview.tsx
const PREVIEW_MAX_LENGTH = 200;
const Preview = react.forwardRef(({ children = "", useTitleTag = true, ...props }, ref) => {
	const text = (Array.isArray(children) ? children.join("") : children).substring(0, PREVIEW_MAX_LENGTH);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [useTitleTag ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: text }) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			display: "none",
			overflow: "hidden",
			lineHeight: "1px",
			opacity: 0,
			maxHeight: 0,
			maxWidth: 0
		},
		"data-skip-in-text": true,
		...props,
		ref,
		children: [text, renderWhiteSpace(text)]
	})] });
});
Preview.displayName = "Preview";
require_element_marker.markAsElement(Preview);
const whiteSpaceCodes = "\xA0‌​‍‎‏﻿";
const renderWhiteSpace = (text) => {
	if (text.length >= PREVIEW_MAX_LENGTH) return null;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: whiteSpaceCodes.repeat(PREVIEW_MAX_LENGTH - text.length) });
};
//#endregion
exports.Preview = Preview;
exports.renderWhiteSpace = renderWhiteSpace;
