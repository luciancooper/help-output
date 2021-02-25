const optionsUsage = require('../lib/options');

describe('Usage arg generator', () => {
    test('handles mutually exclusive option groups', () => {
        const usage = optionsUsage([
            { name: 'A', conflicts: ['B', 'C'] },
            { name: 'B', conflicts: 'C' },
            { name: 'C' },
        ]);
        expect(usage).toMatchObject([{
            type: 'exclusive-group',
            members: [
                { type: 'option', name: 'A' },
                { type: 'option', name: 'B' },
                { type: 'option', name: 'C' },
            ],
        }]);
    });

    test('handles partially exclusive option groups', () => {
        const usage = optionsUsage([
            { name: 'A', conflicts: 'C' },
            { name: 'B', conflicts: 'C' },
            { name: 'C' },
        ]);
        expect(usage).toMatchObject([{
            type: 'exclusive-group',
            members: [
                {
                    type: 'group',
                    members: [
                        { type: 'option', name: 'A' },
                        { type: 'option', name: 'B' },
                    ],
                },
                { type: 'option', name: 'C' },
            ],
        }]);
    });

    test('handles partially exclusive option groups with mergable segments', () => {
        const usage = optionsUsage([
            { name: 'A', conflicts: ['D', 'E'] },
            { name: 'B', conflicts: ['D', 'E'] },
            { name: 'C', conflicts: ['D', 'E'] },
            { name: 'D', conflicts: ['A', 'B', 'C'] },
            { name: 'E', conflicts: ['A', 'B', 'C'] },
        ]);
        expect(usage).toMatchObject([{
            type: 'exclusive-group',
            members: [{
                type: 'group',
                members: [
                    { type: 'option', name: 'A' },
                    { type: 'option', name: 'B' },
                    { type: 'option', name: 'C' },
                ],
            }, {
                type: 'group',
                members: [
                    { type: 'option', name: 'D' },
                    { type: 'option', name: 'E' },
                ],
            }],
        }]);
    });

    test('handles multiple partially exclusive subgroups', () => {
        const usage = optionsUsage([
            { name: 'A', conflicts: ['B', 'C', 'D'] },
            { name: 'B', conflicts: 'D' },
            { name: 'C' },
            { name: 'D' },
        ]);
        expect(usage).toMatchObject([{
            type: 'exclusive-group',
            members: [
                { type: 'option', name: 'A' },
                {
                    type: 'group',
                    members: [
                        {
                            type: 'exclusive-group',
                            members: [
                                { type: 'option', name: 'B' },
                                { type: 'option', name: 'D' },
                            ],
                        },
                        { type: 'option', name: 'C' },
                    ],
                },
            ],
        }]);
    });

    test('handles a single partially exclusive subgroup', () => {
        const usage = optionsUsage([
            { name: 'A', conflicts: ['B', 'C', 'D', 'E'] },
            { name: 'B', conflicts: 'C' },
            { name: 'C', conflicts: 'D' },
            { name: 'D', conflicts: 'E' },
            { name: 'E', conflicts: 'B' },
        ]);
        expect(usage).toMatchObject([{
            type: 'exclusive-group',
            members: [
                { type: 'option', name: 'A' },
                {
                    type: 'exclusive-group',
                    members: [{
                        type: 'group',
                        members: [
                            { type: 'option', name: 'B' },
                            { type: 'option', name: 'D' },
                        ],
                    }, {
                        type: 'group',
                        members: [
                            { type: 'option', name: 'C' },
                            { type: 'option', name: 'E' },
                        ],
                    }],
                },
            ],
        }]);
    });

    test('handles options with dependencies', () => {
        const usage = optionsUsage([
            { name: 'A' },
            { name: 'B', requires: 'A' },
        ]);
        expect(usage).toMatchObject([{
            type: 'option',
            name: 'A',
            dependent: { type: 'option', name: 'B' },
        }]);
    });

    test('handles options with multiple dependencies', () => {
        const usage = optionsUsage([
            { name: 'A' },
            { name: 'B', requires: 'A' },
            { name: 'C', requires: 'A' },
        ]);
        expect(usage).toMatchObject([{
            type: 'option',
            name: 'A',
            dependent: {
                type: 'group',
                members: [
                    { type: 'option', name: 'B' },
                    { type: 'option', name: 'C' },
                ],
            },
        }]);
    });

    test('handles options with chained dependencies', () => {
        const usage = optionsUsage([
            { name: 'A' },
            { name: 'B', requires: 'A' },
            { name: 'C', requires: 'B' },
            { name: 'D', requires: 'F' },
            { name: 'E', requires: 'D' },
            { name: 'F' },
        ]);
        expect(usage).toMatchObject([{
            type: 'option',
            name: 'A',
            dependent: {
                type: 'option',
                name: 'B',
                dependent: { type: 'option', name: 'C' },
            },
        }, {
            type: 'option',
            name: 'F',
            dependent: {
                type: 'option',
                name: 'D',
                dependent: { type: 'option', name: 'E' },
            },
        }]);
    });

    test('handles dependent options that have conflicts', () => {
        const usage = optionsUsage([
            { name: 'A' },
            { name: 'B', requires: 'A' },
            { name: 'C', conflicts: 'B' },
        ]);
        expect(usage).toMatchObject([{
            type: 'option',
            name: 'A',
            dependent: {
                type: 'exclusive-group',
                members: [
                    { type: 'option', name: 'B' },
                    { type: 'option', name: 'C' },
                ],
            },
        }, { type: 'option', name: 'C' }]);
    });
});