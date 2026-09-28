require("../../../../_virtual/_rolldown/runtime.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/is-rule-inlinable.ts
function isRuleInlinable(rule) {
	const hasAtRuleInside = (0, css_tree.find)(rule, (node) => node.type === "Atrule") !== null;
	const hasPseudoSelector = (0, css_tree.find)(rule, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null;
	return !hasAtRuleInside && !hasPseudoSelector;
}
//#endregion
exports.isRuleInlinable = isRuleInlinable;
