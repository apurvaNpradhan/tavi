import { markAsElement } from "../element-marker.mjs";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/section/section.tsx
const Section = React$1.forwardRef(({ children, style = {}, tdClassName, ...props }, ref) => {
	const tdStyle = {};
	const tableStyle = {};
	const styleRecord = style;
	for (const key in styleRecord) {
		if (!Object.hasOwn(styleRecord, key)) continue;
		const value = styleRecord[key];
		if (key.startsWith("padding")) tdStyle[key] = value;
		else tableStyle[key] = value;
	}
	return /* @__PURE__ */ jsx("table", {
		align: "center",
		width: "100%",
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		role: "presentation",
		...props,
		ref,
		style: tableStyle,
		children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
			className: tdClassName,
			style: tdStyle,
			children
		}) }) })
	});
});
Section.displayName = "Section";
markAsElement(Section, { resolveTailwind(props, { style, className, classProperties }) {
	const tableClasses = [];
	const tdClasses = props.tdClassName ? [props.tdClassName] : [];
	for (const name of className?.split(" ") ?? []) {
		const properties = classProperties[name];
		if (properties && properties.length > 0 && properties.every((property) => property.startsWith("padding"))) tdClasses.push(name);
		else tableClasses.push(name);
	}
	return {
		...props,
		style,
		className: tableClasses.length > 0 ? tableClasses.join(" ") : void 0,
		tdClassName: tdClasses.length > 0 ? tdClasses.join(" ") : void 0
	};
} });
//#endregion
export { Section };
