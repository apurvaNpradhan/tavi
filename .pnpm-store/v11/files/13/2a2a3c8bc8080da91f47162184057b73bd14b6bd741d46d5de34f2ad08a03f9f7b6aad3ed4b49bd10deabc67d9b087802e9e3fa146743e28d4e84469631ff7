Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let prettier_plugins_html = require("prettier/plugins/html");
prettier_plugins_html = __toESM(prettier_plugins_html);
let prettier_standalone = require("prettier/standalone");
let html_to_text = require("html-to-text");
let react = require("react");
react = __toESM(react);
let entities_lib_decode_js = require("entities/lib/decode.js");
let html5parser = require("html5parser");
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/shared/utils/pretty.ts
function getHtmlNode(path) {
	const topNode = path.node;
	if (topNode) return topNode;
	return path.stack?.[path.stack.length - 1];
}
function recursivelyMapDoc(doc, callback) {
	if (Array.isArray(doc)) return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
	if (typeof doc === "object") {
		if (doc.type === "line") return callback(doc.soft ? "" : " ");
		if (doc.type === "group") return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback),
			expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
		};
		if ("contents" in doc) return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback)
		};
		if ("parts" in doc) return {
			...doc,
			parts: recursivelyMapDoc(doc.parts, callback)
		};
		if (doc.type === "if-break") return {
			...doc,
			breakContents: recursivelyMapDoc(doc.breakContents, callback),
			flatContents: recursivelyMapDoc(doc.flatContents, callback)
		};
		const nextDoc = { ...doc };
		for (const [key, value] of Object.entries(nextDoc)) if (value && typeof value === "object") nextDoc[key] = recursivelyMapDoc(value, callback);
		return nextDoc;
	}
	return callback(doc);
}
const modifiedHtml = { ...prettier_plugins_html };
if (modifiedHtml.printers) {
	const previousPrint = modifiedHtml.printers.html.print;
	modifiedHtml.printers.html.print = (path, options, print, args) => {
		const node = getHtmlNode(path);
		const rawPrintingResult = previousPrint(path, options, print, args);
		if (node?.type === "ieConditionalComment" || node?.kind === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc) => {
			if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
			return doc;
		});
		return rawPrintingResult;
	};
}
const defaults = {
	endOfLine: "lf",
	tabWidth: 2,
	plugins: [modifiedHtml],
	bracketSameLine: true,
	parser: "html"
};
const pretty = (str, options = {}) => {
	return (0, prettier_standalone.format)(str.replaceAll("\0", ""), {
		...defaults,
		...options
	});
};
//#endregion
//#region src/shared/utils/to-plain-text.ts
const plainTextSelectors = [
	{
		selector: "img",
		format: "skip"
	},
	{
		selector: "[data-skip-in-text=true]",
		format: "skip"
	},
	{
		selector: "a",
		options: {
			linkBrackets: false,
			hideLinkHrefIfSameAsText: true
		}
	},
	{
		selector: "[data-text-format=\"dataTable\"]",
		format: "dataTable"
	}
];
function toPlainText(html, options) {
	return (0, html_to_text.convert)(html, {
		wordwrap: false,
		...options,
		selectors: [...plainTextSelectors, ...options?.selectors ?? []]
	});
}
//#endregion
//#region src/shared/utils/unstable-to-plain-text.ts
const SKIPPED_TAGS = new Set([
	"img",
	"noscript",
	"script",
	"style",
	"template"
]);
const WHITESPACE_RUN = /([ \t\n\r\f\u200b]+)/;
const TAG_BLOCKS = {
	article: {
		open: 2,
		close: 2
	},
	aside: {
		open: 2,
		close: 2
	},
	blockquote: {
		open: 2,
		close: 2,
		prefix: {
			first: "> ",
			rest: "> "
		}
	},
	div: {
		open: 2,
		close: 2
	},
	footer: {
		open: 2,
		close: 2
	},
	form: {
		open: 2,
		close: 2
	},
	h1: {
		open: 3,
		close: 2
	},
	h2: {
		open: 3,
		close: 2
	},
	h3: {
		open: 3,
		close: 2
	},
	h4: {
		open: 3,
		close: 2
	},
	h5: {
		open: 3,
		close: 2
	},
	h6: {
		open: 3,
		close: 2
	},
	header: {
		open: 2,
		close: 2
	},
	hr: {
		open: 2,
		close: 2
	},
	main: {
		open: 2,
		close: 2
	},
	nav: {
		open: 2,
		close: 2
	},
	p: {
		open: 2,
		close: 2
	},
	pre: {
		open: 2,
		close: 2
	},
	section: {
		open: 2,
		close: 2
	},
	table: {
		open: 2,
		close: 2
	}
};
function unstableToPlainText(html) {
	const tree = (0, html5parser.parse)(html, { setAttributeMap: true });
	const body = findBody(tree);
	const blocks = [{
		block: {
			open: 0,
			close: 0
		},
		text: [],
		leading: 0,
		stash: 0,
		space: false
	}];
	const stack = [{
		parent: body,
		children: body?.body ?? tree,
		index: 0,
		pre: false,
		opened: false,
		textFrom: 0,
		orderedList: void 0
	}];
	while (stack.length > 0) {
		const frame = stack[stack.length - 1];
		const node = frame.children[frame.index];
		if (node === void 0) {
			stack.pop();
			exitElement(frame.parent, frame);
			continue;
		}
		frame.index += 1;
		enterNode(node, frame);
	}
	function top() {
		return blocks[blocks.length - 1];
	}
	function writeWord(value) {
		const block = top();
		if (block.stash > 0) block.text.push("\n".repeat(block.stash));
		else if (block.space && block.text.length > 0) block.text.push(" ");
		block.stash = 0;
		block.space = false;
		block.text.push(value);
	}
	function enterNode(node, frame) {
		if (node.type === html5parser.SyntaxKind.Text) {
			const value = (0, entities_lib_decode_js.decodeHTML)(node.value);
			if (frame.pre) {
				if (value.length > 0) writeWord(value);
			} else {
				const segments = value.split(WHITESPACE_RUN);
				for (let i = 0; i < segments.length; i++) {
					const segment = segments[i];
					if (segment.length === 0) continue;
					if (i % 2 === 1) top().space = true;
					else writeWord(segment);
				}
			}
			return;
		}
		if (SKIPPED_TAGS.has(node.name) || (0, entities_lib_decode_js.decodeHTMLAttribute)(node.attributeMap?.["data-skip-in-text"]?.value?.value ?? "") === "true") return;
		const parentTag = frame.parent?.name;
		let block = TAG_BLOCKS[node.name];
		let orderedList;
		if (node.name === "ul") {
			const breaks = parentTag === "li" ? 1 : 2;
			block = {
				open: breaks,
				close: breaks
			};
		} else if (node.name === "li" && parentTag === "ul") block = {
			open: 1,
			close: 1,
			prefix: (stack[stack.length - 2]?.parent)?.name === "li" ? {
				first: "* ",
				rest: "  "
			} : {
				first: " * ",
				rest: "   "
			}
		};
		else if (node.name === "ol") {
			const nested = parentTag === "li";
			const parsedStart = Number.parseInt((0, entities_lib_decode_js.decodeHTMLAttribute)(node.attributeMap?.start?.value?.value ?? "1"), 10);
			const start = Number.isNaN(parsedStart) ? 1 : parsedStart;
			const itemCount = node.body?.filter((child) => child.type === html5parser.SyntaxKind.Tag && child.name === "li").length ?? 0;
			let prefixLength = 0;
			for (let index = start; index < start + itemCount; index++) {
				const prefix = `${nested ? "" : " "}${index}. `;
				prefixLength = Math.max(prefixLength, prefix.length);
			}
			const breaks = nested ? 1 : 2;
			block = {
				open: breaks,
				close: breaks
			};
			orderedList = {
				next: start,
				prefixLength,
				nested
			};
		} else if (node.name === "li" && parentTag === "ol" && frame.orderedList) {
			const list = frame.orderedList;
			block = {
				open: 1,
				close: 1,
				prefix: {
					first: `${list.nested ? "" : " "}${list.next++}. `.padEnd(list.prefixLength),
					rest: " ".repeat(list.prefixLength)
				}
			};
		}
		if (block) blocks.push({
			block,
			text: [],
			leading: block.open,
			stash: 0,
			space: false
		});
		if (node.name === "hr") writeWord("-".repeat(40));
		else if (node.name === "br") {
			top().space = false;
			top().text.push("\n");
		}
		stack.push({
			parent: node,
			children: node.body ?? [],
			index: 0,
			pre: frame.pre || node.name === "pre",
			opened: block !== void 0,
			textFrom: top().text.length,
			orderedList
		});
	}
	function exitElement(element, frame) {
		if (element === void 0) return;
		if (element.name === "a") {
			const href = (0, entities_lib_decode_js.decodeHTMLAttribute)(element.attributeMap?.href?.value?.value ?? "").replace(/^mailto:/, "");
			if (href.length > 0 && !href.startsWith("#")) {
				const anchorText = top().text.slice(frame.textFrom).join("");
				if (anchorText !== href) {
					if (anchorText.length > 0) top().space = true;
					writeWord(href);
				}
			}
		}
		if (frame.opened) closeBlock();
	}
	function closeBlock() {
		const child = blocks.pop();
		if (child === void 0) return;
		const parent = blocks[blocks.length - 1];
		let content = child.text.join("");
		const prefix = child.block.prefix;
		if (prefix !== void 0) {
			const trimmed = content.replace(/^\n+|\n+$/g, "");
			content = prefix.first + trimmed.replaceAll("\n", `\n${prefix.rest}`);
		}
		const breaks = Math.max(parent.stash, child.leading);
		if (parent.text.length > 0) {
			parent.text.push("\n".repeat(breaks));
			if (content.length > 0) parent.text.push(content);
		} else {
			if (content.length > 0) parent.text.push(content);
			parent.leading = breaks;
		}
		parent.stash = Math.max(child.stash, child.block.close);
	}
	return blocks[0].text.join("");
}
function findBody(tree) {
	for (const child of tree) {
		if (child.type !== html5parser.SyntaxKind.Tag || child.name !== "html") continue;
		for (const inner of child.body ?? []) if (inner.type === html5parser.SyntaxKind.Tag && inner.name === "body") return inner;
	}
}
//#endregion
//#region src/shared/error-boundary.tsx
function createErrorBoundary(reject) {
	if (!react.default.Component) return (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: props.children });
	return class ErrorBoundary extends react.default.Component {
		componentDidCatch(error) {
			reject(error);
		}
		render() {
			return this.props.children;
		}
	};
}
//#endregion
//#region src/shared/utils/strip-image-preload-links.ts
/**
* React injects `<link rel="preload" as="image" />` resource hints into the
* document `<head>` for every `<img>` it renders during server-side rendering.
*
* These hints are meant for browsers loading a web page, where they can speed
* up the initial paint. In an email they are dead weight: email clients ignore
* `<link rel="preload">`, and the tags only add noise to the rendered HTML.
*
* @see https://github.com/resend/react-email/issues/3034
*
* This removes only those auto-injected image preload links, leaving every
* other `<link>` (stylesheets, fonts, user-authored non-image preloads, ...)
* untouched. It parses each `<link>` tag's attributes instead of relying on a
* fixed string match, so it is not affected by attribute order or spacing.
*/
const stripImagePreloadLinks = (html) => {
	return html.replace(/<link\b[^>]*\/?>/gi, (tag) => isImagePreloadLink(tag) ? "" : tag);
};
const isImagePreloadLink = (tag) => {
	const attributes = parseAttributes(tag);
	return attributes.rel === "preload" && attributes.as === "image";
};
const ATTRIBUTE_PATTERN = /([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;
/**
* Parses the attributes of a single, already-isolated HTML tag string (e.g.
* `<link rel="preload" as="image" href="..." />`) into a name → value map.
* Attribute names are lower-cased; values are read from double, single, or
* unquoted forms.
*/
const parseAttributes = (tag) => {
	const attributeSection = tag.replace(/^<[a-z][a-z0-9-]*/i, "");
	const attributes = {};
	for (const [, name, doubleQuoted, singleQuoted, unquoted] of attributeSection.matchAll(ATTRIBUTE_PATTERN)) attributes[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
	return attributes;
};
//#endregion
//#region src/shared/read-stream.browser.ts
const decoder = new TextDecoder("utf-8");
const readStream = async (stream) => {
	const chunks = [];
	const writableStream = new WritableStream({
		write(chunk) {
			chunks.push(chunk);
		},
		abort(reason) {
			throw new Error("Stream aborted", { cause: { reason } });
		}
	});
	await stream.pipeTo(writableStream);
	let length = 0;
	chunks.forEach((item) => {
		length += item.length;
	});
	const mergedChunks = new Uint8Array(length);
	let offset = 0;
	chunks.forEach((item) => {
		mergedChunks.set(item, offset);
		offset += item.length;
	});
	return decoder.decode(mergedChunks);
};
//#endregion
//#region src/edge/import-react-dom.tsx
const importReactDom = () => {
	return import("react-dom/server.edge").catch(() => import("react-dom/server"));
};
//#endregion
//#region src/edge/render.tsx
const render = async (element, options) => {
	const reactDOMServer = await importReactDom().then((m) => {
		if ("default" in m) return m.default;
		return m;
	});
	const html = await new Promise((resolve, reject) => {
		const ErrorBoundary = createErrorBoundary(reject);
		reactDOMServer.renderToReadableStream(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, { children: element }) }), {
			onError(error) {
				reject(error);
			},
			progressiveChunkSize: Number.POSITIVE_INFINITY
		}).then(async (stream) => {
			await stream.allReady;
			return readStream(stream);
		}).then((result) => resolve(stripImagePreloadLinks(result))).catch(reject);
	});
	if (options?.plainText) return options.unstableTextConversion ? unstableToPlainText(html) : toPlainText(html, options.htmlToTextOptions);
	const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html.replace(/<!DOCTYPE.*?>/, "")}`;
	if (options?.pretty) return pretty(document);
	return document;
};
//#endregion
exports.plainTextSelectors = plainTextSelectors;
exports.pretty = pretty;
exports.render = render;
exports.toPlainText = toPlainText;
