import { visit } from "unist-util-visit";
import type { Node } from "unist";

interface TextNode extends Node {
    type: "text";
    value: string;
}

/**
 * Remark plugin to enable typographic replacements (similar to markdown-it typographer):
 * - (c) / (C) -> © (Copyright)
 * - (r) / (R) -> ® (Registered trademark)
 * - (tm) / (TM) -> ™ (Trademark)
 * - (p) / (P) -> § (Section sign)
 * - +- -> ± (Plus-minus)
 * - ... -> … (Ellipsis)
 * - --- -> — (Em dash)
 * - -- -> – (En dash)
 */
export function remarkTypographer() {
    return (tree: Node) => {
        visit(tree, "text", (node: Node) => {
            const textNode = node as TextNode;
            if (!textNode.value || typeof textNode.value !== "string") return;
            textNode.value = textNode.value
                .replace(/\((c|C)\)/g, "©")
                .replace(/\((r|R)\)/g, "®")
                .replace(/\((tm|TM)\)/g, "™")
                .replace(/\((p|P)\)/g, "§")
                .replace(/\+-/g, "±")
                .replace(/\.{3,}/g, "…")
                .replace(/---/g, "—")
                .replace(/--/g, "–");
        });
    };
}

export default remarkTypographer;
