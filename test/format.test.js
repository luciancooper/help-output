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
                title: 'orange',
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
                title: ['bgMagenta', 'italic'],
            })).not.toThrowValidation();
        });
    });

    describe('when stringifying', () => {
        test('handles arg usage', () => {
            const result = new Formatter(false).usageArg({
                name: 'arg',
                repeat: true,
            });
            expect(result).toEqual({
                long: '<arg> ...',
                short: '<arg> ...',
            });
        });

        test('handles option usage', () => {
            const result = new Formatter(false).usageOption({
                type: 'option',
                name: 'opt',
                alias: ['o'],
                arg: ['<x>', {
                    name: 'y',
                    required: true,
                }, {
                    name: '<z>',
                    optional: true,
                    repeat: true,
                }],
            });
            expect(result).toEqual({
                long: '[--opt <x> <y> [<z> ...]]',
                short: '[-o <x> <y> [<z> ...]]',
            });
        });

        test('handles option usage groupings', () => {
            const result = new Formatter(false).usageOption({
                type: 'exclusive-group',
                members: [{
                    type: 'group',
                    members: [
                        { type: 'option', name: 'opt1', alias: ['a'] },
                        { type: 'option', name: 'opt2', alias: ['b'] },
                    ],
                }, { type: 'option', name: 'opt3', alias: ['c'] }],
            });
            expect(result).toEqual({
                long: '[[--opt1] [--opt2] | --opt3]',
                short: '[[-a] [-b] | -c]',
            });
        });

        test('handles option usage containing dependents', () => {
            const result = new Formatter(false).usageOption({
                type: 'option',
                name: 'opt',
                alias: ['a'],
                dependent: {
                    type: 'option',
                    name: 'b',
                },
            });
            expect(result).toEqual({
                long: '[--opt [-b]]',
                short: '[-a [-b]]',
            });
        });

        test('throws error on invalid arg usage inputs', () => {
            expect(() => new Formatter(false).usageArg(null)).toThrow('Cannot format arg: null');
        });

        test('throws error on invalid option usage types', () => {
            expect(() => new Formatter(false).usageOption({ type: 'opt' })).toThrow("unknown option type 'opt'");
        });
    });

    describe('will format', () => {
        test('positional table rows', () => {
            const rows = new Formatter(false).positionalRows([{
                name: 'arg',
                repeat: true,
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