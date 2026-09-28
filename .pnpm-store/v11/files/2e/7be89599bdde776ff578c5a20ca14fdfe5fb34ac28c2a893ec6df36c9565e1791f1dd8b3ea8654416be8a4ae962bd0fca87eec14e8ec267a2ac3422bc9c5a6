require("../../../../_virtual/_rolldown/runtime.cjs");
let css_tree = require("css-tree");
//#region src/components/tailwind/utils/css/sanitize-declarations.ts
function rgbNode(r, g, b, alpha) {
	const children = new css_tree.List();
	children.appendData({
		type: "Number",
		value: r.toFixed(0)
	});
	children.appendData({
		type: "Operator",
		value: ","
	});
	children.appendData({
		type: "Number",
		value: g.toFixed(0)
	});
	children.appendData({
		type: "Operator",
		value: ","
	});
	children.appendData({
		type: "Number",
		value: b.toFixed(0)
	});
	if (alpha !== 1 && alpha !== void 0) {
		children.appendData({
			type: "Operator",
			value: ","
		});
		children.appendData({
			type: "Number",
			value: alpha.toString()
		});
	}
	return {
		type: "Function",
		name: "rgb",
		children
	};
}
const LAB_TO_LMS = {
	l: [.3963377773761749, .2158037573099136],
	m: [-.1055613458156586, -.0638541728258133],
	s: [-.0894841775298119, -1.2914855480194092]
};
const LSM_TO_RGB = {
	r: [
		4.076741636075958,
		-3.307711539258063,
		.2309699031821043
	],
	g: [
		-1.2684379732850315,
		2.609757349287688,
		-.341319376002657
	],
	b: [
		-.0041960761386756,
		-.7034186179359362,
		1.7076146940746117
	]
};
function lrgbToRgb(input) {
	const absoluteNumber = Math.abs(input);
	const sign = input < 0 ? -1 : 1;
	if (absoluteNumber > .0031308) return sign * (absoluteNumber ** (1 / 2.4) * 1.055 - .055);
	return input * 12.92;
}
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
function oklchToOklab(oklch) {
	return {
		l: oklch.l,
		a: oklch.c * Math.cos(oklch.h / 180 * Math.PI),
		b: oklch.c * Math.sin(oklch.h / 180 * Math.PI)
	};
}
/** Convert oklab to RGB */
function oklchToRgb(oklch) {
	const oklab = oklchToOklab(oklch);
	const l = (oklab.l + LAB_TO_LMS.l[0] * oklab.a + LAB_TO_LMS.l[1] * oklab.b) ** 3;
	const m = (oklab.l + LAB_TO_LMS.m[0] * oklab.a + LAB_TO_LMS.m[1] * oklab.b) ** 3;
	const s = (oklab.l + LAB_TO_LMS.s[0] * oklab.a + LAB_TO_LMS.s[1] * oklab.b) ** 3;
	const r = 255 * lrgbToRgb(LSM_TO_RGB.r[0] * l + LSM_TO_RGB.r[1] * m + LSM_TO_RGB.r[2] * s);
	const g = 255 * lrgbToRgb(LSM_TO_RGB.g[0] * l + LSM_TO_RGB.g[1] * m + LSM_TO_RGB.g[2] * s);
	const b = 255 * lrgbToRgb(LSM_TO_RGB.b[0] * l + LSM_TO_RGB.b[1] * m + LSM_TO_RGB.b[2] * s);
	return {
		r: clamp(r, 0, 255),
		g: clamp(g, 0, 255),
		b: clamp(b, 0, 255)
	};
}
function separteShorthandDeclaration(shorthandToReplace, [start, end]) {
	shorthandToReplace.property = start;
	const values = shorthandToReplace.value.type === "Value" ? shorthandToReplace.value.children.toArray().filter((child) => child.type !== "Operator" && child.type !== "WhiteSpace") : [shorthandToReplace.value];
	let endValue = shorthandToReplace.value;
	if (values.length === 2) {
		endValue = {
			type: "Value",
			children: new css_tree.List().fromArray([values[1]])
		};
		shorthandToReplace.value = {
			type: "Value",
			children: new css_tree.List().fromArray([values[0]])
		};
	}
	return {
		type: "Declaration",
		property: end,
		value: endValue,
		important: shorthandToReplace.important
	};
}
/**
* Meant to do all the things necessary, in a per-declaration basis, to have the best email client
* support possible.
*
* Here's the transformations it does so far:
* - convert all `rgb` with space-based syntax into a comma based one;
* - convert all `oklch` values into `rgb`;
* - convert all hex values into `rgb`;
* - convert `padding-inline` into `padding-left` and `padding-right`;
* - convert `padding-block` into `padding-top` and `padding-bottom`;
* - convert `margin-inline` into `margin-left` and `margin-right`;
* - convert `margin-block` into `margin-top` and `margin-bottom`.
*/
function sanitizeDeclarations(nodeContainingDeclarations) {
	(0, css_tree.walk)(nodeContainingDeclarations, {
		visit: "Declaration",
		enter(declaration, item, list) {
			if (declaration.value.type === "Raw") declaration.value = (0, css_tree.parse)(declaration.value.value, { context: "value" });
			if (/border-(?:[a-z]+-){0,2}radius\s*:\s*calc\s*\(\s*infinity\s*\*\s*1px\s*\)/i.test((0, css_tree.generate)(declaration))) declaration.value = (0, css_tree.parse)("9999px", { context: "value" });
			(0, css_tree.walk)(declaration, {
				visit: "Function",
				enter(func, funcParentListItem) {
					const children = func.children.toArray();
					if (func.name === "oklch") {
						let l;
						let c;
						let h;
						let a;
						for (const child of children) {
							if (child.type === "Number") {
								if (l === void 0) {
									l = Number.parseFloat(child.value);
									continue;
								}
								if (c === void 0) {
									c = Number.parseFloat(child.value);
									continue;
								}
								if (h === void 0) {
									h = Number.parseFloat(child.value);
									continue;
								}
								if (a === void 0) {
									a = Number.parseFloat(child.value);
									continue;
								}
							}
							if (child.type === "Dimension" && child.unit === "deg") {
								if (h === void 0) {
									h = Number.parseFloat(child.value);
									continue;
								}
							}
							if (child.type === "Percentage") {
								if (l === void 0) {
									l = Number.parseFloat(child.value) / 100;
									continue;
								}
								if (a === void 0) a = Number.parseFloat(child.value) / 100;
							}
						}
						if (l === void 0 || c === void 0 || h === void 0) throw new Error("Could not determine the parameters of an oklch() function.", { cause: declaration });
						const rgb = oklchToRgb({
							l,
							c,
							h
						});
						funcParentListItem.data = rgbNode(rgb.r, rgb.g, rgb.b, a);
					}
					if (func.name === "rgb" || func.name === "rgba") {
						let r;
						let g;
						let b;
						let a;
						for (const child of children) {
							if (child.type === "Number") {
								if (r === void 0) {
									r = Number.parseFloat(child.value);
									continue;
								}
								if (g === void 0) {
									g = Number.parseFloat(child.value);
									continue;
								}
								if (b === void 0) {
									b = Number.parseFloat(child.value);
									continue;
								}
								if (a === void 0) {
									a = Number.parseFloat(child.value);
									continue;
								}
							}
							if (child.type === "Percentage") {
								if (r === void 0) {
									r = Number.parseFloat(child.value) * 255 / 100;
									continue;
								}
								if (g === void 0) {
									g = Number.parseFloat(child.value) * 255 / 100;
									continue;
								}
								if (b === void 0) {
									b = Number.parseFloat(child.value) * 255 / 100;
									continue;
								}
								if (a === void 0) a = Number.parseFloat(child.value) / 100;
							}
						}
						if (r === void 0 || g === void 0 || b === void 0) throw new Error("Could not determine the parameters of an rgb() function.", { cause: declaration });
						if (a === void 0 || a === 1) funcParentListItem.data = rgbNode(r, g, b);
						else funcParentListItem.data = rgbNode(r, g, b, a);
					}
				}
			});
			(0, css_tree.walk)(declaration, {
				visit: "Hash",
				enter(hash, hashParentListItem) {
					const hex = hash.value.trim();
					if (hex.length === 3) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.charAt(0) + hex.charAt(0), 16), Number.parseInt(hex.charAt(1) + hex.charAt(1), 16), Number.parseInt(hex.charAt(2) + hex.charAt(2), 16));
						return;
					}
					if (hex.length === 4) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.charAt(0) + hex.charAt(0), 16), Number.parseInt(hex.charAt(1) + hex.charAt(1), 16), Number.parseInt(hex.charAt(2) + hex.charAt(2), 16), Number.parseInt(hex.charAt(3) + hex.charAt(3), 16) / 255);
						return;
					}
					if (hex.length === 5) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.charAt(2) + hex.charAt(2), 16), Number.parseInt(hex.charAt(3) + hex.charAt(3), 16), Number.parseInt(hex.charAt(4) + hex.charAt(4), 16) / 255);
						return;
					}
					if (hex.length === 6) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16));
						return;
					}
					if (hex.length === 7) {
						hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16), Number.parseInt(hex.charAt(6) + hex.charAt(6), 16) / 255);
						return;
					}
					hashParentListItem.data = rgbNode(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16), Number.parseInt(hex.slice(6, 8), 16) / 255);
				}
			});
			(0, css_tree.walk)(declaration, {
				visit: "Function",
				enter(func, parentListItem) {
					if (func.name === "color-mix") {
						const children = func.children.toArray();
						const color = children[3];
						const opacity = children[4];
						if (func.children.last?.type === "Identifier" && func.children.last.name === "transparent" && color?.type === "Function" && color?.name === "rgb" && opacity) {
							if (opacity.type === "Percentage") {
								const alpha = Number.parseFloat(opacity.value) / 100;
								if (alpha < 1) {
									color.children.appendData({
										type: "Operator",
										value: ","
									});
									color.children.appendData({
										type: "Number",
										value: alpha.toString()
									});
								}
							} else {
								color.children.appendData({
									type: "Operator",
									value: ","
								});
								color.children.appendData(opacity);
							}
							parentListItem.data = color;
						}
					}
				}
			});
			if (declaration.property === "padding-inline") {
				const paddingRight = separteShorthandDeclaration(declaration, ["padding-left", "padding-right"]);
				list.insertData(paddingRight, item);
			}
			if (declaration.property === "padding-block") {
				const paddingBottom = separteShorthandDeclaration(declaration, ["padding-top", "padding-bottom"]);
				list.insertData(paddingBottom, item);
			}
			if (declaration.property === "margin-inline") {
				const marginRight = separteShorthandDeclaration(declaration, ["margin-left", "margin-right"]);
				list.insertData(marginRight, item);
			}
			if (declaration.property === "margin-block") {
				const paddingBottom = separteShorthandDeclaration(declaration, ["margin-top", "margin-bottom"]);
				list.insertData(paddingBottom, item);
			}
		}
	});
}
//#endregion
exports.sanitizeDeclarations = sanitizeDeclarations;
