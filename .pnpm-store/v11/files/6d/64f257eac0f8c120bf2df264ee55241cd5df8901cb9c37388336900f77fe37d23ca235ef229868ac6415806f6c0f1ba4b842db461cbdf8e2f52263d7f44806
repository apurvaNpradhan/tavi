require("../../../../_virtual/_rolldown/runtime.cjs");
const require_index = require("./tailwind-stylesheets/index.cjs");
const require_preflight = require("./tailwind-stylesheets/preflight.cjs");
const require_theme = require("./tailwind-stylesheets/theme.cjs");
const require_utilities = require("./tailwind-stylesheets/utilities.cjs");
let css_tree = require("css-tree");
let tailwindcss = require("tailwindcss");
//#region src/components/tailwind/utils/tailwindcss/setup-tailwind.ts
const SETUP_TAILWIND_KEYS = new Set(["config", "cssConfigs"]);
async function setupTailwind(props = {}) {
	const stray = Object.keys(props).filter((k) => !SETUP_TAILWIND_KEYS.has(k));
	if (stray.length > 0) throw new Error(`setupTailwind now takes { config, cssConfigs } — received unexpected keys: ${stray.join(", ")}. If you used to call setupTailwind(config), wrap it: setupTailwind({ config }).`);
	const { config, cssConfigs } = props;
	const baseCss = `
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
${cssConfigs?.theme ? "@import \"custom-theme.css\" layer(theme);" : ""}
${cssConfigs?.utility ? "@import \"custom-utilities.css\" layer(utilities);" : ""}
@config;
`;
	const compiler = await (0, tailwindcss.compile)(baseCss, {
		async loadModule(id, base, resourceHint) {
			if (resourceHint === "config") return {
				path: id,
				base,
				module: config ?? {}
			};
			throw new Error(`NO-OP: should we implement support for ${resourceHint}?`);
		},
		polyfills: 0,
		async loadStylesheet(id, base) {
			if (id === "tailwindcss") return {
				base,
				path: "tailwindcss/index.css",
				content: require_index.default
			};
			if (id === "tailwindcss/preflight.css") return {
				base,
				path: id,
				content: require_preflight.default
			};
			if (id === "tailwindcss/theme.css") return {
				base,
				path: id,
				content: require_theme.default
			};
			if (id === "tailwindcss/utilities.css") return {
				base,
				path: id,
				content: require_utilities.default
			};
			if (id === "custom-theme.css") return {
				base,
				path: id,
				content: cssConfigs?.theme ?? ""
			};
			if (id === "custom-utilities.css") return {
				base,
				path: id,
				content: cssConfigs?.utility ?? ""
			};
			throw new Error("stylesheet not supported, you can only import the ones from tailwindcss");
		}
	});
	let css$4 = baseCss;
	return {
		addUtilities: function addUtilities(candidates) {
			css$4 = compiler.build(candidates);
		},
		getStyleSheet: function getCss() {
			return (0, css_tree.parse)(css$4);
		}
	};
}
//#endregion
exports.setupTailwind = setupTailwind;
