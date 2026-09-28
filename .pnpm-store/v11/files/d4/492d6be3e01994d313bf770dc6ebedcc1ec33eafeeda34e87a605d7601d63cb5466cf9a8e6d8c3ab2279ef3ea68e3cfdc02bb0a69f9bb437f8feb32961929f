const require_resolve_all_css_variables = require("./utils/css/resolve-all-css-variables.cjs");
const require_resolve_calc_expressions = require("./utils/css/resolve-calc-expressions.cjs");
const require_sanitize_declarations = require("./utils/css/sanitize-declarations.cjs");
//#region src/components/tailwind/sanitize-stylesheet.ts
function sanitizeStyleSheet(styleSheet) {
	require_resolve_all_css_variables.resolveAllCssVariables(styleSheet);
	require_resolve_calc_expressions.resolveCalcExpressions(styleSheet);
	require_sanitize_declarations.sanitizeDeclarations(styleSheet);
}
//#endregion
exports.sanitizeStyleSheet = sanitizeStyleSheet;
