const require_extract_rules_per_class = require("./utils/css/extract-rules-per-class.cjs");
const require_get_custom_properties = require("./utils/css/get-custom-properties.cjs");
const require_make_inline_styles_for = require("./utils/css/make-inline-styles-for.cjs");
//#region src/components/tailwind/inline-styles.ts
function inlineStyles(styleSheet, classes) {
	const { inlinable: inlinableRules } = require_extract_rules_per_class.extractRulesPerClass(styleSheet, classes);
	const customProperties = require_get_custom_properties.getCustomProperties(styleSheet);
	return require_make_inline_styles_for.makeInlineStylesFor(Array.from(inlinableRules.values()).flat(), customProperties);
}
//#endregion
exports.inlineStyles = inlineStyles;
