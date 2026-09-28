import { find } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/css/is-rule-inlinable.ts
function isRuleInlinable(rule) {
	const hasAtRuleInside = find(rule, (node) => node.type === "Atrule") !== null;
	const hasPseudoSelector = find(rule, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null;
	return !hasAtRuleInside && !hasPseudoSelector;
}
//#endregion
export { isRuleInlinable };
