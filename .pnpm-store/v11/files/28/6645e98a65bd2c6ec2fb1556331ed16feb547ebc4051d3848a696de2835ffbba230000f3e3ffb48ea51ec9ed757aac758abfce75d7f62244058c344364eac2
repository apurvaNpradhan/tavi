import { extractRulesPerClass } from "./utils/css/extract-rules-per-class.mjs";
import { getCustomProperties } from "./utils/css/get-custom-properties.mjs";
import { sanitizeStyleSheet } from "./sanitize-stylesheet.mjs";
import { useSuspensedPromise } from "./hooks/use-suspended-promise.mjs";
import { downlevelForEmailClients } from "./utils/css/downlevel-for-email-clients.mjs";
import { sanitizeNonInlinableRules } from "./utils/css/sanitize-non-inlinable-rules.mjs";
import { mapReactTree } from "./utils/react/map-react-tree.mjs";
import { cloneElementWithInlinedStyles } from "./utils/tailwindcss/clone-element-with-inlined-styles.mjs";
import { setupTailwind } from "./utils/tailwindcss/setup-tailwind.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
import { List, generate } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/tailwind.tsx
const pixelBasedPreset = { theme: { extend: {
	fontSize: {
		xs: ["12px", { lineHeight: "16px" }],
		sm: ["14px", { lineHeight: "20px" }],
		base: ["16px", { lineHeight: "24px" }],
		lg: ["18px", { lineHeight: "28px" }],
		xl: ["20px", { lineHeight: "28px" }],
		"2xl": ["24px", { lineHeight: "32px" }],
		"3xl": ["30px", { lineHeight: "36px" }],
		"4xl": ["36px", { lineHeight: "36px" }],
		"5xl": ["48px", { lineHeight: "1" }],
		"6xl": ["60px", { lineHeight: "1" }],
		"7xl": ["72px", { lineHeight: "1" }],
		"8xl": ["96px", { lineHeight: "1" }],
		"9xl": ["144px", { lineHeight: "1" }]
	},
	spacing: {
		px: "1px",
		0: "0",
		.5: "2px",
		1: "4px",
		1.5: "6px",
		2: "8px",
		2.5: "10px",
		3: "12px",
		3.5: "14px",
		4: "16px",
		5: "20px",
		6: "24px",
		7: "28px",
		8: "32px",
		9: "36px",
		10: "40px",
		11: "44px",
		12: "48px",
		14: "56px",
		16: "64px",
		20: "80px",
		24: "96px",
		28: "112px",
		32: "128px",
		36: "144px",
		40: "160px",
		44: "176px",
		48: "192px",
		52: "208px",
		56: "224px",
		60: "240px",
		64: "256px",
		72: "288px",
		80: "320px",
		96: "384px"
	}
} } };
function Tailwind({ children, config, theme, utility }) {
	const twConfigData = {
		config,
		cssConfigs: {
			theme,
			utility
		}
	};
	const tailwindSetup = useSuspensedPromise(() => setupTailwind(twConfigData), JSON.stringify(twConfigData, (_key, value) => typeof value === "function" ? value.toString() : value));
	let classesUsed = [];
	let mappedChildren = mapReactTree(children, (node) => {
		if (React$1.isValidElement(node)) {
			if (node.props.className) {
				const classes = node.props.className?.split(/\s+/);
				classesUsed = [...classesUsed, ...classes];
				tailwindSetup.addUtilities(classes);
			}
		}
		return node;
	});
	const styleSheet = tailwindSetup.getStyleSheet();
	sanitizeStyleSheet(styleSheet);
	const { inlinable: inlinableRules, nonInlinable: nonInlinableRules } = extractRulesPerClass(styleSheet, classesUsed);
	const customProperties = getCustomProperties(styleSheet);
	const nonInlineStyles = {
		type: "StyleSheet",
		children: new List().fromArray(Array.from(nonInlinableRules.values()).flat())
	};
	sanitizeNonInlinableRules(nonInlineStyles);
	downlevelForEmailClients(nonInlineStyles);
	const hasNonInlineStylesToApply = nonInlinableRules.size > 0;
	let appliedNonInlineStyles = false;
	mappedChildren = mapReactTree(mappedChildren, (node) => {
		if (React$1.isValidElement(node)) {
			const elementWithInlinedStyles = cloneElementWithInlinedStyles(node, inlinableRules, nonInlinableRules, customProperties);
			if (elementWithInlinedStyles.type === "head") {
				appliedNonInlineStyles = true;
				const styleElement = /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: generate(nonInlineStyles) } });
				return React$1.cloneElement(elementWithInlinedStyles, elementWithInlinedStyles.props, styleElement, elementWithInlinedStyles.props.children);
			}
			return elementWithInlinedStyles;
		}
		return node;
	});
	if (hasNonInlineStylesToApply && !appliedNonInlineStyles) throw new Error(`Tailwind: <head> not found inside <Tailwind>.
Move <Head /> inside <Tailwind>, or remove these classes that require a <head>: ${Array.from(nonInlinableRules.keys()).join(" ")}.`);
	return mappedChildren;
}
//#endregion
export { Tailwind, pixelBasedPreset };
