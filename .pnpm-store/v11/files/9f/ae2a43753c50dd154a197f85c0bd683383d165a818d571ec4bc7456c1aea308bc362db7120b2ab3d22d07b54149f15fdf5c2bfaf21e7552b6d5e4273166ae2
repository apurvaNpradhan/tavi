import { NON_INLINABLE_ATRULES } from "./constants.mjs";
import { isRuleInlinable } from "./is-rule-inlinable.mjs";
import { splitMixedRule } from "./split-mixed-rule.mjs";
import { List, clone, string, walk } from "css-tree/dist/csstree.esm";
//#region src/components/tailwind/utils/css/extract-rules-per-class.ts
/**
* Re-nest the at-rule(s) back inside the rule so the pipeline stays
* version-agnostic across Tailwind's variant shape change.
* See https://github.com/resend/react-email/issues/3662
*/
function nestAtRulesInsideRule(rule, enclosingAtRules) {
	let children = clone(rule).block.children;
	for (let i = enclosingAtRules.length - 1; i >= 0; i--) {
		const atRule = enclosingAtRules[i];
		const wrapped = {
			type: "Atrule",
			name: atRule.name,
			prelude: atRule.prelude ? clone(atRule.prelude) : null,
			block: {
				type: "Block",
				children
			}
		};
		children = new List().fromArray([wrapped]);
	}
	return {
		type: "Rule",
		prelude: clone(rule.prelude),
		block: {
			type: "Block",
			children
		}
	};
}
function extractRulesPerClass(root, classes) {
	const classSet = new Set(classes);
	const inlinableRules = /* @__PURE__ */ new Map();
	const nonInlinableRules = /* @__PURE__ */ new Map();
	const appendRule = (map, className, rule) => {
		const existing = map.get(className);
		if (existing) existing.push(rule);
		else map.set(className, [rule]);
	};
	const enclosingAtRules = [];
	const handleRule = (rule) => {
		const firstSelector = rule.prelude.type === "SelectorList" ? rule.prelude.children.first : null;
		if (firstSelector?.type === "Selector" && firstSelector.children.first?.type === "NestingSelector") return;
		const selectorClasses = [];
		walk(rule.prelude, {
			visit: "ClassSelector",
			enter(classSelector) {
				selectorClasses.push(string.decode(classSelector.name));
			}
		});
		if (enclosingAtRules.length > 0) {
			const nonInlinablePart = nestAtRulesInsideRule(rule, enclosingAtRules);
			for (const className of selectorClasses) if (classSet.has(className)) appendRule(nonInlinableRules, className, nonInlinablePart);
			return;
		}
		if (isRuleInlinable(rule)) {
			for (const className of selectorClasses) if (classSet.has(className)) appendRule(inlinableRules, className, rule);
		} else {
			const { inlinablePart, nonInlinablePart } = splitMixedRule(rule);
			for (const className of selectorClasses) {
				if (!classSet.has(className)) continue;
				if (inlinablePart) appendRule(inlinableRules, className, inlinablePart);
				if (nonInlinablePart) appendRule(nonInlinableRules, className, nonInlinablePart);
			}
		}
	};
	walk(root, {
		enter(node) {
			if (node.type === "Atrule") {
				if (NON_INLINABLE_ATRULES.has(node.name.toLowerCase())) enclosingAtRules.push(node);
			} else if (node.type === "Rule") handleRule(node);
		},
		leave(node) {
			if (node.type === "Atrule" && NON_INLINABLE_ATRULES.has(node.name.toLowerCase())) enclosingAtRules.pop();
		}
	});
	return {
		inlinable: inlinableRules,
		nonInlinable: nonInlinableRules
	};
}
//#endregion
export { extractRulesPerClass };
