import { markAsElement } from "../element-marker.mjs";
import * as React$1 from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/components/preview/preview.tsx
const PREVIEW_MAX_LENGTH = 200;
const Preview = React$1.forwardRef(({ children = "", useTitleTag = true, ...props }, ref) => {
	const text = (Array.isArray(children) ? children.join("") : children).substring(0, PREVIEW_MAX_LENGTH);
	return /* @__PURE__ */ jsxs(Fragment, { children: [useTitleTag ? /* @__PURE__ */ jsx("title", { children: text }) : null, /* @__PURE__ */ jsxs("div", {
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
markAsElement(Preview);
const whiteSpaceCodes = "\xA0‌​‍‎‏﻿";
const renderWhiteSpace = (text) => {
	if (text.length >= PREVIEW_MAX_LENGTH) return null;
	return /* @__PURE__ */ jsx("div", { children: whiteSpaceCodes.repeat(PREVIEW_MAX_LENGTH - text.length) });
};
//#endregion
export { Preview, renderWhiteSpace };
