require("../../../../_virtual/_rolldown/runtime.cjs");
const require_is_part_inlinable = require("./is-part-inlinable.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/split-mixed-rule.ts
/**
* Split a rule into inlinable and non-inlinable parts. Caller must only pass rules
* for which isRuleInlinable(rule) is false. Returns clones so the original stylesheet is never mutated.
*
* @returns inlinablePart: rule with only inlinable block children, or null if none.
*          nonInlinablePart: rule with only non-inlinable block children, or null if none.
*/
function splitMixedRule(rule) {
	if (rule.prelude !== null && (0, css_tree.find)(rule.prelude, (node) => node.type === "PseudoClassSelector" || node.type === "PseudoElementSelector") !== null) return {
		inlinablePart: null,
		nonInlinablePart: (0, css_tree.clone)(rule)
	};
	const ruleCloneInlinable = (0, css_tree.clone)(rule);
	const ruleCloneNonInlinable = (0, css_tree.clone)(rule);
	const inlinableParts = [];
	const nonInlinableParts = [];
	for (const part of ruleCloneInlinable.block.children.toArray()) if (require_is_part_inlinable.isPartInlinable(part)) inlinableParts.push(part);
	else nonInlinableParts.push(part);
	return {
		inlinablePart: inlinableParts.length > 0 ? {
			...ruleCloneInlinable,
			block: {
				type: "Block",
				children: new css_tree.List().fromArray(inlinableParts)
			}
		} : null,
		nonInlinablePart: nonInlinableParts.length > 0 ? {
			...ruleCloneNonInlinable,
			block: {
				type: "Block",
				children: new css_tree.List().fromArray(nonInlinableParts)
			}
		} : null
	};
}
//#endregion
exports.splitMixedRule = splitMixedRule;
