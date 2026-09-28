require("../../_virtual/_rolldown/runtime.cjs");
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/font/font.tsx
/** The component MUST be place inside the <head> tag */
const Font = ({ fontFamily, fallbackFontFamily, webFont, fontStyle = "normal", fontWeight = 400 }) => {
	const src = webFont ? `src: url(${webFont.url}) format('${webFont.format}');` : "";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
    @font-face {
      font-family: '${fontFamily}';
      font-style: ${fontStyle};
      font-weight: ${fontWeight};
      mso-font-alt: '${Array.isArray(fallbackFontFamily) ? fallbackFontFamily[0] : fallbackFontFamily}';
      ${src}
    }

    * {
      font-family: '${fontFamily}', ${Array.isArray(fallbackFontFamily) ? fallbackFontFamily.join(", ") : fallbackFontFamily};
    }
  ` } });
};
//#endregion
exports.Font = Font;
