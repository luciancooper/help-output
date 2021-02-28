const validate = require('../lib/validate');

describe('config validator', () => {
    test('detects invalid config structure', () => {
        expect(() => validate({
            args: 'name',
            options: {},
        })).toThrowValidation('Invalid config structure:');
    });

    test('detects invalid argument & option specs', () => {
        expect(() => validate({
            args: ['arg'],
            options: ['option'],
        })).toThrowValidation([
            'Invalid argument spec:',
            'Invalid option spec:',
        ]);
    });

    test('detects missing argument & option names', () => {
        expect(() => validate({
            args: [{}],
            options: [{}],
        })).toThrowValidation([
            'Missing argument name:',
            'Missing option name:',
        ]);
    });

    test('detects invalid argument & option names', () => {
        expect(() => validate({
            args: [{ name: true }],
            options: [{ name: 5 }, { name: '--' }],
        })).toThrowValidation([
            'Invalid argument name:',
            'Invalid option name: type of',
            "Invalid option name: '--'",
        ]);
    });

    test('detects duplicate option names', () => {
        expect(() => validate({
            options: [
                { name: 'A' },
                { name: 'A' },
            ],
        })).toThrowValidation('Duplicate option name:');
    });

    test('detects invalid option `arg` field values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                arg: true,
            }, {
                name: 'B',
                arg: {},
            }, {
                name: 'C',
                arg: [{}, null],
            }],
        })).toThrowValidation([
            'Invalid option arg spec: improper value',
            'Invalid option arg spec: object',
            'Invalid option arg spec: array',
        ]);
    });

    test("detects option `arg` fields that start with '...'", () => {
        expect(() => validate({
            options: [{
                name: 'A',
                arg: '... arg',
            }, {
                name: 'B',
                arg: ['arg1', '... arg2'],
            }],
        })).toThrowValidation([
            "Invalid option arg spec: arg '... arg'",
            "Invalid option arg spec: arg '... arg2'",
        ]);
    });

    test('detects invalid `conflicts` property values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: { name: 'B' },
            }],
        })).toThrowValidation('Invalid conflicts field:');
    });

    test('detects invalid `conflicts` property values within an array', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: [null],
            }],
        })).toThrowValidation('Invalid conflicts field:');
    });

    test('detects invalid conflict references', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: ['B', '--'],
            }],
        })).toThrowValidation([
            'Invalid conflict reference: option',
            "Invalid conflict reference: '--'",
        ]);
    });

    test('detects invalid requires field values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 5,
            }, {
                name: 'B',
                requires: '--',
            }],
        })).toThrowValidation([
            'Invalid requires field: type of',
            "Invalid requires field: '--'",
        ]);
    });

    test('detects invalid requires references', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
            }],
        })).toThrowValidation('Invalid requires reference:');
    });

    test('detects contradictory references within option specs', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
                conflicts: ['B'],
            }, {
                name: 'B',
            }],
        })).toThrowValidation('Contradictory reference:');
    });

    test('detects contradictory references across option specs', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
            }, {
                name: 'B',
                conflicts: 'A',
            }],
        })).toThrowValidation('Contradictory reference');
    });

    test('detects circular require relationships between options', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
            }, {
                name: 'B',
                requires: 'A',
            }],
        })).toThrowValidation('Circular require:');
    });

    test('recognizes valid configs', () => {
        expect(() => validate({
            args: [{ name: 'arg' }],
            options: [
                { name: 'A', arg: ['x', 'y'], requires: 'B' },
                { name: 'B', arg: 'x', conflicts: 'C' },
                { name: 'C', arg: { name: 'x' } },
            ],
        })).not.toThrowValidation();
    });

    test('parses option arg strings to object form', () => {
        expect(validate({
            options: [{
                name: 'opt',
                arg: 'arg1 [<arg2>] ...',
            }],
        })).toMatchObject({
            options: [{
                name: 'opt',
                arg: [
                    { name: 'arg1', optional: false },
                    { name: 'arg2', optional: true, repeat: true },
                ],
            }],
        });
    });

    test('resolves prefixed option names & references', () => {
        expect(validate({
            options: [
                { name: '--opt' },
                { name: 'v', conflicts: '--opt' },
            ],
        })).toMatchObject({
            options: [
                { name: 'opt' },
                { name: 'v', conflicts: ['opt'] },
            ],
        });
    });

    test('silently removes duplicate conflict references', () => {
        expect(validate({
            options: [
                { name: 'A', conflicts: ['B', 'B', 'C', 'C'] },
                { name: 'B', conflicts: ['C', 'A', 'C'] },
                { name: 'C' },
            ],
        })).toMatchObject({
            options: [
                { name: 'A', conflicts: ['B', 'C'] },
                { name: 'B', conflicts: ['C', 'A'] },
                { name: 'C' },
            ],
        });
    });

    test('silently removes self-referencing conflicts & requirements', () => {
        expect(validate({
            options: [
                { name: 'A', conflicts: 'A' },
                { name: 'B', requires: 'B' },
            ],
        })).toMatchObject({
            options: [
                { name: 'A', conflicts: [] },
                { name: 'B', requires: undefined },
            ],
        });
    });
});