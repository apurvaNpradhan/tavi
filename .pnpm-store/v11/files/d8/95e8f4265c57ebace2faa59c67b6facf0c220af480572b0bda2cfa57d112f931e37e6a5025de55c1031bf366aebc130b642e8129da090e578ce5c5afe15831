require("../../../../_virtual/_rolldown/runtime.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/is-part-inlinable.ts
function isPartInlinable(part) {
	const hasAtRuleInside = (0, css_tree.find)(part, (node) => node.type === "Atrule") !== null;
	const hasPseudoSelector = (0, css_tree.find)(part, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null;
	return !hasAtRuleInside && !hasPseudoSelector;
}
//#endregion
exports.isPartInlinable = isPartInlinable;
