const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_extract_rules_per_class = require("./utils/css/extract-rules-per-class.cjs");
const require_get_custom_properties = require("./utils/css/get-custom-properties.cjs");
const require_sanitize_stylesheet = require("./sanitize-stylesheet.cjs");
const require_use_suspended_promise = require("./hooks/use-suspended-promise.cjs");
const require_downlevel_for_email_clients = require("./utils/css/downlevel-for-email-clients.cjs");
const require_sanitize_non_inlinable_rules = require("./utils/css/sanitize-non-inlinable-rules.cjs");
const require_map_react_tree = require("./utils/react/map-react-tree.cjs");
const require_clone_element_with_inlined_styles = require("./utils/tailwindcss/clone-element-with-inlined-styles.cjs");
const require_setup_tailwind = require("./utils/tailwindcss/setup-tailwind.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let css_tree = require("css-tree");
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
	const tailwindSetup = require_use_suspended_promise.useSuspensedPromise(() => require_setup_tailwind.setupTailwind(twConfigData), JSON.stringify(twConfigData, (_key, value) => typeof value === "function" ? value.toString() : value));
	let classesUsed = [];
	let mappedChildren = require_map_react_tree.mapReactTree(children, (node) => {
		if (react.isValidElement(node)) {
			if (node.props.className) {
				const classes = node.props.className?.split(/\s+/);
				classesUsed = [...classesUsed, ...classes];
				tailwindSetup.addUtilities(classes);
			}
		}
		return node;
	});
	const styleSheet = tailwindSetup.getStyleSheet();
	require_sanitize_stylesheet.sanitizeStyleSheet(styleSheet);
	const { inlinable: inlinableRules, nonInlinable: nonInlinableRules } = require_extract_rules_per_class.extractRulesPerClass(styleSheet, classesUsed);
	const customProperties = require_get_custom_properties.getCustomProperties(styleSheet);
	const nonInlineStyles = {
		type: "StyleSheet",
		children: new css_tree.List().fromArray(Array.from(nonInlinableRules.values()).flat())
	};
	require_sanitize_non_inlinable_rules.sanitizeNonInlinableRules(nonInlineStyles);
	require_downlevel_for_email_clients.downlevelForEmailClients(nonInlineStyles);
	const hasNonInlineStylesToApply = nonInlinableRules.size > 0;
	let appliedNonInlineStyles = false;
	mappedChildren = require_map_react_tree.mapReactTree(mappedChildren, (node) => {
		if (react.isValidElement(node)) {
			const elementWithInlinedStyles = require_clone_element_with_inlined_styles.cloneElementWithInlinedStyles(node, inlinableRules, nonInlinableRules, customProperties);
			if (elementWithInlinedStyles.type === "head") {
				appliedNonInlineStyles = true;
				const styleElement = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: (0, css_tree.generate)(nonInlineStyles) } });
				return react.cloneElement(elementWithInlinedStyles, elementWithInlinedStyles.props, styleElement, elementWithInlinedStyles.props.children);
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
exports.Tailwind = Tailwind;
exports.pixelBasedPreset = pixelBasedPreset;
