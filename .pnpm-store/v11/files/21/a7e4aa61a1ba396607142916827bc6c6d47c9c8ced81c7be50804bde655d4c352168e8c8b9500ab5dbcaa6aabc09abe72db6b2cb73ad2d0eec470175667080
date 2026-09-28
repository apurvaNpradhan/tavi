const require_runtime = require("../../_virtual/_rolldown/runtime.cjs");
const require_styles = require("./styles.cjs");
const require_parse_css_in_js_to_inline_css = require("./utils/parse-css-in-js-to-inline-css.cjs");
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let marked = require("marked");
//#region src/components/markdown/markdown.tsx
const Markdown = react.forwardRef(({ children, markdownContainerStyles, markdownCustomStyles, ...props }, ref) => {
	const finalStyles = {
		...require_styles.styles,
		...markdownCustomStyles
	};
	const renderer = new marked.Renderer();
	renderer.blockquote = ({ tokens }) => {
		const text = renderer.parser.parse(tokens);
		return `<blockquote${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.blockQuote) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.blockQuote)}"` : ""}>\n${text}</blockquote>\n`;
	};
	renderer.br = () => {
		return `<br${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.br) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.br)}"` : ""} />`;
	};
	renderer.code = ({ text }) => {
		text = `${text.replace(/\n$/, "")}\n`;
		return `<pre${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.codeBlock) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.codeBlock)}"` : ""}><code>${text}</code></pre>\n`;
	};
	renderer.codespan = ({ text }) => {
		return `<code${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.codeInline) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.codeInline)}"` : ""}>${text}</code>`;
	};
	renderer.del = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<del${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.strikethrough) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.strikethrough)}"` : ""}>${text}</del>`;
	};
	renderer.em = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<em${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.italic) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.italic)}"` : ""}>${text}</em>`;
	};
	renderer.heading = ({ tokens, depth }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<h${depth}${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles[`h${depth}`]) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles[`h${depth}`])}"` : ""}>${text}</h${depth}>`;
	};
	renderer.hr = () => {
		return `<hr${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.hr) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.hr)}"` : ""} />\n`;
	};
	renderer.image = ({ href, text, title }) => {
		return `<img src="${href.replaceAll("\"", "&quot;")}" alt="${text.replaceAll("\"", "&quot;")}"${title ? ` title="${title.replaceAll("\"", "&quot;")}"` : ""}${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.image) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.image)}"` : ""}>`;
	};
	renderer.link = ({ href, title, tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<a href="${href.replaceAll("\"", "&quot;")}" target="_blank"${title ? ` title="${title.replaceAll("\"", "&quot;")}"` : ""}${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.link) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.link)}"` : ""}>${text}</a>`;
	};
	renderer.listitem = ({ tokens, loose }) => {
		const hasNestedList = tokens.some((token) => token.type === "list");
		const text = loose || hasNestedList ? renderer.parser.parse(tokens) : renderer.parser.parseInline(tokens);
		return `<li${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.li) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.li)}"` : ""}>${text}</li>\n`;
	};
	renderer.list = ({ items, ordered, start }) => {
		const type = ordered ? "ol" : "ul";
		const startAt = ordered && start !== 1 ? ` start="${start}"` : "";
		const styles = require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles[ordered ? "ol" : "ul"]);
		return "<" + type + startAt + `${styles !== "" ? ` style="${styles}"` : ""}>\n` + items.map((item) => renderer.listitem(item)).join("") + "</" + type + ">\n";
	};
	renderer.paragraph = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<p${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.p) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.p)}"` : ""}>${text}</p>\n`;
	};
	renderer.strong = ({ tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		return `<strong${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.bold) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.bold)}"` : ""}>${text}</strong>`;
	};
	renderer.table = ({ header, rows }) => {
		const styleTable = require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.table);
		const styleThead = require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.thead);
		const styleTbody = require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.tbody);
		const theadRow = renderer.tablerow({ text: header.map((cell) => renderer.tablecell(cell)).join("") });
		const tbodyRows = rows.map((row) => renderer.tablerow({ text: row.map((cell) => renderer.tablecell(cell)).join("") })).join("");
		const thead = `<thead${styleThead ? ` style="${styleThead}"` : ""}>\n${theadRow}</thead>`;
		const tbody = `<tbody${styleTbody ? ` style="${styleTbody}"` : ""}>${tbodyRows}</tbody>`;
		return `<table role="presentation"${styleTable ? ` style="${styleTable}"` : ""}>\n${thead}\n${tbody}</table>\n`;
	};
	renderer.tablecell = ({ tokens, align, header }) => {
		const text = renderer.parser.parseInline(tokens);
		const type = header ? "th" : "td";
		return `${align ? `<${type} align="${align}"${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.td) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.td)}"` : ""}>` : `<${type}${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.td) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.td)}"` : ""}>`}${text}</${type}>\n`;
	};
	renderer.tablerow = ({ text }) => {
		return `<tr${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.tr) !== "" ? ` style="${require_parse_css_in_js_to_inline_css.parseCssInJsToInlineCss(finalStyles.tr)}"` : ""}>\n${text}</tr>\n`;
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		...props,
		dangerouslySetInnerHTML: { __html: marked.marked.parse(children, {
			renderer,
			async: false
		}) },
		"data-id": "react-email-markdown",
		ref,
		style: markdownContainerStyles
	});
});
Markdown.displayName = "Markdown";
//#endregion
exports.Markdown = Markdown;
