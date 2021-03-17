const optionsUsage = require('../lib/options');

describe('Options usage resolver', () => {
    describe('mutually exclusive groups', () => {
        test('handles case where all members are optional', () => {
            const usage = optionsUsage([
                { name: 'A', required: false, conflicts: ['B', 'C'] },
                { name: 'B', required: false, conflicts: 'C' },
                { name: 'C', required: false },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: false,
                members: [
                    { type: 'option', name: 'A', required: false },
                    { type: 'option', name: 'B', required: false },
                    { type: 'option', name: 'C', required: false },
                ],
            }]);
        });

        test('handles case where all members are required', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C'] },
                { name: 'B', required: true, conflicts: 'C' },
                { name: 'C', required: true },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    { type: 'option', name: 'A', required: true },
                    { type: 'option', name: 'B', required: true },
                    { type: 'option', name: 'C', required: true },
                ],
            }]);
        });

        test('detects invalid mixtures of required & non-required options', () => {
            expect(() => optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C'] },
                { name: 'B', required: true, conflicts: 'C' },
                { name: 'C', required: false },
            ])).toThrowValidation([
                "Required option 'A' cannot have a mutually exclusive relationship with non-required option 'C'",
                "Required option 'B' cannot have a mutually exclusive relationship with non-required option 'C'",
            ]);
        });
    });

    describe('partially exclusive groups', () => {
        test('handles case where all members are optional', () => {
            const usage = optionsUsage([
                { name: 'A', required: false, conflicts: 'C' },
                { name: 'B', required: false, conflicts: 'C' },
                { name: 'C', required: false },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: false,
                members: [
                    {
                        type: 'group',
                        required: false,
                        members: [
                            { type: 'option', name: 'A', required: false },
                            { type: 'option', name: 'B', required: false },
                        ],
                    },
                    { type: 'option', name: 'C', required: false },
                ],
            }]);
        });

        test('handles case where all members are required', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: 'C' },
                { name: 'B', required: true, conflicts: 'C' },
                { name: 'C', required: true },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    {
                        type: 'group',
                        required: true,
                        members: [
                            { type: 'option', name: 'A', required: true },
                            { type: 'option', name: 'B', required: true },
                        ],
                    },
                    { type: 'option', name: 'C', required: true },
                ],
            }]);
        });

        test('handles a mixture of required & non-required members', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: 'C' },
                { name: 'B', required: false, conflicts: 'C' },
                { name: 'C', required: true },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    {
                        type: 'group',
                        required: true,
                        members: [
                            { type: 'option', name: 'A', required: true },
                            { type: 'option', name: 'B', required: false },
                        ],
                    },
                    { type: 'option', name: 'C', required: true },
                ],
            }]);
        });

        test('detects invalid mixtures of required & non-required options', () => {
            expect(() => optionsUsage([
                { name: 'A', required: true, conflicts: 'C' },
                { name: 'B', required: false, conflicts: 'C' },
                { name: 'C', required: false },
            ])).toThrowValidation([
                "Required option 'A' cannot have a mutually exclusive relationship with non-required option 'C'",
            ]);
        });
    });

    describe('partially exclusive groups with mergable segments', () => {
        test('handles case where all members are optional', () => {
            const usage = optionsUsage([
                { name: 'A', required: false, conflicts: ['D', 'E'] },
                { name: 'B', required: false, conflicts: ['D', 'E'] },
                { name: 'C', required: false, conflicts: ['D', 'E'] },
                { name: 'D', required: false, conflicts: ['A', 'B', 'C'] },
                { name: 'E', required: false, conflicts: ['A', 'B', 'C'] },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: false,
                members: [{
                    type: 'group',
                    required: false,
                    members: [
                        { type: 'option', name: 'A', required: false },
                        { type: 'option', name: 'B', required: false },
                        { type: 'option', name: 'C', required: false },
                    ],
                }, {
                    type: 'group',
                    required: false,
                    members: [
                        { type: 'option', name: 'D', required: false },
                        { type: 'option', name: 'E', required: false },
                    ],
                }],
            }]);
        });

        test('handles case where all members are required', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['D', 'E'] },
                { name: 'B', required: true, conflicts: ['D', 'E'] },
                { name: 'C', required: true, conflicts: ['D', 'E'] },
                { name: 'D', required: true, conflicts: ['A', 'B', 'C'] },
                { name: 'E', required: true, conflicts: ['A', 'B', 'C'] },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [{
                    type: 'group',
                    required: true,
                    members: [
                        { type: 'option', name: 'A', required: true },
                        { type: 'option', name: 'B', required: true },
                        { type: 'option', name: 'C', required: true },
                    ],
                }, {
                    type: 'group',
                    required: true,
                    members: [
                        { type: 'option', name: 'D', required: true },
                        { type: 'option', name: 'E', required: true },
                    ],
                }],
            }]);
        });

        test('handles a mixture of required & non-required members', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['D', 'E'] },
                { name: 'B', required: false, conflicts: ['D', 'E'] },
                { name: 'C', required: false, conflicts: ['D', 'E'] },
                { name: 'D', required: true, conflicts: ['A', 'B', 'C'] },
                { name: 'E', required: false, conflicts: ['A', 'B', 'C'] },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [{
                    type: 'group',
                    required: true,
                    members: [
                        { type: 'option', name: 'A', required: true },
                        { type: 'option', name: 'B', required: false },
                        { type: 'option', name: 'C', required: false },
                    ],
                }, {
                    type: 'group',
                    required: true,
                    members: [
                        { type: 'option', name: 'D', required: true },
                        { type: 'option', name: 'E', required: false },
                    ],
                }],
            }]);
        });

        test('detects invalid mixtures of required & non-required options', () => {
            expect(() => optionsUsage([
                { name: 'A', required: true, conflicts: ['D', 'E'] },
                { name: 'B', required: false, conflicts: ['D', 'E'] },
                { name: 'C', required: true, conflicts: ['D', 'E'] },
                { name: 'D', required: false, conflicts: ['A', 'B', 'C'] },
                { name: 'E', required: false, conflicts: ['A', 'B', 'C'] },
            ])).toThrowValidation([
                "Required option 'A' cannot have a mutually exclusive relationship with non-required option 'D'",
                "Required option 'A' cannot have a mutually exclusive relationship with non-required option 'E'",
                "Required option 'C' cannot have a mutually exclusive relationship with non-required option 'D'",
                "Required option 'C' cannot have a mutually exclusive relationship with non-required option 'E'",
            ]);
        });
    });

    describe('multiple partially exclusive subgroups', () => {
        test('handles case where all members are optional', () => {
            const usage = optionsUsage([
                { name: 'A', required: false, conflicts: ['B', 'C', 'D'] },
                { name: 'B', required: false, conflicts: 'D' },
                { name: 'C', required: false },
                { name: 'D', required: false },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: false,
                members: [
                    { type: 'option', name: 'A', required: false },
                    {
                        type: 'group',
                        required: false,
                        members: [
                            {
                                type: 'exclusive-group',
                                required: false,
                                members: [
                                    { type: 'option', name: 'B', required: false },
                                    { type: 'option', name: 'D', required: false },
                                ],
                            },
                            { type: 'option', name: 'C', required: false },
                        ],
                    },
                ],
            }]);
        });

        test('handles case where all members are required', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C', 'D'] },
                { name: 'B', required: true, conflicts: 'D' },
                { name: 'C', required: true },
                { name: 'D', required: true },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    { type: 'option', name: 'A', required: true },
                    {
                        type: 'group',
                        required: true,
                        members: [
                            {
                                type: 'exclusive-group',
                                required: true,
                                members: [
                                    { type: 'option', name: 'B', required: true },
                                    { type: 'option', name: 'D', required: true },
                                ],
                            },
                            { type: 'option', name: 'C', required: true },
                        ],
                    },
                ],
            }]);
        });

        test('handles a mixture of required & non-required members', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C', 'D'] },
                { name: 'B', required: true, conflicts: 'D' },
                { name: 'C', required: false },
                { name: 'D', required: true },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    { type: 'option', name: 'A', required: true },
                    {
                        type: 'group',
                        required: true,
                        members: [
                            {
                                type: 'exclusive-group',
                                required: true,
                                members: [
                                    { type: 'option', name: 'B', required: true },
                                    { type: 'option', name: 'D', required: true },
                                ],
                            },
                            { type: 'option', name: 'C', required: false },
                        ],
                    },
                ],
            }]);
        });

        test('detects invalid mixtures of required & non-required options', () => {
            expect(() => optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C', 'D'] },
                { name: 'B', required: false, conflicts: 'D' },
                { name: 'C', required: false },
                { name: 'D', required: true },
            ])).toThrowValidation([
                "Required option 'D' cannot have a mutually exclusive relationship with non-required option 'B'",
            ]);
        });
    });

    describe('a single partially exclusive subgroup', () => {
        test('handles case where all members are optional', () => {
            const usage = optionsUsage([
                { name: 'A', required: false, conflicts: ['B', 'C', 'D', 'E'] },
                { name: 'B', required: false, conflicts: 'C' },
                { name: 'C', required: false, conflicts: 'D' },
                { name: 'D', required: false, conflicts: 'E' },
                { name: 'E', required: false, conflicts: 'B' },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: false,
                members: [
                    { type: 'option', name: 'A', required: false },
                    {
                        type: 'exclusive-group',
                        required: false,
                        members: [{
                            type: 'group',
                            required: false,
                            members: [
                                { type: 'option', name: 'B', required: false },
                                { type: 'option', name: 'D', required: false },
                            ],
                        }, {
                            type: 'group',
                            required: false,
                            members: [
                                { type: 'option', name: 'C', required: false },
                                { type: 'option', name: 'E', required: false },
                            ],
                        }],
                    },
                ],
            }]);
        });

        test('handles case where all members are required', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C', 'D', 'E'] },
                { name: 'B', required: true, conflicts: 'C' },
                { name: 'C', required: true, conflicts: 'D' },
                { name: 'D', required: true, conflicts: 'E' },
                { name: 'E', required: true, conflicts: 'B' },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    { type: 'option', name: 'A', required: true },
                    {
                        type: 'exclusive-group',
                        required: true,
                        members: [{
                            type: 'group',
                            required: true,
                            members: [
                                { type: 'option', name: 'B', required: true },
                                { type: 'option', name: 'D', required: true },
                            ],
                        }, {
                            type: 'group',
                            required: true,
                            members: [
                                { type: 'option', name: 'C', required: true },
                                { type: 'option', name: 'E', required: true },
                            ],
                        }],
                    },
                ],
            }]);
        });

        test('handles a mixture of required & non-required members', () => {
            const usage = optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C', 'D', 'E'] },
                { name: 'B', required: true, conflicts: 'C' },
                { name: 'C', required: true, conflicts: 'D' },
                { name: 'D', required: false, conflicts: 'E' },
                { name: 'E', required: false, conflicts: 'B' },
            ]);
            expect(usage).toMatchObject([{
                type: 'exclusive-group',
                required: true,
                members: [
                    { type: 'option', name: 'A', required: true },
                    {
                        type: 'exclusive-group',
                        required: true,
                        members: [{
                            type: 'group',
                            required: true,
                            members: [
                                { type: 'option', name: 'B', required: true },
                                { type: 'option', name: 'D', required: false },
                            ],
                        }, {
                            type: 'group',
                            required: true,
                            members: [
                                { type: 'option', name: 'C', required: true },
                                { type: 'option', name: 'E', required: false },
                            ],
                        }],
                    },
                ],
            }]);
        });

        test('detects invalid mixtures of required & non-required options', () => {
            expect(() => optionsUsage([
                { name: 'A', required: true, conflicts: ['B', 'C', 'D', 'E'] },
                { name: 'B', required: false, conflicts: 'C' },
                { name: 'C', required: true, conflicts: 'D' },
                { name: 'D', required: false, conflicts: 'E' },
                { name: 'E', required: false, conflicts: 'B' },
            ])).toThrowValidation([
                "Required option 'C' cannot have a mutually exclusive relationship with non-required option 'B'",
                "Required option 'C' cannot have a mutually exclusive relationship with non-required option 'D'",
            ]);
        });
    });

    describe('dependency relationships', () => {
        test('handles a single dependents', () => {
            const usage = optionsUsage([
                { name: 'A', required: false },
                { name: 'B', required: false, dependsOn: 'A' },
                { name: 'C', required: false },
                { name: 'D', required: true, dependsOn: 'C' },
            ]);
            expect(usage).toMatchObject([{
                type: 'option',
                name: 'A',
                required: false,
                dependent: { type: 'option', name: 'B', required: false },
            }, {
                type: 'option',
                name: 'C',
                required: false,
                dependent: { type: 'option', name: 'D', required: true },
            }]);
        });

        test('handles multiple optional dependents', () => {
            const usage = optionsUsage([
                { name: 'A', required: false },
                { name: 'B', required: false, dependsOn: 'A' },
                { name: 'C', required: false, dependsOn: 'A' },
                { name: 'E', required: false },
                { name: 'F', required: true, dependsOn: 'E' },
                { name: 'G', required: false, dependsOn: 'E' },
            ]);
            expect(usage).toMatchObject([{
                type: 'option',
                name: 'A',
                required: false,
                dependent: {
                    type: 'group',
                    members: [
                        { type: 'option', name: 'B', required: false },
                        { type: 'option', name: 'C', required: false },
                    ],
                },
            }, {
                type: 'option',
                name: 'E',
                required: false,
                dependent: {
                    type: 'group',
                    members: [
                        { type: 'option', name: 'F', required: true },
                        { type: 'option', name: 'G', required: false },
                    ],
                },
            }]);
        });

        test('handles dependency chains', () => {
            const usage = optionsUsage([
                { name: 'A', required: false },
                { name: 'B', required: false, dependsOn: 'A' },
                { name: 'C', required: false, dependsOn: 'B' },
                { name: 'D', required: false, dependsOn: 'F' },
                { name: 'E', required: true, dependsOn: 'D' },
                { name: 'F', required: false },
            ]);
            expect(usage).toMatchObject([{
                type: 'option',
                name: 'A',
                required: false,
                dependent: {
                    type: 'option',
                    name: 'B',
                    required: false,
                    dependent: { type: 'option', name: 'C', required: false },
                },
            }, {
                type: 'option',
                name: 'F',
                required: false,
                dependent: {
                    type: 'option',
                    name: 'D',
                    required: false,
                    dependent: { type: 'option', name: 'E', required: true },
                },
            }]);
        });

        test('handles dependencies with mutually exclusive relationships', () => {
            const usage = optionsUsage([
                { name: 'A', required: false },
                { name: 'B', required: false, dependsOn: 'A' },
                { name: 'C', required: false, conflicts: 'B' },
            ]);
            expect(usage).toMatchObject([{
                type: 'option',
                name: 'A',
                required: false,
                dependent: {
                    type: 'exclusive-group',
                    required: false,
                    members: [
                        { type: 'option', name: 'B', required: false },
                        { type: 'option', name: 'C', required: false },
                    ],
                },
            }, { type: 'option', name: 'C', required: false }]);
        });
    });
});