//#region src/components/markdown/utils/parse-css-in-js-to-inline-css.ts
function camelToKebabCase(str) {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
function escapeQuotes(value) {
	if (typeof value === "string" && value.includes("\"")) return value.replace(/"/g, "&quot;");
	return value;
}
function parseCssInJsToInlineCss(cssProperties) {
	if (!cssProperties) return "";
	const numericalCssProperties = [
		"width",
		"height",
		"margin",
		"marginTop",
		"marginRight",
		"marginBottom",
		"marginLeft",
		"padding",
		"paddingTop",
		"paddingRight",
		"paddingBottom",
		"paddingLeft",
		"borderWidth",
		"borderTopWidth",
		"borderRightWidth",
		"borderBottomWidth",
		"borderLeftWidth",
		"outlineWidth",
		"top",
		"right",
		"bottom",
		"left",
		"fontSize",
		"letterSpacing",
		"wordSpacing",
		"maxWidth",
		"minWidth",
		"maxHeight",
		"minHeight",
		"borderRadius",
		"borderTopLeftRadius",
		"borderTopRightRadius",
		"borderBottomLeftRadius",
		"borderBottomRightRadius",
		"textIndent",
		"gridColumnGap",
		"gridRowGap",
		"gridGap",
		"translateX",
		"translateY"
	];
	return Object.entries(cssProperties).map(([property, value]) => {
		if (typeof value === "number" && numericalCssProperties.includes(property)) return `${camelToKebabCase(property)}:${value}px`;
		const escapedValue = escapeQuotes(value);
		return `${camelToKebabCase(property)}:${escapedValue}`;
	}).join(";");
}
//#endregion
export { parseCssInJsToInlineCss };
