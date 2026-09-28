import { resolveAllCssVariables } from "./utils/css/resolve-all-css-variables.mjs";
import { resolveCalcExpressions } from "./utils/css/resolve-calc-expressions.mjs";
import { sanitizeDeclarations } from "./utils/css/sanitize-declarations.mjs";
//#region src/components/tailwind/sanitize-stylesheet.ts
function sanitizeStyleSheet(styleSheet) {
	resolveAllCssVariables(styleSheet);
	resolveCalcExpressions(styleSheet);
	sanitizeDeclarations(styleSheet);
}
//#endregion
export { sanitizeStyleSheet };
