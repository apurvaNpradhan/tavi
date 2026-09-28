const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
const require_parse_padding = require("./utils/parse-padding.cjs");
const require_px_to_pt = require("./utils/px-to-pt.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/button/button.tsx
const maxFontWidth = 5;
/**
* Computes a msoFontWidth \<= 5 and a count of space characters that,
* when applied, end up being as close to `expectedWidth` as possible.
*/
function computeFontWidthAndSpaceCount(expectedWidth) {
	if (expectedWidth === 0) return [0, 0];
	let smallestSpaceCount = 0;
	const computeRequiredFontWidth = () => {
		if (smallestSpaceCount > 0) return expectedWidth / smallestSpaceCount / 2;
		return Number.POSITIVE_INFINITY;
	};
	while (computeRequiredFontWidth() > maxFontWidth) smallestSpaceCount++;
	return [computeRequiredFontWidth(), smallestSpaceCount];
}
const Button = react.forwardRef(({ children, style, target = "_blank", ...props }, ref) => {
	const { paddingTop, paddingRight, paddingBottom, paddingLeft } = require_parse_padding.parsePadding(style ?? {});
	const textRaise = require_px_to_pt.pxToPt((paddingTop ?? 0) + (paddingBottom ?? 0));
	const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft ?? 0);
	const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight ?? 0);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
		...props,
		ref,
		style: {
			lineHeight: "100%",
			textDecoration: "none",
			display: "inline-block",
			maxWidth: "100%",
			msoPaddingAlt: "0px",
			...style,
			paddingTop,
			paddingRight,
			paddingBottom,
			paddingLeft
		},
		target,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${plFontWidth * 100}%;mso-text-raise:${textRaise}px" hidden>${"&#8202;".repeat(plSpaceCount)}</i><![endif]-->` } }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					maxWidth: "100%",
					display: "inline-block",
					lineHeight: "120%",
					msoPaddingAlt: "0px",
					msoTextRaise: require_px_to_pt.pxToPt(paddingBottom)
				},
				children
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${prFontWidth * 100}%" hidden>${"&#8202;".repeat(prSpaceCount)}&#8203;</i><![endif]-->` } })
		]
	});
});
Button.displayName = "Button";
require_element_marker.markAsElement(Button);
//#endregion
exports.Button = Button;
