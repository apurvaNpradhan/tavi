// src/types.ts
var SyntaxKind = /* @__PURE__ */ ((SyntaxKind2) => {
  SyntaxKind2["Text"] = "Text";
  SyntaxKind2["Tag"] = "Tag";
  return SyntaxKind2;
})(SyntaxKind || {});

// src/config.ts
var selfCloseTags = /* @__PURE__ */ new Set([
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "image",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
  "!doctype",
  "",
  "!",
  "!--"
]);
var noNestedTags = /* @__PURE__ */ new Set(["li", "option", "select", "textarea"]);
var rcDataTags = /* @__PURE__ */ new Set(["title", "textarea"]);
var rawTextTags = /* @__PURE__ */ new Set(["style", "xmp", "iframe", "noembed", "noframes"]);
var scriptDataTags = /* @__PURE__ */ new Set(["script"]);
var scriptingRawTextTags = /* @__PURE__ */ new Set(["noscript"]);
var plainTextTags = /* @__PURE__ */ new Set(["plaintext"]);

// src/tokenize.ts
var TokenKind = /* @__PURE__ */ ((TokenKind2) => {
  TokenKind2[TokenKind2["Literal"] = 0] = "Literal";
  TokenKind2[TokenKind2["OpenTag"] = 1] = "OpenTag";
  TokenKind2[TokenKind2["OpenTagEnd"] = 2] = "OpenTagEnd";
  TokenKind2[TokenKind2["CloseTag"] = 3] = "CloseTag";
  TokenKind2[TokenKind2["Whitespace"] = 4] = "Whitespace";
  TokenKind2[TokenKind2["AttrValueEq"] = 5] = "AttrValueEq";
  TokenKind2[TokenKind2["AttrValueNq"] = 6] = "AttrValueNq";
  TokenKind2[TokenKind2["AttrValueSq"] = 7] = "AttrValueSq";
  TokenKind2[TokenKind2["AttrValueDq"] = 8] = "AttrValueDq";
  return TokenKind2;
})(TokenKind || {});
var state;
var buffer;
var bufSize;
var sectionStart;
var index;
var tokens;
var char;
var offset;
var textMode;
var textEndTag;
var pendingTextMode;
var pendingTextTag;
var tokenizeOptions;
function makeCodePoints(input) {
  return {
    lower: input.toLowerCase().split("").map((c) => c.charCodeAt(0)),
    upper: input.toUpperCase().split("").map((c) => c.charCodeAt(0)),
    length: input.length
  };
}
var doctype = makeCodePoints("!doctype");
function isWhiteSpace() {
  return char === 32 /* _S */ || char === 10 /* _N */ || char === 9 /* _T */ || char === 9 /* _T */ || char === 13 /* _R */ || char === 12 /* _F */;
}
function init(input, options) {
  state = 0 /* Literal */;
  buffer = input;
  bufSize = input.length;
  sectionStart = 0;
  index = 0;
  tokens = [];
  offset = 0;
  textMode = 0 /* Data */;
  textEndTag = void 0;
  pendingTextMode = 0 /* Data */;
  pendingTextTag = "";
  tokenizeOptions = options;
}
function getTextMode(tagName) {
  if (rcDataTags.has(tagName)) {
    return 1 /* RcData */;
  }
  if (rawTextTags.has(tagName)) {
    return 2 /* RawText */;
  }
  if (scriptDataTags.has(tagName)) {
    return 3 /* ScriptData */;
  }
  if (plainTextTags.has(tagName)) {
    return 4 /* PlainText */;
  }
  if (tokenizeOptions.scriptingEnabled && scriptingRawTextTags.has(tagName)) {
    return 2 /* RawText */;
  }
  return 0 /* Data */;
}
function setPendingTextMode(tagName) {
  pendingTextTag = tagName;
  pendingTextMode = getTextMode(tagName);
}
function activatePendingTextMode(openTagEnd) {
  if (openTagEnd !== "/" && pendingTextMode !== 0 /* Data */) {
    textMode = pendingTextMode;
    textEndTag = makeCodePoints(pendingTextTag);
    if (pendingTextTag === "textarea" && buffer.charCodeAt(sectionStart) === 10 /* _N */) {
      sectionStart++;
      index++;
    }
  }
  pendingTextMode = 0 /* Data */;
  pendingTextTag = "";
}
function resetTextMode() {
  textMode = 0 /* Data */;
  textEndTag = void 0;
}
function resetTextClosingTag() {
  sectionStart -= 2;
  state = 0 /* Literal */;
}
function tokenize(input, options = {}) {
  init(input, {
    scriptingEnabled: options.scriptingEnabled !== false
  });
  while (index < bufSize) {
    char = buffer.charCodeAt(index);
    switch (state) {
      case 0 /* Literal */:
        parseLiteral();
        break;
      case 1 /* BeforeOpenTag */:
        parseBeforeOpenTag();
        break;
      case 2 /* OpeningTag */:
        parseOpeningTag();
        break;
      case 3 /* AfterOpenTag */:
        parseAfterOpenTag();
        break;
      case 4 /* InValueNq */:
        parseInValueNq();
        break;
      case 5 /* InValueSq */:
        parseInValueSq();
        break;
      case 6 /* InValueDq */:
        parseInValueDq();
        break;
      case 7 /* ClosingOpenTag */:
        parseClosingOpenTag();
        break;
      case 8 /* OpeningSpecial */:
        parseOpeningSpecial();
        break;
      case 9 /* OpeningDoctype */:
        parseOpeningDoctype();
        break;
      case 10 /* OpeningNormalComment */:
        parseOpeningNormalComment();
        break;
      case 11 /* InNormalComment */:
        parseNormalComment();
        break;
      case 12 /* InShortComment */:
        parseShortComment();
        break;
      case 13 /* ClosingNormalComment */:
        parseClosingNormalComment();
        break;
      case 14 /* ClosingTag */:
        parseClosingTag();
        break;
      default:
        unexpected();
    }
    index++;
  }
  switch (state) {
    case 0 /* Literal */:
    case 1 /* BeforeOpenTag */:
    case 4 /* InValueNq */:
    case 5 /* InValueSq */:
    case 6 /* InValueDq */:
    case 7 /* ClosingOpenTag */:
    case 11 /* InNormalComment */:
    case 12 /* InShortComment */:
    case 13 /* ClosingNormalComment */:
      emitToken(0 /* Literal */);
      break;
    case 2 /* OpeningTag */:
      emitToken(1 /* OpenTag */);
      break;
    case 3 /* AfterOpenTag */:
      break;
    case 8 /* OpeningSpecial */:
      emitToken(1 /* OpenTag */, 12 /* InShortComment */);
      break;
    case 9 /* OpeningDoctype */:
      if (index - sectionStart === doctype.length) {
        emitToken(1 /* OpenTag */);
      } else {
        emitToken(1 /* OpenTag */, void 0, sectionStart + 1);
        emitToken(0 /* Literal */);
      }
      break;
    case 10 /* OpeningNormalComment */:
      if (index - sectionStart === 2) {
        emitToken(1 /* OpenTag */);
      } else {
        emitToken(1 /* OpenTag */, void 0, sectionStart + 1);
        emitToken(0 /* Literal */);
      }
      break;
    case 14 /* ClosingTag */:
      emitToken(3 /* CloseTag */);
      break;
    default:
      break;
  }
  const _tokens = tokens;
  init("", tokenizeOptions);
  return _tokens;
}
function emitToken(kind, newState = state, end = index) {
  let value = buffer.substring(sectionStart, end);
  if (kind === 1 /* OpenTag */ || kind === 3 /* CloseTag */) {
    value = value.toLowerCase();
  }
  if (kind === 1 /* OpenTag */) {
    setPendingTextMode(value);
  }
  if (kind === 3 /* CloseTag */) {
    resetTextMode();
  }
  if (!((kind === 0 /* Literal */ || kind === 4 /* Whitespace */) && end === sectionStart)) {
    tokens.push({ type: kind, start: sectionStart, end, value });
  }
  if (kind === 2 /* OpenTagEnd */ || kind === 3 /* CloseTag */) {
    sectionStart = end + 1;
    state = 0 /* Literal */;
    if (kind === 2 /* OpenTagEnd */) {
      activatePendingTextMode(value);
    }
  } else {
    sectionStart = end;
    state = newState;
  }
}
function parseLiteral() {
  if (textMode === 4 /* PlainText */) {
    return;
  }
  if (char === 60 /* Lt */) {
    emitToken(0 /* Literal */, 1 /* BeforeOpenTag */);
  }
}
function parseBeforeOpenTag() {
  if (textMode !== 0 /* Data */) {
    if (char === 47 /* Sl */) {
      state = 14 /* ClosingTag */;
      sectionStart = index + 1;
    } else {
      state = 0 /* Literal */;
    }
    return;
  }
  if (char >= 97 /* La */ && char <= 122 /* Lz */ || char >= 65 /* Ua */ && char <= 90 /* Uz */) {
    state = 2 /* OpeningTag */;
    sectionStart = index;
  } else if (char === 47 /* Sl */) {
    state = 14 /* ClosingTag */;
    sectionStart = index + 1;
  } else if (char === 60 /* Lt */) {
    emitToken(0 /* Literal */);
  } else if (char === 33 /* Ep */) {
    state = 8 /* OpeningSpecial */;
    sectionStart = index;
  } else if (char === 63 /* Qm */) {
    sectionStart = index;
    emitToken(1 /* OpenTag */, 12 /* InShortComment */);
  } else {
    state = 0 /* Literal */;
  }
}
function parseOpeningTag() {
  if (isWhiteSpace()) {
    emitToken(1 /* OpenTag */, 3 /* AfterOpenTag */);
  } else if (char === 62 /* Gt */) {
    emitToken(1 /* OpenTag */);
    emitToken(2 /* OpenTagEnd */);
  } else if (char === 47 /* Sl */) {
    emitToken(1 /* OpenTag */, 7 /* ClosingOpenTag */);
  }
}
function parseAfterOpenTag() {
  if (char === 62 /* Gt */) {
    emitToken(4 /* Whitespace */);
    emitToken(2 /* OpenTagEnd */);
  } else if (char === 47 /* Sl */) {
    emitToken(4 /* Whitespace */, 7 /* ClosingOpenTag */);
  } else if (char === 61 /* Eq */) {
    emitToken(4 /* Whitespace */);
    emitToken(5 /* AttrValueEq */, void 0, index + 1);
  } else if (char === 39 /* Sq */) {
    emitToken(4 /* Whitespace */, 5 /* InValueSq */);
  } else if (char === 34 /* Dq */) {
    emitToken(4 /* Whitespace */, 6 /* InValueDq */);
  } else if (!isWhiteSpace()) {
    emitToken(4 /* Whitespace */, 4 /* InValueNq */);
  }
}
function parseInValueNq() {
  if (char === 62 /* Gt */) {
    emitToken(6 /* AttrValueNq */);
    emitToken(2 /* OpenTagEnd */);
  } else if (char === 47 /* Sl */) {
    emitToken(6 /* AttrValueNq */, 7 /* ClosingOpenTag */);
  } else if (char === 61 /* Eq */) {
    emitToken(6 /* AttrValueNq */);
    emitToken(5 /* AttrValueEq */, 3 /* AfterOpenTag */, index + 1);
  } else if (isWhiteSpace()) {
    emitToken(6 /* AttrValueNq */, 3 /* AfterOpenTag */);
  }
}
function parseInValueSq() {
  if (char === 39 /* Sq */) {
    emitToken(7 /* AttrValueSq */, 3 /* AfterOpenTag */, index + 1);
  }
}
function parseInValueDq() {
  if (char === 34 /* Dq */) {
    emitToken(8 /* AttrValueDq */, 3 /* AfterOpenTag */, index + 1);
  }
}
function parseClosingOpenTag() {
  if (char === 62 /* Gt */) {
    emitToken(2 /* OpenTagEnd */);
  } else {
    emitToken(6 /* AttrValueNq */, 3 /* AfterOpenTag */);
    parseAfterOpenTag();
  }
}
function parseOpeningSpecial() {
  switch (char) {
    case 45 /* Cl */:
      state = 10 /* OpeningNormalComment */;
      break;
    case 100 /* Ld */:
    // <!d
    case 68 /* Ud */:
      state = 9 /* OpeningDoctype */;
      break;
    default:
      emitToken(1 /* OpenTag */, 12 /* InShortComment */);
      break;
  }
}
function parseOpeningDoctype() {
  offset = index - sectionStart;
  if (offset === doctype.length) {
    if (isWhiteSpace()) {
      emitToken(1 /* OpenTag */, 3 /* AfterOpenTag */);
    } else {
      unexpected();
    }
  } else if (char === 62 /* Gt */) {
    emitToken(1 /* OpenTag */, void 0, sectionStart + 1);
    emitToken(0 /* Literal */);
    emitToken(2 /* OpenTagEnd */);
  } else if (doctype.lower[offset] !== char && doctype.upper[offset] !== char) {
    emitToken(1 /* OpenTag */, 12 /* InShortComment */, sectionStart + 1);
  }
}
function parseOpeningNormalComment() {
  if (char === 45 /* Cl */) {
    emitToken(1 /* OpenTag */, 11 /* InNormalComment */, index + 1);
  } else {
    emitToken(1 /* OpenTag */, 12 /* InShortComment */, sectionStart + 1);
  }
}
function parseNormalComment() {
  if (char === 45 /* Cl */) {
    emitToken(0 /* Literal */, 13 /* ClosingNormalComment */);
  }
}
function parseShortComment() {
  if (char === 62 /* Gt */) {
    emitToken(0 /* Literal */);
    emitToken(2 /* OpenTagEnd */);
  }
}
function parseClosingNormalComment() {
  offset = index - sectionStart;
  if (offset === 2) {
    if (char === 62 /* Gt */) {
      emitToken(2 /* OpenTagEnd */);
    } else if (char === 45 /* Cl */) {
      emitToken(0 /* Literal */, void 0, sectionStart + 1);
    } else {
      state = 11 /* InNormalComment */;
    }
  } else if (char !== 45 /* Cl */) {
    state = 11 /* InNormalComment */;
  }
}
function parseClosingTag() {
  offset = index - sectionStart;
  if (textMode !== 0 /* Data */) {
    const endTag = textEndTag;
    if (!endTag) {
      unexpected();
    }
    if (char === 60 /* Lt */) {
      resetTextClosingTag();
      emitToken(0 /* Literal */, 1 /* BeforeOpenTag */);
    } else if (offset < endTag.length) {
      if (endTag.lower[offset] !== char && endTag.upper[offset] !== char) {
        resetTextClosingTag();
      }
    } else if (char === 62 /* Gt */) {
      emitToken(3 /* CloseTag */);
    } else if (!isWhiteSpace()) {
      resetTextClosingTag();
    }
  } else if (char === 62 /* Gt */) {
    emitToken(3 /* CloseTag */);
  }
}
function unexpected() {
  throw new SyntaxError(
    `Unexpected token "${buffer.charAt(index)}" at ${index} when parse ${state}`
  );
}

// src/utils.ts
function getLineRanges(input) {
  return input.split("\n").reduce(
    (arr, line) => {
      arr.push(line.length + 1 + arr[arr.length - 1]);
      return arr;
    },
    [0]
  );
}
function getPosition(ranges, offset2) {
  let line = NaN;
  let column = NaN;
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i] > offset2) {
      line = i;
      column = offset2 - ranges[i - 1] + 1;
      break;
    }
  }
  return [line, column];
}

// src/walk.ts
function visit(node2, parent, index3, options) {
  options.enter && options.enter(node2, parent, index3);
  if (node2.type === "Tag" /* Tag */ && Array.isArray(node2.body)) {
    for (let i = 0; i < node2.body.length; i++) {
      visit(node2.body[i], node2, i, options);
    }
  }
  options.leave && options.leave(node2, parent, index3);
}
function walk(ast, options) {
  for (let i = 0; i < ast.length; i++) {
    visit(ast[i], void 0, i, options);
  }
}

// src/parse.ts
var index2;
var count;
var tokens2;
var tagChain;
var nodes;
var token;
var node;
var buffer2;
var lines;
var parseOptions;
function init2(input, options) {
  if (input === void 0) {
    count = 0;
    tokens2.length = 0;
    buffer2 = "";
  } else {
    tokens2 = tokenize(input, {
      scriptingEnabled: options?.scriptingEnabled
    });
    count = tokens2.length;
    buffer2 = input;
  }
  index2 = 0;
  tagChain = void 0;
  nodes = [];
  token = void 0;
  node = void 0;
  lines = void 0;
  parseOptions = options;
}
function pushNode(_node) {
  if (!tagChain) {
    nodes.push(_node);
  } else if (_node.type === "Tag" /* Tag */ && _node.name === tagChain.tag.name && noNestedTags.has(_node.name)) {
    tagChain = tagChain.parent;
    pushNode(_node);
  } else if (tagChain.tag.body) {
    tagChain.tag.end = _node.end;
    tagChain.tag.body.push(_node);
  }
}
function pushTagChain(tag) {
  tagChain = { parent: tagChain, tag };
  node = void 0;
}
function createLiteral(start = token.start, end = token.end, value = token.value) {
  return { start, end, value, type: "Text" /* Text */ };
}
function createTag() {
  return {
    start: token.start - 1,
    // include <
    end: token.end,
    type: "Tag" /* Tag */,
    open: createLiteral(token.start - 1),
    // not finished
    name: token.value,
    rawName: buffer2.substring(token.start, token.end),
    attributes: [],
    attributeMap: void 0,
    body: null,
    close: null
  };
}
function createAttribute() {
  return {
    start: token.start,
    end: token.end,
    name: createLiteral(),
    value: void 0
  };
}
function createAttributeValue() {
  return {
    start: token.start,
    end: token.end,
    value: token.type === 6 /* AttrValueNq */ ? token.value : token.value.substr(1, token.value.length - 2),
    quote: token.type === 6 /* AttrValueNq */ ? void 0 : token.type === 7 /* AttrValueSq */ ? "'" : '"'
  };
}
function appendLiteral(_node = node) {
  _node.value += token.value;
  _node.end = token.end;
}
function unexpected2() {
  if (lines === void 0) {
    lines = getLineRanges(buffer2);
  }
  const [line, column] = getPosition(lines, token.start);
  throw new Error(
    `Unexpected token "${token.value}(${token.type})" at [${line},${column}]` + (tagChain ? ` when parsing tag: ${JSON.stringify(tagChain.tag.name)}.` : "")
  );
}
function buildAttributeMap(tag) {
  tag.attributeMap = {};
  for (const attr of tag.attributes) {
    tag.attributeMap[attr.name.value] = attr;
  }
}
function parseOpenTag() {
  let state2 = 0 /* BeforeAttr */;
  let attr = void 0;
  const tag = createTag();
  pushNode(tag);
  if (tag.name === "" || tag.name === "!" || tag.name === "!--") {
    tag.open.value = "<" + tag.open.value;
    if (index2 === count) {
      return;
    } else {
      token = tokens2[++index2];
      if (token.type !== 2 /* OpenTagEnd */) {
        node = createLiteral();
        tag.body = [node];
        while (++index2 < count) {
          token = tokens2[index2];
          if (token.type === 2 /* OpenTagEnd */) {
            node = void 0;
            break;
          }
          appendLiteral();
        }
      }
      tag.close = createLiteral(token.start, token.end + 1, `${token.value}>`);
      tag.end = tag.close.end;
    }
    return;
  }
  while (++index2 < count) {
    token = tokens2[index2];
    if (token.type === 2 /* OpenTagEnd */) {
      tag.end = tag.open.end = token.end + 1;
      tag.open.value = buffer2.substring(tag.open.start, tag.open.end);
      if (token.value === "" && !selfCloseTags.has(tag.name)) {
        tag.body = [];
        pushTagChain(tag);
      } else {
        tag.body = void 0;
      }
      break;
    } else if (state2 === 0 /* BeforeAttr */) {
      if (token.type !== 4 /* Whitespace */) {
        attr = createAttribute();
        state2 = 1 /* InName */;
        tag.attributes.push(attr);
      }
    } else if (state2 === 1 /* InName */) {
      if (token.type === 4 /* Whitespace */) {
        state2 = 2 /* AfterName */;
      } else if (token.type === 5 /* AttrValueEq */) {
        state2 = 3 /* AfterEqual */;
      } else {
        appendLiteral(attr.name);
      }
    } else if (state2 === 2 /* AfterName */) {
      if (token.type !== 4 /* Whitespace */) {
        if (token.type === 5 /* AttrValueEq */) {
          state2 = 3 /* AfterEqual */;
        } else {
          attr = createAttribute();
          state2 = 1 /* InName */;
          tag.attributes.push(attr);
        }
      }
    } else if (state2 === 3 /* AfterEqual */) {
      if (token.type !== 4 /* Whitespace */) {
        attr.value = createAttributeValue();
        if (token.type === 6 /* AttrValueNq */) {
          state2 = 4 /* InValue */;
        } else {
          attr.end = attr.value.end;
          state2 = 0 /* BeforeAttr */;
        }
      }
    } else {
      if (token.type === 4 /* Whitespace */) {
        attr.end = attr.value.end;
        state2 = 0 /* BeforeAttr */;
      } else {
        appendLiteral(attr.value);
      }
    }
  }
}
function parseCloseTag() {
  let _context = tagChain;
  while (true) {
    if (!_context || token.value.trim() === _context.tag.name) {
      break;
    }
    _context = _context.parent;
  }
  if (!_context) {
    return;
  }
  _context.tag.close = createLiteral(
    token.start - 2,
    token.end + 1,
    buffer2.substring(token.start - 2, token.end + 1)
  );
  _context.tag.end = _context.tag.close.end;
  _context = _context.parent;
  tagChain = _context;
}
function parse(input, options) {
  init2(input, {
    setAttributeMap: false,
    scriptingEnabled: true,
    ...options
  });
  while (index2 < count) {
    token = tokens2[index2];
    switch (token.type) {
      case 0 /* Literal */:
        if (!node) {
          node = createLiteral();
          pushNode(node);
        } else {
          appendLiteral(node);
        }
        break;
      case 1 /* OpenTag */:
        node = void 0;
        parseOpenTag();
        break;
      case 3 /* CloseTag */:
        node = void 0;
        parseCloseTag();
        break;
      default:
        unexpected2();
        break;
    }
    index2++;
  }
  const _nodes = nodes;
  if (parseOptions?.setAttributeMap) {
    walk(_nodes, {
      enter(node2) {
        if (node2.type === "Tag" /* Tag */) {
          buildAttributeMap(node2);
        }
      }
    });
  }
  init2();
  return _nodes;
}

// src/stringify.ts
function setAttribute(tag, name, value) {
  const attr = findAttribute(tag, name);
  if (attr) {
    attr.name.value = name;
    attr.value = value === void 0 ? void 0 : {
      start: attr.value?.start ?? attr.end,
      end: attr.value?.end ?? attr.end,
      value,
      quote: attr.value?.quote ?? '"'
    };
    attr.end = attr.value?.end ?? attr.name.end;
  } else {
    tag.attributes.push(createAttribute2(name, value));
  }
  if (tag.attributeMap) {
    tag.attributeMap[name] = findAttribute(tag, name);
  }
}
function removeAttribute(tag, name) {
  for (let index3 = tag.attributes.length - 1; index3 >= 0; index3--) {
    if (tag.attributes[index3].name.value === name) {
      tag.attributes.splice(index3, 1);
    }
  }
  if (tag.attributeMap) {
    delete tag.attributeMap[name];
  }
}
function stringify(ast) {
  if (Array.isArray(ast)) {
    return ast.map(stringifyNode).join("");
  }
  return stringifyNode(ast);
}
function stringifyNode(node2) {
  if (node2.type === "Text" /* Text */) {
    return node2.value;
  }
  return stringifyTag(node2);
}
function stringifyTag(tag) {
  if (tag.body === null) {
    return stringifyOpenTag(tag, false);
  }
  if (tag.name === "!--" || tag.name === "!" || tag.name === "") {
    return stringifySpecialTag(tag);
  }
  const open = stringifyOpenTag(tag);
  if (tag.body === void 0) {
    return open;
  }
  const close = tag.close === null ? "" : `</${tag.rawName}>`;
  return open + stringify(tag.body) + close;
}
function stringifySpecialTag(tag) {
  const body = tag.body ? stringify(tag.body) : "";
  if (tag.name === "!--") {
    return `<!--${body}${tag.close === null ? "" : "-->"}`;
  }
  if (tag.name === "!") {
    return `<!${body}${tag.close === null ? "" : ">"}`;
  }
  return `<${body}${tag.close === null ? "" : ">"}`;
}
function stringifyOpenTag(tag, close = true) {
  const attrs = tag.attributes.map(stringifyAttribute).join(" ");
  return `<${tag.rawName}${attrs ? ` ${attrs}` : ""}${close ? ">" : ""}`;
}
function stringifyAttribute(attr) {
  if (!attr.value) {
    return attr.name.value;
  }
  if (attr.value.quote === void 0) {
    return `${attr.name.value}=${attr.value.value}`;
  }
  return `${attr.name.value}=${attr.value.quote}${attr.value.value}${attr.value.quote}`;
}
function findAttribute(tag, name) {
  return tag.attributes.find((attr) => attr.name.value === name);
}
function createAttribute2(name, value) {
  return {
    start: 0,
    end: 0,
    name: {
      start: 0,
      end: 0,
      type: "Text" /* Text */,
      value: name
    },
    value: value === void 0 ? void 0 : {
      start: 0,
      end: 0,
      value,
      quote: '"'
    }
  };
}
export {
  SyntaxKind,
  TokenKind,
  parse,
  removeAttribute,
  setAttribute,
  stringify,
  tokenize,
  walk
};
//# sourceMappingURL=index.js.map