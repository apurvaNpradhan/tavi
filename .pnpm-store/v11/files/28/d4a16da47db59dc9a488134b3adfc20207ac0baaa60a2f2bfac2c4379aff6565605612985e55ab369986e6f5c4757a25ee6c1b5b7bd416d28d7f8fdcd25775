import { isPartInlinable } from "./is-part-inlinable.mjs";
import { List, clone, find } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/css/split-mixed-rule.ts
/**
* Split a rule into inlinable and non-inlinable parts. Caller must only pass rules
* for which isRuleInlinable(rule) is false. Returns clones so the original stylesheet is never mutated.
*
* @returns inlinablePart: rule with only inlinable block children, or null if none.
*          nonInlinablePart: rule with only non-inlinable block children, or null if none.
*/
function splitMixedRule(rule) {
	if (rule.prelude !== null && find(rule.prelude, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null) return {
		inlinablePart: null,
		nonInlinablePart: clone(rule)
	};
	const ruleCloneInlinable = clone(rule);
	const ruleCloneNonInlinable = clone(rule);
	const inlinableParts = [];
	const nonInlinableParts = [];
	for (const part of ruleCloneInlinable.block.children.toArray()) if (isPartInlinable(part)) inlinableParts.push(part);
	else nonInlinableParts.push(part);
	return {
		inlinablePart: inlinableParts.length > 0 ? {
			...ruleCloneInlinable,
			block: {
				type: "Block",
				children: new List().fromArray(inlinableParts)
			}
		} : null,
		nonInlinablePart: nonInlinableParts.length > 0 ? {
			...ruleCloneNonInlinable,
			block: {
				type: "Block",
				children: new List().fromArray(nonInlinableParts)
			}
		} : null
	};
}
//#endregion
export { splitMixedRule };
