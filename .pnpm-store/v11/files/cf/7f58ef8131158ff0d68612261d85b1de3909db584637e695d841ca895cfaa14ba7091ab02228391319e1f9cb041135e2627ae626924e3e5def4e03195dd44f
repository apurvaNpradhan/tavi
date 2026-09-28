import { extractRulesPerClass } from "./utils/css/extract-rules-per-class.mjs";
import { getCustomProperties } from "./utils/css/get-custom-properties.mjs";
import { makeInlineStylesFor } from "./utils/css/make-inline-styles-for.mjs";
//#region src/components/tailwind/inline-styles.ts
function inlineStyles(styleSheet, classes) {
	const { inlinable: inlinableRules } = extractRulesPerClass(styleSheet, classes);
	const customProperties = getCustomProperties(styleSheet);
	return makeInlineStylesFor(Array.from(inlinableRules.values()).flat(), customProperties);
}
//#endregion
export { inlineStyles };
