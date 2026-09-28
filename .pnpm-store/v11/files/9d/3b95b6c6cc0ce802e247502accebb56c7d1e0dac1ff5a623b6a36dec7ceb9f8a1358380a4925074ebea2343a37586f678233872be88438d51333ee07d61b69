import { getReactProperty } from "../compatibility/get-react-property.mjs";
import { stripEmptyTailwindVars } from "./strip-empty-tailwind-vars.mjs";
import { unwrapValue } from "./unwrap-value.mjs";
import { generate, walk } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/css/make-inline-styles-for.ts
function makeInlineStylesFor(inlinableRules, customProperties) {
	const styles = {};
	const localVariableDeclarations = /* @__PURE__ */ new Map();
	for (const rule of inlinableRules) walk(rule, {
		visit: "Declaration",
		enter(declaration) {
			if (declaration.property.startsWith("--")) localVariableDeclarations.set(declaration.property, declaration);
		}
	});
	for (const rule of inlinableRules) {
		walk(rule, {
			visit: "Function",
			enter(func, funcParentListItem) {
				if (func.name === "var") {
					let variableName;
					walk(func, {
						visit: "Identifier",
						enter(identifier) {
							variableName = identifier.name;
							return this.break;
						}
					});
					if (variableName) {
						const definition = localVariableDeclarations.get(variableName);
						if (definition) funcParentListItem.data = unwrapValue(definition.value);
						else {
							const customProperty = customProperties.get(variableName);
							if (customProperty?.initialValue) funcParentListItem.data = unwrapValue(customProperty.initialValue.value);
						}
					}
				}
			}
		});
		walk(rule, {
			visit: "Declaration",
			enter(declaration) {
				if (declaration.property.startsWith("--")) return;
				stripEmptyTailwindVars(declaration.value);
				styles[getReactProperty(declaration.property)] = generate(declaration.value).trim() + (declaration.important ? "!important" : "");
			}
		});
	}
	return styles;
}
//#endregion
export { makeInlineStylesFor };
