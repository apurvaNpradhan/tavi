import { getElementOptions } from "../../../element-marker.mjs";
import { makeInlineStylesFor } from "../css/make-inline-styles-for.mjs";
import { sanitizeClassName } from "../compatibility/sanitize-class-name.mjs";
import { isComponent } from "../react/is-component.mjs";
import React from "react";
import { walk } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/tailwindcss/clone-element-with-inlined-styles.ts
function cloneElementWithInlinedStyles(element, inlinableRules, nonInlinableRules, customProperties) {
	if (!element.props.className || isComponent(element)) return React.cloneElement(element, element.props, element.props.children);
	const classes = element.props.className.trim().split(/\s+/);
	const residualClasses = [];
	const classProperties = Object.create(null);
	const rules = [];
	for (const className of classes) {
		const classRules = inlinableRules.get(className);
		if (classRules) rules.push(...classRules);
		const nonInlinable = nonInlinableRules.get(className);
		if (nonInlinable) {
			const sanitized = sanitizeClassName(className);
			residualClasses.push(sanitized);
			const properties = [];
			for (const rule of nonInlinable) walk(rule, {
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
			...makeInlineStylesFor(rules, customProperties),
			...element.props.style
		},
		className: residualClasses.length > 0 ? residualClasses.join(" ") : void 0,
		classProperties
	};
	const resolveTailwind = getElementOptions(element.type)?.resolveTailwind;
	const newProps = resolveTailwind ? resolveTailwind(element.props, resolved) : {
		...element.props,
		style: resolved.style,
		className: resolved.className
	};
	return React.cloneElement(element, newProps, newProps.children);
}
//#endregion
export { cloneElementWithInlinedStyles };
