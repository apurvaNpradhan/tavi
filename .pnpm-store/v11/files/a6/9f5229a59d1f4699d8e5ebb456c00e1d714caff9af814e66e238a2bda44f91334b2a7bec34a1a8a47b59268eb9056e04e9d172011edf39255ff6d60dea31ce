//#region src/components/tailwind/utils/css/unwrap-value.ts
function unwrapValue(value) {
	if (value.type === "Value" && value.children.size === 1) return value.children.first ?? value;
	return value;
}
//#endregion
exports.unwrapValue = unwrapValue;
