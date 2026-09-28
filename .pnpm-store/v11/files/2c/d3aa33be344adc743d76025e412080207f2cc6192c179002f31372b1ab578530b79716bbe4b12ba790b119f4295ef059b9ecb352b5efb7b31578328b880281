import { isRuleInlinable } from "./is-rule-inlinable.mjs";
import { stripEmptyTailwindVars } from "./strip-empty-tailwind-vars.mjs";
import { sanitizeClassName } from "../compatibility/sanitize-class-name.mjs";
import { string, walk } from "css-tree/dist/csstree.esm";
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
	walk(node, {
		visit: "Rule",
		enter(rule) {
			if (!isRuleInlinable(rule)) {
				walk(rule.prelude, (node) => {
					if (node.type === "ClassSelector") node.name = sanitizeClassName(string.decode(node.name));
				});
				walk(rule, {
					visit: "Declaration",
					enter(declaration, item, list) {
						if (declaration.property.startsWith("--tw-")) {
							list.remove(item);
							return;
						}
						declaration.important = true;
						stripEmptyTailwindVars(declaration.value);
					}
				});
			}
		}
	});
}
//#endregion
export { sanitizeNonInlinableRules };
