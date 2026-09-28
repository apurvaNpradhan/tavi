require("../../../../_virtual/_rolldown/runtime.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/strip-empty-tailwind-vars.ts
/**
* Tailwind v4 emits variant-stacking idioms like
*   font-variant-numeric: var(--tw-ordinal,) var(--tw-slashed-zero,) tabular-nums var(--tw-numeric-fraction,)
*   filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-invert,) ...
* where each var() has an empty fallback so missing variants collapse to nothing.
* Tailwind deliberately leaves these variant vars undefined until used, so they
* stay in the output here and produce unresolvable custom properties in email HTML
* (no email client supports CSS custom properties reliably). Per the CSS spec
* (https://www.w3.org/TR/css-variables-1/#using-variables) an empty fallback means
* "use empty string if the variable is undefined", which is exactly what we want.
*
* Scoped to the `--tw-` prefix so any user-authored empty-fallback var() refs
* are left untouched.
*
* Uses post-order traversal so an outer var(--tw-X, var(--tw-Y,)) collapses
* correctly after the inner var() has been removed.
*/
function stripEmptyTailwindVars(node) {
	(0, css_tree.walk)(node, {
		visit: "Function",
		leave(func, funcItem, funcList) {
			if (func.name !== "var") return;
			let variableName;
			(0, css_tree.walk)(func, {
				visit: "Identifier",
				enter(identifier) {
					variableName = identifier.name;
					return this.break;
				}
			});
			if (!variableName?.startsWith("--tw-")) return;
			let sawComma = false;
			let hasFallbackContent = false;
			func.children.forEach((child) => {
				if (!sawComma) {
					if (child.type === "Operator" && child.value === ",") sawComma = true;
					return;
				}
				let childValue = (0, css_tree.generate)(child).trim();
				if (child.type === "Raw") childValue = childValue.replaceAll(/var\(--tw-[^,()]+,\s*\)/g, "").trim();
				if (childValue.length > 0) hasFallbackContent = true;
			});
			if (!sawComma || hasFallbackContent) return;
			funcList.remove(funcItem);
		}
	});
}
//#endregion
exports.stripEmptyTailwindVars = stripEmptyTailwindVars;
