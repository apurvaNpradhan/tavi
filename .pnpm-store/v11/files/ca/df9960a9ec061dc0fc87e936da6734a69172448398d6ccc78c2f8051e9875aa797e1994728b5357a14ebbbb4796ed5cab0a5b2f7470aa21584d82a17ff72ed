import { elementMarker } from "../../../element-marker.mjs";
//#region src/components/tailwind/utils/react/is-component.ts
const isComponent = (element) => {
	return (typeof element.type === "function" || element.type.render !== void 0) && !(elementMarker in element.type);
};
//#endregion
export { isComponent };
