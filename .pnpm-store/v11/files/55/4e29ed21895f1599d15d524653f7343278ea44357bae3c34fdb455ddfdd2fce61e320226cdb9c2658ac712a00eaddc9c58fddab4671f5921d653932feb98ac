import { markAsElement } from "../element-marker.mjs";
import { Prism } from "./prism.mjs";
import * as React$1 from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
	if (token instanceof Prism.Token) {
		const styleForToken = {
			...inheritedStyles,
			...stylesForToken(token, theme)
		};
		if (token.content instanceof Prism.Token) return /* @__PURE__ */ jsx("span", {
			style: styleForToken,
			children: /* @__PURE__ */ jsx(CodeBlockLine, {
				theme,
				token: token.content
			})
		});
		if (typeof token.content === "string") return /* @__PURE__ */ jsx("span", {
			style: styleForToken,
			children: token.content
		});
		return /* @__PURE__ */ jsx(Fragment, { children: token.content.map((subToken, i) => /* @__PURE__ */ jsx(CodeBlockLine, {
			inheritedStyles: styleForToken,
			theme,
			token: subToken
		}, i)) });
	}
	return /* @__PURE__ */ jsx("span", {
		style: inheritedStyles,
		children: token.replaceAll(" ", "\xA0‍​")
	});
};
const CodeBlock = React$1.forwardRef(({ code, fontFamily, lineNumbers, theme, language, ...rest }, ref) => {
	const languageGrammar = Prism.languages[language];
	if (typeof languageGrammar === "undefined") throw new Error(`CodeBlock: There is no language defined on Prism called ${language}`);
	const tokensPerLine = code.split(/\r\n|\r|\n/gm).map((line) => Prism.tokenize(line, languageGrammar));
	return /* @__PURE__ */ jsx("pre", {
		...rest,
		ref,
		style: {
			...theme.base,
			width: "100%",
			...rest.style
		},
		children: /* @__PURE__ */ jsx("code", { children: tokensPerLine.map((tokensForLine, lineIndex) => /* @__PURE__ */ jsxs(React$1.Fragment, { children: [
			lineNumbers ? /* @__PURE__ */ jsx("span", {
				style: {
					width: "2em",
					height: "1em",
					display: "inline-block",
					fontFamily
				},
				children: lineIndex + 1
			}) : null,
			tokensForLine.map((token, i) => /* @__PURE__ */ jsx(CodeBlockLine, {
				inheritedStyles: { fontFamily },
				theme,
				token
			}, i)),
			/* @__PURE__ */ jsx("br", {})
		] }, lineIndex)) })
	});
});
CodeBlock.displayName = "CodeBlock";
markAsElement(CodeBlock);
//#endregion
export { CodeBlock };
