/**
 * Node kinds returned by the parser.
 */
declare enum SyntaxKind {
    /**
     * Plain text content.
     */
    Text = "Text",
    /**
     * HTML tag node.
     */
    Tag = "Tag"
}
/**
 * Common source range shared by every AST node.
 */
interface IBaseNode {
    /**
     * Zero-based start offset in the source string.
     */
    start: number;
    /**
     * Zero-based end offset in the source string.
     */
    end: number;
}
/**
 * Text node in the parsed AST.
 */
interface IText extends IBaseNode {
    /**
     * Discriminator for text nodes.
     */
    type: SyntaxKind.Text;
    /**
     * Original text content.
     */
    value: string;
}
/**
 * Parsed attribute value, with quote information preserved.
 */
interface IAttributeValue extends IBaseNode {
    /**
     * Attribute value without surrounding quotes.
     */
    value: string;
    /**
     * Quote character used by the source value, or undefined for unquoted values.
     */
    quote: "'" | '"' | undefined;
}
/**
 * Parsed tag attribute.
 */
interface IAttribute extends IBaseNode {
    /**
     * Attribute name token.
     */
    name: IText;
    /**
     * Attribute value, if the source provided one.
     */
    value: IAttributeValue | undefined;
}
/**
 * Tag node in the parsed AST.
 */
interface ITag extends IBaseNode {
    /**
     * Discriminator for tag nodes.
     */
    type: SyntaxKind.Tag;
    /**
     * Original opening tag text, such as <Div id="id">.
     */
    open: IText;
    /**
     * Lowercase tag name, such as div.
     */
    name: string;
    /**
     * Tag name with original casing, such as Div.
     */
    rawName: string;
    /**
     * Attributes in source order.
     */
    attributes: IAttribute[];
    /**
     * Attribute lookup map when ParseOptions.setAttributeMap is true.
     */
    attributeMap: Record<string, IAttribute> | undefined;
    /**
     * Child nodes for paired tags, undefined for self-closed tags, or null when the opening tag is incomplete.
     */
    body: Array<ITag | IText> | undefined | null;
    /**
     * Original closing tag text, undefined for self-closed tags, or null when missing.
     */
    close: IText | undefined | null;
}
/**
 * Any node returned by parse.
 */
type INode = IText | ITag;

/**
 * Token kinds emitted by tokenize.
 */
declare const enum TokenKind {
    /**
     * Raw text outside tag syntax.
     */
    Literal = 0,
    /**
     * Opening tag name without the leading <.
     */
    OpenTag = 1,
    /**
     * Opening tag end marker without the trailing >; value is / or empty.
     */
    OpenTagEnd = 2,
    /**
     * Closing tag name without the leading </ or trailing >.
     */
    CloseTag = 3,
    /**
     * Whitespace between attributes.
     */
    Whitespace = 4,
    /**
     * Attribute value assignment marker.
     */
    AttrValueEq = 5,
    /**
     * Unquoted attribute value.
     */
    AttrValueNq = 6,
    /**
     * Single-quoted attribute value.
     */
    AttrValueSq = 7,
    /**
     * Double-quoted attribute value.
     */
    AttrValueDq = 8
}
/**
 * Token emitted by the HTML tokenizer.
 */
interface IToken {
    /**
     * Zero-based start offset in the source string.
     */
    start: number;
    /**
     * Zero-based end offset in the source string.
     */
    end: number;
    /**
     * Raw token value after token-specific trimming.
     */
    value: string;
    /**
     * Token category.
     */
    type: TokenKind;
}
/**
 * Options that control tokenization.
 */
interface TokenizeOptions {
    /**
     * Treat noscript content as RAWTEXT when true, matching HTML parsers with scripting enabled.
     */
    scriptingEnabled?: boolean;
}
/**
 * Convert an HTML string into a flat token stream.
 */
declare function tokenize(input: string, options?: TokenizeOptions): IToken[];

/**
 * Options that control AST construction.
 */
interface ParseOptions {
    /**
     * Populate each tag node with an attribute lookup map.
     */
    setAttributeMap?: boolean;
    /**
     * Treat noscript content as RAWTEXT when true, matching HTML parsers with scripting enabled.
     */
    scriptingEnabled?: boolean;
}
/**
 * Parse an HTML string into an AST.
 */
declare function parse(input: string, options?: ParseOptions): INode[];

/**
 * Set a tag attribute and keep attributeMap in sync when it exists.
 */
declare function setAttribute(tag: ITag, name: string, value?: string): void;
/**
 * Remove all tag attributes with the provided name and keep attributeMap in sync when it exists.
 */
declare function removeAttribute(tag: ITag, name: string): void;
/**
 * Serialize parsed AST nodes back to HTML.
 */
declare function stringify(ast: INode | INode[]): string;

/**
 * Visitor callbacks used while walking an AST.
 */
interface WalkOptions {
    /**
     * Called before visiting a node's children.
     */
    enter?(node: INode, parent: INode | undefined, index: number): void;
    /**
     * Called after visiting a node's children.
     */
    leave?(node: INode, parent: INode | undefined, index: number): void;
}
/**
 * Traverse an AST depth-first.
 */
declare function walk(ast: INode[], options: WalkOptions): void;

export { type IAttribute, type IAttributeValue, type IBaseNode, type INode, type ITag, type IText, type IToken, type ParseOptions, SyntaxKind, TokenKind, type TokenizeOptions, type WalkOptions, parse, removeAttribute, setAttribute, stringify, tokenize, walk };
