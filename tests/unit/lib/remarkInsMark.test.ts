import remarkInsMark from '@/lib/remarkInsMark';

describe('remarkInsMark', () => {
    test('transforms ++inserted++ to ins node', () => {
        // Because findAndReplace mutates the tree, we need a root-like structure
        const tree = {
            type: 'paragraph',
            children: [
                { type: 'text', value: 'Here is some ++inserted text++.' }
            ]
        };

        const plugin = remarkInsMark();
        plugin(tree as any);

        expect(tree.children).toHaveLength(3);
        expect(tree.children[0]).toEqual({ type: 'text', value: 'Here is some ' });
        expect(tree.children[1]).toEqual({
            type: 'ins',
            data: { hName: 'ins' },
            children: [{ type: 'text', value: 'inserted text' }]
        });
        expect(tree.children[2]).toEqual({ type: 'text', value: '.' });
    });

    test('transforms ==marked== to mark node', () => {
        const tree = {
            type: 'paragraph',
            children: [
                { type: 'text', value: 'Here is some ==marked text==.' }
            ]
        };

        const plugin = remarkInsMark();
        plugin(tree as any);

        expect(tree.children).toHaveLength(3);
        expect(tree.children[0]).toEqual({ type: 'text', value: 'Here is some ' });
        expect(tree.children[1]).toEqual({
            type: 'mark',
            data: { hName: 'mark' },
            children: [{ type: 'text', value: 'marked text' }]
        });
        expect(tree.children[2]).toEqual({ type: 'text', value: '.' });
    });

    test('ignores code and pre blocks', () => {
        const tree = {
            type: 'code',
            value: 'const a = "++not inserted++";',
            children: [
                { type: 'text', value: 'const a = "++not inserted++";' }
            ]
        };

        const plugin = remarkInsMark();
        plugin(tree as any);

        // Should not be modified
        expect(tree.children[0].value).toBe('const a = "++not inserted++";');
    });

    test('handles multiple matches in a single node', () => {
        const tree = {
            type: 'paragraph',
            children: [
                { type: 'text', value: 'A ++one++ B ==two== C' }
            ]
        };

        const plugin = remarkInsMark();
        plugin(tree as any);

        expect(tree.children).toHaveLength(5);
        expect(tree.children[1]).toEqual({
            type: 'ins',
            data: { hName: 'ins' },
            children: [{ type: 'text', value: 'one' }]
        });
        expect(tree.children[3]).toEqual({
            type: 'mark',
            data: { hName: 'mark' },
            children: [{ type: 'text', value: 'two' }]
        });
    });
});
