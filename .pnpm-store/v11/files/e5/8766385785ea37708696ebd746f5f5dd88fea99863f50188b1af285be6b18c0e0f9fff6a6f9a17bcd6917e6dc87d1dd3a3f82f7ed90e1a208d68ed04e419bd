require("../../../../_virtual/_rolldown/runtime.cjs");
const require_is_rule_inlinable = require("./is-rule-inlinable.cjs");
const require_strip_empty_tailwind_vars = require("./strip-empty-tailwind-vars.cjs");
const require_sanitize_class_name = require("../compatibility/sanitize-class-name.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/sanitize-non-inlinable-rules.ts
/**
* This function goes through a few steps to ensure the best email client support and
* to ensure that media queries and pseudo classes are applied correctly alongside
* the inline styles.
*
* What it does:
* 1. Converts all declarations in all rules into important ones
* 2. Sanitizes class selectors of all non-inlinable rules
* 3. Removes --tw-* custom property declarations — by this point all CSS
*    variables have been resolved, so these are dead weight in email HTML.
* 4. Strips empty-fallback var(--tw-*,) refs that Tailwind v4 emits for
*    variant-stacking idioms (filter, font-variant-numeric, etc.) — email
*    clients can't resolve CSS custom properties reliably, so any --tw-*
*    left as a bare empty-fallback ref would reach the client broken.
*/
function sanitizeNonInlinableRules(node) {
	(0, css_tree.walk)(node, {
		visit: "Rule",
		enter(rule) {
			if (!require_is_rule_inlinable.isRuleInlinable(rule)) {
				(0, css_tree.walk)(rule.prelude, (node) => {
					if (node.type === "ClassSelector") node.name = require_sanitize_class_name.sanitizeClassName(css_tree.string.decode(node.name));
				});
				(0, css_tree.walk)(rule, {
					visit: "Declaration",
					enter(declaration, item, list) {
						if (declaration.property.startsWith("--tw-")) {
							list.remove(item);
							return;
						}
						declaration.important = true;
						require_strip_empty_tailwind_vars.stripEmptyTailwindVars(declaration.value);
					}
				});
			}
		}
	});
}
//#endregion
exports.sanitizeNonInlinableRules = sanitizeNonInlinableRules;
