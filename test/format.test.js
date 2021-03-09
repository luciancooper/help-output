const Formatter = require('../lib/format');

describe('the Formatter class', () => {
    describe('when instantiating', () => {
        test('throws an error if styles config is not an object', () => {
            expect(() => new Formatter(true, [])).toThrow('styles option must be an object');
        });

        test('throws an error if styles config contains invalid properties', () => {
            expect(() => new Formatter(true, {
                arg: 5,
                opton: 'green',
                title: 'orange',
            })).toThrowValidation([
                "style value for 'arg' must be a string, array of strings, or null",
                "'opton' is not a valid style key",
                "'orange' is not a recognized style",
            ]);
        });

        test('will not throw an error if styles config is valid', () => {
            expect(() => new Formatter(true, {
                arg: 'cyan',
                option: null,
                title: ['bgMagenta', 'italic'],
            })).not.toThrowValidation();
        });
    });

    describe('when stringifying', () => {
        test('handles arg usage', () => {
            const str = new Formatter(false).usageArg({
                name: 'arg',
                repeat: true,
            });
            expect(str).toEqual('<arg> ...');
        });

        test('handles option usage', () => {
            const str = new Formatter(false).usageOption({
                type: 'option',
                name: 'opt',
                arg: ['<x>', {
                    name: 'y',
                    required: true,
                }, {
                    name: '<z>',
                    optional: true,
                    repeat: true,
                }],
            });
            expect(str).toEqual('[--opt <x> <y> [<z> ...]]');
        });

        test('handles option usage groupings', () => {
            const str = new Formatter(false).usageOption({
                type: 'exclusive-group',
                members: [{
                    type: 'group',
                    members: [
                        { type: 'option', name: 'a' },
                        { type: 'option', name: 'b' },
                    ],
                }, { type: 'option', name: 'c' }],
            });
            expect(str).toEqual('[[-a] [-b] | -c]');
        });

        test('handles option usage containing dependents', () => {
            const str = new Formatter(false).usageOption({
                type: 'option',
                name: 'a',
                dependent: {
                    type: 'option',
                    name: 'b',
                },
            });
            expect(str).toEqual('[-a [-b]]');
        });

        test('throws error on invalid arg usage inputs', () => {
            expect(() => new Formatter(false).usageArg(null)).toThrow('Cannot format arg: null');
        });

        test('throws error on invalid option usage types', () => {
            expect(() => new Formatter(false).usageOption({ type: 'opt' })).toThrow("unknown option type 'opt'");
        });
    });

    describe('will format', () => {
        test('arg table rows', () => {
            const rows = new Formatter(false).argRows([{
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