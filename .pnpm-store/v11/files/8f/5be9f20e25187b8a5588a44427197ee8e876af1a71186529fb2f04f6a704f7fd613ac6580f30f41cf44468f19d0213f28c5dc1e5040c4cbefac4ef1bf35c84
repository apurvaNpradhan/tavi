const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_element_marker = require("../element-marker.cjs");
const require_prism = require("./prism.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/components/code-block/code-block.tsx
const stylesForToken = (token, theme) => {
	let styles = { ...theme[token.type] };
	const aliases = Array.isArray(token.alias) ? token.alias : [token.alias];
	for (const alias of aliases) styles = {
		...styles,
		...theme[alias]
	};
	return styles;
};
const CodeBlockLine = ({ token, theme, inheritedStyles }) => {
	if (token instanceof require_prism.Prism.Token) {
		const styleForToken = {
			...inheritedStyles,
			...stylesForToken(token, theme)
		};
		if (token.content instanceof require_prism.Prism.Token) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: styleForToken,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CodeBlockLine, {
				theme,
				token: token.content
			})
		});
		if (typeof token.content === "string") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: styleForToken,
			children: token.content
		});
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: token.content.map((subToken, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CodeBlockLine, {
			inheritedStyles: styleForToken,
			theme,
			token: subToken
		}, i)) });
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		style: inheritedStyles,
		children: token.replaceAll(" ", "\xA0‍​")
	});
};
const CodeBlock = react.forwardRef(({ code, fontFamily, lineNumbers, theme, language, ...rest }, ref) => {
	const languageGrammar = require_prism.Prism.languages[language];
	if (typeof languageGrammar === "undefined") throw new Error(`CodeBlock: There is no language defined on Prism called ${language}`);
	const tokensPerLine = code.split(/\r\n|\r|\n/gm).map((line) => require_prism.Prism.tokenize(line, languageGrammar));
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
		...rest,
		ref,
		style: {
			...theme.base,
			width: "100%",
			...rest.style
		},
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: tokensPerLine.map((tokensForLine, lineIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [
			lineNumbers ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					width: "2em",
					height: "1em",
					display: "inline-block",
					fontFamily
				},
				children: lineIndex + 1
			}) : null,
			tokensForLine.map((token, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CodeBlockLine, {
				inheritedStyles: { fontFamily },
				theme,
				token
			}, i)),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {})
		] }, lineIndex)) })
	});
});
CodeBlock.displayName = "CodeBlock";
require_element_marker.markAsElement(CodeBlock);
//#endregion
exports.CodeBlock = CodeBlock;
