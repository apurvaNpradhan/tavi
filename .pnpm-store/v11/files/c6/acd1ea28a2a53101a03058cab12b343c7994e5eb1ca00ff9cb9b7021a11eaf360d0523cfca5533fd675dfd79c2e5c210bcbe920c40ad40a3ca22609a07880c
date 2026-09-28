import { fromDashCaseToCamelCase } from "../text/from-dash-case-to-camel-case.mjs";
//#region src/components/tailwind/utils/compatibility/get-react-property.ts
function getReactProperty(prop) {
	const modifiedProp = prop.toLowerCase();
	if (modifiedProp.startsWith("--")) return modifiedProp;
	if (modifiedProp.startsWith("-ms-")) return fromDashCaseToCamelCase(modifiedProp.slice(1));
	return fromDashCaseToCamelCase(modifiedProp);
}
//#endregion
export { getReactProperty };
