import { generate, walk } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/css/get-custom-properties.ts
function getCustomProperties(node) {
	const customProperties = /* @__PURE__ */ new Map();
	walk(node, {
		visit: "Atrule",
		enter(atrule) {
			if (atrule.name === "property" && atrule.prelude) {
				const prelude = generate(atrule.prelude);
				if (prelude.startsWith("--")) {
					let syntax;
					let inherits;
					let initialValue;
					walk(atrule, {
						visit: "Declaration",
						enter(declaration) {
							if (declaration.property === "syntax") syntax = declaration;
							if (declaration.property === "inherits") inherits = declaration;
							if (declaration.property === "initial-value") initialValue = declaration;
						}
					});
					customProperties.set(prelude, {
						syntax,
						inherits,
						initialValue
					});
				}
			}
		}
	});
	return customProperties;
}
//#endregion
export { getCustomProperties };
