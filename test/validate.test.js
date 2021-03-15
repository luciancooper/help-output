const validate = require('../lib/validate');

describe('config `title` field', () => {
    test('detects non string `title` values', () => {
        expect(() => validate({
            title: {},
        })).toThrowValidation("Invalid title field: 'title' must be a string");
    });

    test('detects missing `version` values when `title` includes placeholder', () => {
        expect(() => validate({
            title: '%name %version',
        })).toThrowValidation("Invalid title field: 'version' field must be specified if 'title' includes placeholder");
    });
});

describe('config `positional` field', () => {
    test('detects non array `positional` field', () => {
        expect(() => validate({
            positional: {},
        })).toThrowValidation("Invalid config structure: 'positional'");
    });

    test('detects non object positional arg specs', () => {
        expect(() => validate({
            positional: ['arg'],
        })).toThrowValidation('Invalid positional arg spec:');
    });

    test('detects missing positional arg `name` values', () => {
        expect(() => validate({
            positional: [{}],
        })).toThrowValidation('Missing positional arg name:');
    });

    test('detects invalid positional arg `name` types', () => {
        expect(() => validate({
            positional: [{ name: true }],
        })).toThrowValidation('Invalid positional arg name:');
    });

    test('recognizes valid positional arg `name` values', () => {
        expect(() => validate({
            positional: [{ name: 'arg' }],
        })).not.toThrowValidation();
    });
});

describe('config `options` field', () => {
    test('detects non array `options` field', () => {
        expect(() => validate({
            options: {},
        })).toThrowValidation("Invalid config structure: 'options'");
    });

    test('detects non object option specs', () => {
        expect(() => validate({
            options: ['option'],
        })).toThrowValidation('Invalid option spec:');
    });

    test('detects missing option `name` values', () => {
        expect(() => validate({
            options: [{}],
        })).toThrowValidation('Missing option name:');
    });

    test('detects invalid option `name` types', () => {
        expect(() => validate({
            options: [{ name: 5 }],
        })).toThrowValidation('Invalid option name: type of');
    });

    test('detects bad option `name` values', () => {
        expect(() => validate({
            options: [{ name: '--' }],
        })).toThrowValidation("Invalid option name: '--'");
    });

    test('detects duplicate option `name` values', () => {
        expect(() => validate({
            options: [
                { name: 'A' },
                { name: 'A' },
            ],
        })).toThrowValidation('Duplicate option name:');
    });

    test('resolves prefixed option `name` values', () => {
        expect(validate({
            options: [{ name: '--opt' }],
        })).toMatchObject({
            options: [{ name: 'opt' }],
        });
    });
});

describe('config option `alias` field', () => {
    test('detects invalid `alias` types', () => {
        expect(() => validate({
            options: [{ name: 'opt', alias: 5 }],
        })).toThrowValidation('Invalid alias field:');
    });

    test('detects bad `alias` values', () => {
        expect(() => validate({
            options: [{ name: 'opt', alias: '-' }],
        })).toThrowValidation("Invalid alias name: '-'");
    });

    test('detects multiple options with the same alias', () => {
        expect(() => validate({
            options: [
                { name: 'opt1', alias: 'a' },
                { name: 'opt2', alias: 'a' },
            ],
        })).toThrowValidation("Duplicate alias name: 'a'");
    });

    test('detects alias names that match option names', () => {
        expect(() => validate({
            options: [
                { name: 'a' },
                { name: 'opt', alias: 'a' },
            ],
        })).toThrowValidation("Duplicate option name: 'a'");
    });

    test('detects option names that match alias names', () => {
        expect(() => validate({
            options: [
                { name: 'opt1', alias: 'a' },
                { name: 'opt2', alias: 'a' },
                { name: 'a' },
            ],
        })).toThrowValidation("Duplicate option name: 'a'");
    });

    test('resolves prefixed `alias` values', () => {
        expect(validate({
            options: [{ name: 'opt', alias: '-a' }],
        })).toMatchObject({
            options: [{ name: 'opt', alias: ['a'] }],
        });
    });

    test('silently removes redundant `alias` values', () => {
        expect(validate({
            options: [
                { name: 'opt', alias: ['opt'] },
            ],
        })).toMatchObject({
            options: [
                { name: 'opt', alias: [] },
            ],
        });
    });

    test('silently removes duplicate `alias` values', () => {
        expect(validate({
            options: [
                { name: 'opt', alias: ['o', 'o'] },
            ],
        })).toMatchObject({
            options: [
                { name: 'opt', alias: ['o'] },
            ],
        });
    });
});

describe('config option `preferAlias` field', () => {
    test('detects invalid `preferAlias` types', () => {
        expect(() => validate({
            options: [{ name: 'opt', alias: 'o', preferAlias: [] }],
        })).toThrowValidation("Invalid preferAlias field: spec for option 'opt' must be a boolean or string");
    });

    test('detects bad `preferAlias` references', () => {
        expect(() => validate({
            options: [{ name: 'opt', alias: 'a', preferAlias: 'b' }],
        })).toThrowValidation("Invalid preferAlias field: 'b' does not match any alias of 'opt'");
    });

    test('resolves prefixed `preferAlias` values', () => {
        expect(validate({
            options: [{ name: 'opt', alias: 'o', preferAlias: '-o' }],
        })).toMatchObject({
            options: [{ name: 'opt', alias: ['o'], preferAlias: 'o' }],
        });
    });

    test('resolves `preferAlias: true` as the first alias specified when multiple aliases are present', () => {
        expect(validate({
            options: [{ name: 'opt', alias: ['a', 'b'], preferAlias: true }],
        })).toMatchObject({
            options: [{ name: 'opt', alias: ['a', 'b'], preferAlias: 'a' }],
        });
    });

    test('silently ignores `preferAlias: true` when no aliases are present', () => {
        expect(validate({
            options: [{ name: 'opt', preferAlias: true }],
        })).toMatchObject({
            options: [{ name: 'opt', preferAlias: false }],
        });
    });
});

describe('config option `arg` field', () => {
    test('detects invalid `arg` field values', () => {
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

    test("detects `arg` field strings that start with '...'", () => {
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

    test('recognizes valid `arg` fields', () => {
        expect(() => validate({
            options: [
                { name: 'opt1', arg: 'x ...' },
                { name: 'opt2', arg: { name: 'x' } },
                { name: 'opt3', arg: ['x', { name: 'y' }] },
            ],
        })).not.toThrowValidation();
    });

    test('parses option `arg` strings to object form', () => {
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
});

describe('config option `conflicts` field', () => {
    test('detects invalid `conflicts` types', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: { name: 'B' },
            }],
        })).toThrowValidation('Invalid conflicts field:');
    });

    test('detects invalid `conflicts` types within an array', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: [null],
            }],
        })).toThrowValidation('Invalid conflicts field:');
    });

    test('detects invalid `conflicts` values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: '--',
            }],
        })).toThrowValidation("Invalid conflict reference: '--'");
    });

    test('detects invalid `conflicts` values within an array', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: ['--'],
            }],
        })).toThrowValidation("Invalid conflict reference: '--'");
    });

    test('detects bad `conflicts` references', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: 'B',
            }],
        })).toThrowValidation('Invalid conflict reference: option');
    });

    test('resolves prefixed `conflicts` references', () => {
        expect(validate({
            options: [
                { name: 'a' },
                { name: 'b', conflicts: '-a' },
            ],
        })).toMatchObject({
            options: [
                { name: 'a' },
                { name: 'b', conflicts: ['a'] },
            ],
        });
    });

    test('resolves `conflicts` alias references', () => {
        expect(validate({
            options: [
                { name: 'opt1', alias: 'a' },
                { name: 'opt2', conflicts: 'a' },
            ],
        })).toMatchObject({
            options: [
                { name: 'opt1', alias: ['a'] },
                { name: 'opt2', conflicts: ['opt1'] },
            ],
        });
    });

    test('silently removes duplicate `conflicts` values', () => {
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

    test('silently removes self-referencing `conflicts` values', () => {
        expect(validate({
            options: [{
                name: 'A',
                conflicts: 'A',
            }],
        })).toMatchObject({
            options: [{
                name: 'A',
                conflicts: [],
            }],
        });
    });
});

describe('config option `requires` field', () => {
    test('detects invalid `requires` types', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 5,
            }],
        })).toThrowValidation('Invalid requires field: type of');
    });

    test('detects invalid `requires` values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: '--',
            }],
        })).toThrowValidation("Invalid requires field: '--'");
    });

    test('detects bad `requires` references', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
            }],
        })).toThrowValidation('Invalid requires reference:');
    });

    test('detects circular `requires` relationships between options', () => {
        expect(() => validate({
            options: [
                { name: 'A', requires: 'B' },
                { name: 'B', requires: 'A' },
            ],
        })).toThrowValidation('Circular require:');
    });

    test('resolves prefixed `requires` references', () => {
        expect(validate({
            options: [
                { name: 'opt1' },
                { name: 'opt2', requires: '--opt1' },
            ],
        })).toMatchObject({
            options: [
                { name: 'opt1' },
                { name: 'opt2', requires: 'opt1' },
            ],
        });
    });

    test('resolves `requires` alias references', () => {
        expect(validate({
            options: [
                { name: 'opt1', alias: 'a' },
                { name: 'opt2', requires: 'a' },
            ],
        })).toMatchObject({
            options: [
                { name: 'opt1', alias: ['a'] },
                { name: 'opt2', requires: 'opt1' },
            ],
        });
    });

    test('silently removes self-referencing `requires` values', () => {
        expect(validate({
            options: [{
                name: 'opt',
                requires: 'opt',
            }],
        })).toMatchObject({
            options: [{
                name: 'opt',
                requires: undefined,
            }],
        });
    });
});

describe('config option contradictions', () => {
    test('detects contradictory references within a single option', () => {
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

    test('detects contradictory references across multiple options', () => {
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
});