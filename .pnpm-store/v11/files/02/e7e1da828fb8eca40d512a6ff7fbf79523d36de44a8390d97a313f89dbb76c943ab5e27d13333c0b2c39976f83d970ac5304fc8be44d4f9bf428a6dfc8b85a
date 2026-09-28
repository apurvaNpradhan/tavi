require("../../../../_virtual/_rolldown/runtime.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/get-custom-properties.ts
function getCustomProperties(node) {
	const customProperties = /* @__PURE__ */ new Map();
	(0, css_tree.walk)(node, {
		visit: "Atrule",
		enter(atrule) {
			if (atrule.name === "property" && atrule.prelude) {
				const prelude = (0, css_tree.generate)(atrule.prelude);
				if (prelude.startsWith("--")) {
					let syntax;
					let inherits;
					let initialValue;
					(0, css_tree.walk)(atrule, {
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
exports.getCustomProperties = getCustomProperties;
