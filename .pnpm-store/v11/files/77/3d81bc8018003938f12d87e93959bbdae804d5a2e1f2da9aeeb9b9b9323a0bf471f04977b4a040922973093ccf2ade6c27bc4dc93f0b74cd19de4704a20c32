require("../../../../_virtual/_rolldown/runtime.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/resolve-all-css-variables.ts
function doSelectorsIntersect(first, second) {
	if ((0, css_tree.generate)(first) === (0, css_tree.generate)(second)) return true;
	let hasSomeUniversal = false;
	const walker = (node, _parentListItem, parentList) => {
		if (hasSomeUniversal) return;
		if (node.type === "PseudoClassSelector" && node.name === "root") hasSomeUniversal = true;
		if (node.type === "TypeSelector" && node.name === "*" && parentList.size === 1) hasSomeUniversal = true;
	};
	(0, css_tree.walk)(first, walker);
	(0, css_tree.walk)(second, walker);
	if (hasSomeUniversal) return true;
	return false;
}
function resolveAllCssVariables(node) {
	const variableDefinitions = /* @__PURE__ */ new Set();
	const variableUses = /* @__PURE__ */ new Set();
	const path = [];
	(0, css_tree.walk)(node, {
		leave() {
			path.shift();
		},
		enter(node) {
			if (node.type === "Declaration") {
				const declaration = node;
				if (path.some((ancestor) => ancestor.type === "Atrule" && ancestor.name === "layer" && ancestor.prelude !== null && (0, css_tree.generate)(ancestor.prelude).includes("properties"))) {
					path.unshift(node);
					return;
				}
				if (/--[\S]+/.test(declaration.property)) variableDefinitions.add({
					declaration,
					path: [...path],
					variableName: declaration.property,
					definition: (0, css_tree.generate)(declaration.value)
				});
				else {
					function parseVariableUsesFrom(node) {
						(0, css_tree.walk)(node, {
							visit: "Function",
							enter(funcNode) {
								if (funcNode.name === "var") {
									const children = funcNode.children.toArray();
									const name = (0, css_tree.generate)(children[0]);
									const fallback = children[2] ? (0, css_tree.generate)(children[2]) : void 0;
									variableUses.add({
										declaration,
										path: [...path],
										fallback,
										variableName: name,
										raw: (0, css_tree.generate)(funcNode)
									});
									if (fallback?.includes("var(")) parseVariableUsesFrom((0, css_tree.parse)(fallback, { context: "value" }));
								}
							}
						});
					}
					parseVariableUsesFrom(declaration.value);
				}
			}
			path.unshift(node);
		}
	});
	for (const use of variableUses) {
		let hasReplaced = false;
		for (const definition of variableDefinitions) {
			if (use.variableName !== definition.variableName) continue;
			if (use.path[0]?.type === "Block" && use.path[1]?.type === "Atrule" && use.path[2]?.type === "Block" && use.path[3]?.type === "Rule" && definition.path[0].type === "Block" && definition.path[1].type === "Rule" && doSelectorsIntersect(use.path[3].prelude, definition.path[1].prelude)) {
				use.declaration.value = (0, css_tree.parse)((0, css_tree.generate)(use.declaration.value).replaceAll(use.raw, definition.definition), { context: "value" });
				hasReplaced = true;
				break;
			}
			if (use.path[0]?.type === "Block" && use.path[1]?.type === "Rule" && definition.path[0]?.type === "Block" && definition.path[1]?.type === "Rule" && doSelectorsIntersect(use.path[1].prelude, definition.path[1].prelude)) {
				use.declaration.value = (0, css_tree.parse)((0, css_tree.generate)(use.declaration.value).replaceAll(use.raw, definition.definition), { context: "value" });
				hasReplaced = true;
				break;
			}
			if (use.path[0]?.type === "Block" && use.path[1]?.type === "Atrule" && use.path[2]?.type === "Block" && use.path[3]?.type === "Rule" && definition.path[0]?.type === "Block" && definition.path[1]?.type === "Atrule" && definition.path[2]?.type === "Block" && definition.path[3]?.type === "Rule" && use.path[1].name === definition.path[1].name && (use.path[1].prelude ? definition.path[1].prelude ? (0, css_tree.generate)(use.path[1].prelude) === (0, css_tree.generate)(definition.path[1].prelude) : false : definition.path[1].prelude === null) && doSelectorsIntersect(use.path[3].prelude, definition.path[3].prelude)) {
				use.declaration.value = (0, css_tree.parse)((0, css_tree.generate)(use.declaration.value).replaceAll(use.raw, definition.definition), { context: "value" });
				hasReplaced = true;
				break;
			}
		}
		if (!hasReplaced && use.fallback) use.declaration.value = (0, css_tree.parse)((0, css_tree.generate)(use.declaration.value).replaceAll(use.raw, use.fallback), { context: "value" });
	}
}
//#endregion
exports.resolveAllCssVariables = resolveAllCssVariables;
