import { markAsElement } from "../element-marker.mjs";
import { parsePadding } from "./utils/parse-padding.mjs";
import { pxToPt } from "./utils/px-to-pt.mjs";
import * as React$1 from "react";
import { jsx, jsxs } from "react/jsx-runtime";
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
const Button = React$1.forwardRef(({ children, style, target = "_blank", ...props }, ref) => {
	const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style ?? {});
	const textRaise = pxToPt((paddingTop ?? 0) + (paddingBottom ?? 0));
	const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft ?? 0);
	const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight ?? 0);
	return /* @__PURE__ */ jsxs("a", {
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
			/* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${plFontWidth * 100}%;mso-text-raise:${textRaise}px" hidden>${"&#8202;".repeat(plSpaceCount)}</i><![endif]-->` } }),
			/* @__PURE__ */ jsx("span", {
				style: {
					maxWidth: "100%",
					display: "inline-block",
					lineHeight: "120%",
					msoPaddingAlt: "0px",
					msoTextRaise: pxToPt(paddingBottom)
				},
				children
			}),
			/* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${prFontWidth * 100}%" hidden>${"&#8202;".repeat(prSpaceCount)}&#8203;</i><![endif]-->` } })
		]
	});
});
Button.displayName = "Button";
markAsElement(Button);
//#endregion
export { Button };
