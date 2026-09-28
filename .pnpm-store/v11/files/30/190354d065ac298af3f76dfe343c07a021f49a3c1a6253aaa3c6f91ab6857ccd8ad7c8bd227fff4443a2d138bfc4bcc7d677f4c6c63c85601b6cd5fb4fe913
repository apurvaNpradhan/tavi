const require_runtime = require("../../../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../../../element-marker.cjs");
const require_make_inline_styles_for = require("../css/make-inline-styles-for.cjs");
const require_sanitize_class_name = require("../compatibility/sanitize-class-name.cjs");
const require_is_component = require("../react/is-component.cjs");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/tailwindcss/clone-element-with-inlined-styles.ts
function cloneElementWithInlinedStyles(element, inlinableRules, nonInlinableRules, customProperties) {
	if (!element.props.className || require_is_component.isComponent(element)) return react.default.cloneElement(element, element.props, element.props.children);
	const classes = element.props.className.trim().split(/\s+/);
	const residualClasses = [];
	const classProperties = Object.create(null);
	const rules = [];
	for (const className of classes) {
		const classRules = inlinableRules.get(className);
		if (classRules) rules.push(...classRules);
		const nonInlinable = nonInlinableRules.get(className);
		if (nonInlinable) {
			const sanitized = require_sanitize_class_name.sanitizeClassName(className);
			residualClasses.push(sanitized);
			const properties = [];
			for (const rule of nonInlinable) (0, css_tree.walk)(rule, {
				visit: "Declaration",
				enter(declaration) {
					properties.push(declaration.property);
				}
			});
			classProperties[sanitized] = properties;
		} else if (!classRules) residualClasses.push(className);
	}
	const resolved = {
		style: {
			...require_make_inline_styles_for.makeInlineStylesFor(rules, customProperties),
			...element.props.style
		},
		className: residualClasses.length > 0 ? residualClasses.join(" ") : void 0,
		classProperties
	};
	const resolveTailwind = require_element_marker.getElementOptions(element.type)?.resolveTailwind;
	const newProps = resolveTailwind ? resolveTailwind(element.props, resolved) : {
		...element.props,
		style: resolved.style,
		className: resolved.className
	};
	return react.default.cloneElement(element, newProps, newProps.children);
}
//#endregion
exports.cloneElementWithInlinedStyles = cloneElementWithInlinedStyles;
