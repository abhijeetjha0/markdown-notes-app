import { findAndReplace } from "mdast-util-find-and-replace";
import type { Node } from "unist";

/**
 * Remark plugin to support markdown-it / Pandoc style inserted and marked text:
 * - ++Inserted text++ -> <ins>Inserted text</ins>
 * - ==Marked text== -> <mark>Marked text</mark>
 */
export function remarkInsMark() {
    return (tree: Node) => {
        findAndReplace(
            tree as any,
            [
                [
                    /\+\+([^\+\s](?:[\s\S]*?[^\+\s])?)\+\+/g,
                    function (_: string, match: string): any {
                        return {
                            type: "ins",
                            data: { hName: "ins" },
                            children: [{ type: "text", value: match }],
                        };
                    },
                ],
                [
                    /==([^=\s](?:[\s\S]*?[^=\s])?)==/g,
                    function (_: string, match: string): any {
                        return {
                            type: "mark",
                            data: { hName: "mark" },
                            children: [{ type: "text", value: match }],
                        };
                    },
                ],
            ] as any,
            { ignore: ["code", "pre"] },
        );
    };
}

export default remarkInsMark;
