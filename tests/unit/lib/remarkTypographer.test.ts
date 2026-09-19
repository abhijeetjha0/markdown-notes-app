import remarkTypographer from '@/lib/remarkTypographer';

describe('remarkTypographer', () => {
    test('replaces typographic symbols in text nodes', () => {
        const tree = {
            type: 'paragraph',
            children: [
                { type: 'text', value: '(c) 2023 (r) (tm) (p)' },
                { type: 'text', value: 'A +- B ... C --- D -- E' }
            ]
        };

        const plugin = remarkTypographer();
        plugin(tree as any);

        expect(tree.children[0].value).toBe('© 2023 ® ™ §');
        expect(tree.children[1].value).toBe('A ± B … C — D – E');
    });

    test('ignores non-text nodes or text nodes without string values', () => {
        const tree = {
            type: 'paragraph',
            children: [
                { type: 'code', value: '(c)' },
                { type: 'text', value: null }
            ]
        };

        const plugin = remarkTypographer();
        plugin(tree as any);

        expect(tree.children[0].value).toBe('(c)');
        expect(tree.children[1].value).toBeNull();
    });

    test('handles variations in capitalization', () => {
        const tree = {
            type: 'text',
            value: '(C) (R) (TM) (P)'
        };

        const plugin = remarkTypographer();
        plugin(tree as any);

        expect(tree.value).toBe('© ® ™ §');
    });
});
