//#region src/components/element-marker.ts
const elementMarker = Symbol.for("react-email.element");
const markAsElement = (component, options = {}) => {
	component[elementMarker] = options;
};
const getElementOptions = (type) => {
	if (typeof type !== "function" && typeof type !== "object") return void 0;
	if (type === null) return void 0;
	return type[elementMarker];
};
//#endregion
export { elementMarker, getElementOptions, markAsElement };
