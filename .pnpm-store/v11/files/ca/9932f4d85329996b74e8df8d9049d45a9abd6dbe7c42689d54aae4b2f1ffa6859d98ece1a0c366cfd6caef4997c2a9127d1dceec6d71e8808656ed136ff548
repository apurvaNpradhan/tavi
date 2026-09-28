import { find } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/css/is-part-inlinable.ts
function isPartInlinable(part) {
	const hasAtRuleInside = find(part, (node) => node.type === "Atrule") !== null;
	const hasPseudoSelector = find(part, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null;
	return !hasAtRuleInside && !hasPseudoSelector;
}
//#endregion
export { isPartInlinable };
