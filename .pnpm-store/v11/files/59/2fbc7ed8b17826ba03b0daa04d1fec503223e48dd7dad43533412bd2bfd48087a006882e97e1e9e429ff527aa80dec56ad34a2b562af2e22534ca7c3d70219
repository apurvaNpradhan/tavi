const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/section/section.tsx
const Section = react.forwardRef(({ children, style = {}, tdClassName, ...props }, ref) => {
	const tdStyle = {};
	const tableStyle = {};
	const styleRecord = style;
	for (const key in styleRecord) {
		if (!Object.hasOwn(styleRecord, key)) continue;
		const value = styleRecord[key];
		if (key.startsWith("padding")) tdStyle[key] = value;
		else tableStyle[key] = value;
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("table", {
		align: "center",
		width: "100%",
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		role: "presentation",
		...props,
		ref,
		style: tableStyle,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
			className: tdClassName,
			style: tdStyle,
			children
		}) }) })
	});
});
Section.displayName = "Section";
require_element_marker.markAsElement(Section, { resolveTailwind(props, { style, className, classProperties }) {
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
exports.Section = Section;
