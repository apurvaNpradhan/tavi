const require_element_marker = require("../../../element-marker.cjs");
//#region src/components/tailwind/utils/react/is-component.ts
const isComponent = (element) => {
	return (typeof element.type === "function" || element.type.render !== void 0) && !(require_element_marker.elementMarker in element.type);
};
//#endregion
exports.isComponent = isComponent;
