require("../../../../_virtual/_rolldown/runtime.cjs");
const require_constants = require("./constants.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/downlevel-for-email-clients.ts
/**
* Downlevels modern CSS features that email clients don't support,
* operating on a css-tree StyleSheet AST.
*
* 1. CSS Nesting: unnests @media rules from inside selectors
*    `.sm_p-4{@media (min-width:40rem){padding:1rem!important}}`
*    → `@media (min-width:40rem){.sm_p-4{padding:1rem!important}}`
*
* 2. Media Queries Level 4 range syntax → legacy min-width/max-width
*    `(width>=40rem)` → `(min-width:40rem)`
*
* Gmail, Outlook, Yahoo, and most email clients don't support either feature.
* See: https://www.caniemail.com/features/css-at-media/
*      https://www.caniemail.com/features/css-nesting/
*/
/**
* Unnest @media at-rules from inside regular rules, and downlevel
* range media query syntax to legacy min-width/max-width.
*
* Mutates the stylesheet in place.
*/
function downlevelForEmailClients(styleSheet) {
	unnestMediaQueries(styleSheet);
	downlevelRangeMediaQueries(styleSheet);
}
/**
* Walk the stylesheet and unnest any @media/@supports rules that are nested
* inside regular rules. For each, the parent Rule's selector wraps the
* at-rule's body.
*
* Before: `.sm_p-4 { @media (...) { padding: 1rem } }`
* After:  `@media (...) { .sm_p-4 { padding: 1rem } }`
*/
function unnestMediaQueries(styleSheet) {
	const transforms = [];
	(0, css_tree.walk)(styleSheet, {
		visit: "Rule",
		enter(rule, item, list) {
			if (!rule.block || !item) return;
			const nestedAtrules = [];
			const remainingChildren = [];
			rule.block.children.forEach((child) => {
				if (child.type === "Atrule" && require_constants.NON_INLINABLE_ATRULES.has(child.name.toLowerCase())) nestedAtrules.push(child);
				else remainingChildren.push(child);
			});
			if (nestedAtrules.length > 0) transforms.push({
				parentRule: rule,
				parentItem: item,
				parentList: list,
				nestedAtrules,
				remainingChildren
			});
		}
	});
	for (let i = transforms.length - 1; i >= 0; i--) {
		const { parentRule, parentItem, parentList, nestedAtrules, remainingChildren } = transforms[i];
		const replacements = new css_tree.List();
		if (remainingChildren.length > 0) {
			parentRule.block.children = new css_tree.List().fromArray(remainingChildren);
			replacements.appendData(parentRule);
		}
		for (const atrule of nestedAtrules) {
			const wrappedRule = {
				type: "Rule",
				prelude: (0, css_tree.clone)(parentRule.prelude),
				block: {
					type: "Block",
					children: atrule.block ? atrule.block.children : new css_tree.List()
				}
			};
			const newAtrule = {
				type: "Atrule",
				name: atrule.name,
				prelude: atrule.prelude,
				block: {
					type: "Block",
					children: new css_tree.List().fromArray([wrappedRule])
				}
			};
			replacements.appendData(newAtrule);
		}
		parentList.replace(parentItem, replacements);
	}
}
/**
* Walk all nodes and downlevel range syntax (`FeatureRange`) inside @media
* preludes to legacy `Feature` nodes (`min-width` / `max-width`).
*/
function downlevelRangeMediaQueries(styleSheet) {
	const replacements = [];
	(0, css_tree.walk)(styleSheet, { enter(originalNode, item) {
		const node = originalNode;
		if (item && node.type === "FeatureRange") {
			const replacement = downlevelFeatureRange(node);
			if (replacement) replacements.push({
				item,
				replacement
			});
		}
	} });
	for (const { item, replacement } of replacements) item.data = replacement;
}
/**
* Convert a `FeatureRange` node to a `Feature` node (legacy min-/max- syntax).
*
* For `width >= 40rem`: left=Identifier("width"), leftComparison=">=", middle=Dimension("40","rem")
* Result: { type: "Feature", name: "min-width", value: Dimension("40","rem") }
*/
function downlevelFeatureRange(range) {
	if (range.left.type !== "Identifier") return null;
	let prefix;
	if (range.leftComparison === ">=" || range.leftComparison === ">") prefix = "min-";
	else if (range.leftComparison === "<=" || range.leftComparison === "<") prefix = "max-";
	else return null;
	return {
		type: "Feature",
		kind: "media",
		name: `${prefix}${range.left.name}`,
		value: range.middle
	};
}
//#endregion
exports.downlevelForEmailClients = downlevelForEmailClients;
