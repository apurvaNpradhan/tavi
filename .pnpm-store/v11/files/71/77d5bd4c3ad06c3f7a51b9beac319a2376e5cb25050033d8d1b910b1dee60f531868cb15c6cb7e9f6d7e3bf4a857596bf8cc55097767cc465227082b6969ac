require("../../../../_virtual/_rolldown/runtime.cjs");
const require_constants = require("./constants.cjs");
const require_is_rule_inlinable = require("./is-rule-inlinable.cjs");
const require_split_mixed_rule = require("./split-mixed-rule.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/extract-rules-per-class.ts
/**
* Re-nest the at-rule(s) back inside the rule so the pipeline stays
* version-agnostic across Tailwind's variant shape change.
* See https://github.com/resend/react-email/issues/3662
*/
function nestAtRulesInsideRule(rule, enclosingAtRules) {
	let children = (0, css_tree.clone)(rule).block.children;
	for (let i = enclosingAtRules.length - 1; i >= 0; i--) {
		const atRule = enclosingAtRules[i];
		const wrapped = {
			type: "Atrule",
			name: atRule.name,
			prelude: atRule.prelude ? (0, css_tree.clone)(atRule.prelude) : null,
			block: {
				type: "Block",
				children
			}
		};
		children = new css_tree.List().fromArray([wrapped]);
	}
	return {
		type: "Rule",
		prelude: (0, css_tree.clone)(rule.prelude),
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
		(0, css_tree.walk)(rule.prelude, {
			visit: "ClassSelector",
			enter(classSelector) {
				selectorClasses.push(css_tree.string.decode(classSelector.name));
			}
		});
		if (enclosingAtRules.length > 0) {
			const nonInlinablePart = nestAtRulesInsideRule(rule, enclosingAtRules);
			for (const className of selectorClasses) if (classSet.has(className)) appendRule(nonInlinableRules, className, nonInlinablePart);
			return;
		}
		if (require_is_rule_inlinable.isRuleInlinable(rule)) {
			for (const className of selectorClasses) if (classSet.has(className)) appendRule(inlinableRules, className, rule);
		} else {
			const { inlinablePart, nonInlinablePart } = require_split_mixed_rule.splitMixedRule(rule);
			for (const className of selectorClasses) {
				if (!classSet.has(className)) continue;
				if (inlinablePart) appendRule(inlinableRules, className, inlinablePart);
				if (nonInlinablePart) appendRule(nonInlinableRules, className, nonInlinablePart);
			}
		}
	};
	(0, css_tree.walk)(root, {
		enter(node) {
			if (node.type === "Atrule") {
				if (require_constants.NON_INLINABLE_ATRULES.has(node.name.toLowerCase())) enclosingAtRules.push(node);
			} else if (node.type === "Rule") handleRule(node);
		},
		leave(node) {
			if (node.type === "Atrule" && require_constants.NON_INLINABLE_ATRULES.has(node.name.toLowerCase())) enclosingAtRules.pop();
		}
	});
	return {
		inlinable: inlinableRules,
		nonInlinable: nonInlinableRules
	};
}
//#endregion
exports.extractRulesPerClass = extractRulesPerClass;
