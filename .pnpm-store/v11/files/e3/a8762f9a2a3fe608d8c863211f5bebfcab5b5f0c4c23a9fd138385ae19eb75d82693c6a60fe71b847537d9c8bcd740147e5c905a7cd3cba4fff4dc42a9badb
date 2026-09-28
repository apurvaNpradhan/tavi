const require_from_dash_case_to_camel_case = require("../text/from-dash-case-to-camel-case.cjs");
//#region src/components/tailwind/utils/compatibility/get-react-property.ts
function getReactProperty(prop) {
	const modifiedProp = prop.toLowerCase();
	if (modifiedProp.startsWith("--")) return modifiedProp;
	if (modifiedProp.startsWith("-ms-")) return require_from_dash_case_to_camel_case.fromDashCaseToCamelCase(modifiedProp.slice(1));
	return require_from_dash_case_to_camel_case.fromDashCaseToCamelCase(modifiedProp);
}
//#endregion
exports.getReactProperty = getReactProperty;
