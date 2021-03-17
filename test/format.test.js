const Formatter = require('../lib/format');

describe('the Formatter class', () => {
    describe('when instantiating', () => {
        test('throws an error if styles config is not an object', () => {
            expect(() => new Formatter(true, [])).toThrow('styles option must be an object');
        });

        test('throws an error if styles config contains invalid properties', () => {
            expect(() => new Formatter(true, {
                positional: 5,
                opton: 'green',
                header: 'orange',
            })).toThrowValidation([
                "style value for 'positional' must be a string, array of strings, or null",
                "'opton' is not a valid style key",
                "'orange' is not a recognized style",
            ]);
        });

        test('will not throw an error if styles config is valid', () => {
            expect(() => new Formatter(true, {
                positional: 'cyan',
                option: null,
                header: ['bgMagenta', 'italic'],
            })).not.toThrowValidation();
        });
    });

    describe('`stringifyArg` method', () => {
        test('formats required args', () => {
            const str = new Formatter(false).stringifyArg({ name: 'arg' });
            expect(str).toBe('<arg>');
        });

        test('formats optional args', () => {
            const str = new Formatter(false).stringifyArg({ name: 'arg', required: false });
            expect(str).toBe('[<arg>]');
        });

        test('formats variadic args', () => {
            const str = new Formatter(false).stringifyArg({ name: 'arg', variadic: true });
            expect(str).toBe('<arg> ...');
        });
    });

    describe('`stringifyOption` method', () => {
        test('formats non-required options', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                required: false,
            });
            expect(str).toBe('[--opt]');
        });

        test('formats required options', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                required: true,
            });
            expect(str).toBe('--opt');
        });

        test('formats option arguments', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                arg: [
                    '<x>',
                    { name: 'y', required: true },
                    { name: '<z>', required: false, variadic: true },
                ],
            });
            expect(str).toBe('[--opt <x> <y> [<z> ...]]');
        });

        test('formats mutually-exclusive option groups', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'exclusive-group',
                required: false,
                members: [
                    { type: 'option', name: 'opt1', required: false },
                    { type: 'option', name: 'opt2', required: false },
                    { type: 'option', name: 'opt3', required: false },
                ],
            });
            expect(str).toBe('[--opt1 | --opt2 | --opt3]');
        });

        test('formats required mutually-exclusive option groups', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'exclusive-group',
                required: true,
                members: [
                    { type: 'option', name: 'opt1', required: true },
                    { type: 'option', name: 'opt2', required: true },
                    { type: 'option', name: 'opt3', required: true },
                ],
            });
            expect(str).toBe('(--opt1 | --opt2 | --opt3)');
        });

        test('formats mixed option groupings', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'exclusive-group',
                members: [{
                    type: 'group',
                    members: [
                        { type: 'option', name: 'opt1' },
                        { type: 'option', name: 'opt2' },
                    ],
                }, { type: 'option', name: 'opt3' }],
            });
            expect(str).toBe('[[--opt1] [--opt2] | --opt3]');
        });

        test('formats mixed required option groupings', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'exclusive-group',
                required: true,
                members: [{
                    type: 'group',
                    required: true,
                    members: [
                        { type: 'option', name: 'opt1', required: true },
                        { type: 'option', name: 'opt2', required: false },
                    ],
                }, { type: 'option', name: 'opt3', required: true }],
            });
            expect(str).toBe('(--opt1 [--opt2] | --opt3)');
        });

        test('formats options with dependents', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                dependent: { type: 'option', name: 'b' },
            });
            expect(str).toBe('[--opt [-b]]');
        });

        test('formats required options with dependents', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                required: true,
                dependent: { type: 'option', name: 'b' },
            });
            expect(str).toBe('--opt [-b]');
        });

        test('formats options with required dependents', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                dependent: { type: 'option', name: 'b', required: true },
            });
            expect(str).toBe('[--opt -b]');
        });

        test('formats required options with required dependents', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                required: true,
                dependent: { type: 'option', name: 'b', required: true },
            });
            expect(str).toBe('--opt -b');
        });

        test('always uses an options alias if `preferAlias` is present', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'opt',
                alias: ['o'],
                preferAlias: 'o',
            }, false);
            expect(str).toEqual('[-o]');
        });

        test('does not use an options alias if it is longer than the options name', () => {
            const str = new Formatter(false).stringifyOption({
                type: 'option',
                name: 'msg',
                alias: ['message'],
            }, true);
            expect(str).toBe('[--msg]');
        });
    });

    describe('`usageArg` method', () => {
        test('returns an object containing long & short versions of formatted args', () => {
            const result = new Formatter(false).usageArg({ name: 'arg' });
            expect(result).toEqual({ long: '<arg>', short: '<arg>' });
        });

        test('throws error when given invalid inputs', () => {
            expect(() => new Formatter(false).usageArg(null)).toThrow('Cannot format arg: null');
        });
    });

    describe('`usageOption` method', () => {
        test('returns an object containing long & short versions of formatted options', () => {
            const result = new Formatter(false).usageOption({
                type: 'option',
                name: 'opt',
                alias: ['o'],
            });
            expect(result).toEqual({ long: '[--opt]', short: '[-o]' });
        });

        test('throws error on invalid option types', () => {
            expect(() => new Formatter(false).usageOption({ type: 'opt' })).toThrow("unknown option type 'opt'");
        });
    });

    describe('will format', () => {
        test('positional table rows', () => {
            const rows = new Formatter(false).positionalRows([{
                name: 'arg',
                variadic: true,
                required: false,
                description: 'arg description',
            }]);
            expect(rows).toStrictEqual([
                ['[arg ...]', '', 'arg description'],
            ]);
        });

        test('option table rows', () => {
            const rows = new Formatter(false).optionRows([{
                name: 'opt',
                arg: 'str',
                description: 'opt description',
            }]);
            expect(rows).toStrictEqual([
                ['--opt', '<str>', 'opt description'],
            ]);
        });

        test('option table rows with aliases', () => {
            const row = new Formatter(false).optionRows([{
                name: 'opt1',
                alias: ['aa'],
                arg: 'str',
                description: 'opt1 description',
            }, {
                name: 'opt2',
                alias: ['bb', 'b'],
                description: 'opt2 description',
            }]);
            expect(row).toStrictEqual([
                ['    --aa, --opt1', '<str>', 'opt1 description'],
                ['-b, --bb, --opt2', '', 'opt2 description'],
            ]);
        });

        test('output section titles', () => {
            const title = new Formatter(false).sectionTitle('title');
            expect(title).toEqual('title');
        });
    });
});