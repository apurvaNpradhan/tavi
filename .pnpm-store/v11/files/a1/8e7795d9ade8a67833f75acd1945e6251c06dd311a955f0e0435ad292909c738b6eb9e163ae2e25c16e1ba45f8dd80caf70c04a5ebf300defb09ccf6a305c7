import css from "./tailwind-stylesheets/index.mjs";
import css$1 from "./tailwind-stylesheets/preflight.mjs";
import css$2 from "./tailwind-stylesheets/theme.mjs";
import css$3 from "./tailwind-stylesheets/utilities.mjs";
import { parse } from "css-tree/dist/csstree.esm";
import { compile } from "tailwindcss";
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
	const compiler = await compile(baseCss, {
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
				content: css
			};
			if (id === "tailwindcss/preflight.css") return {
				base,
				path: id,
				content: css$1
			};
			if (id === "tailwindcss/theme.css") return {
				base,
				path: id,
				content: css$2
			};
			if (id === "tailwindcss/utilities.css") return {
				base,
				path: id,
				content: css$3
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
			return parse(css$4);
		}
	};
}
//#endregion
export { setupTailwind };
