require("../../../../_virtual/_rolldown/runtime.cjs");
const require_get_react_property = require("../compatibility/get-react-property.cjs");
const require_strip_empty_tailwind_vars = require("./strip-empty-tailwind-vars.cjs");
const require_unwrap_value = require("./unwrap-value.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/make-inline-styles-for.ts
function makeInlineStylesFor(inlinableRules, customProperties) {
	const styles = {};
	const localVariableDeclarations = /* @__PURE__ */ new Map();
	for (const rule of inlinableRules) (0, css_tree.walk)(rule, {
		visit: "Declaration",
		enter(declaration) {
			if (declaration.property.startsWith("--")) localVariableDeclarations.set(declaration.property, declaration);
		}
	});
	for (const rule of inlinableRules) {
		(0, css_tree.walk)(rule, {
			visit: "Function",
			enter(func, funcParentListItem) {
				if (func.name === "var") {
					let variableName;
					(0, css_tree.walk)(func, {
						visit: "Identifier",
						enter(identifier) {
							variableName = identifier.name;
							return this.break;
						}
					});
					if (variableName) {
						const definition = localVariableDeclarations.get(variableName);
						if (definition) funcParentListItem.data = require_unwrap_value.unwrapValue(definition.value);
						else {
							const customProperty = customProperties.get(variableName);
							if (customProperty?.initialValue) funcParentListItem.data = require_unwrap_value.unwrapValue(customProperty.initialValue.value);
						}
					}
				}
			}
		});
		(0, css_tree.walk)(rule, {
			visit: "Declaration",
			enter(declaration) {
				if (declaration.property.startsWith("--")) return;
				require_strip_empty_tailwind_vars.stripEmptyTailwindVars(declaration.value);
				styles[require_get_react_property.getReactProperty(declaration.property)] = (0, css_tree.generate)(declaration.value).trim() + (declaration.important ? "!important" : "");
			}
		});
	}
	return styles;
}
//#endregion
exports.makeInlineStylesFor = makeInlineStylesFor;
