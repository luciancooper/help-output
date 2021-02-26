const Formatter = require('../lib/format');

describe('the Formatter class', () => {
    let formatter;

    beforeAll(() => {
        formatter = new Formatter({ color: false });
    });

    test('stringifies arg usage', () => {
        const str = formatter.usageArg({
            name: 'arg',
            repeat: true,
        });
        expect(str).toEqual('<arg> ...');
    });

    test('stringifies option usage', () => {
        const str = formatter.usageOption({
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

    test('stringifies option usage groupings', () => {
        const str = formatter.usageOption({
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

    test('stringifies option usage containing dependents', () => {
        const str = formatter.usageOption({
            type: 'option',
            name: 'a',
            dependent: {
                type: 'option',
                name: 'b',
            },
        });
        expect(str).toEqual('[-a [-b]]');
    });

    test('rejects invalid arg usage inputs', () => {
        expect(() => formatter.usageArg(null)).toThrow('Cannot format arg: null');
    });

    test('rejects invalid option usage types', () => {
        expect(() => formatter.usageOption({ type: 'opt' })).toThrow("unknown option type 'opt'");
    });

    test('converts args to table row arrays', () => {
        const row = formatter.argRow({
            name: 'arg',
            repeat: true,
            required: false,
            description: 'arg description',
        });
        expect(row).toStrictEqual(['[arg ...]', '', 'arg description']);
    });

    test('converts options to table row arrays', () => {
        const row = formatter.optionRow({
            name: 'opt',
            arg: 'str',
            description: 'opt description',
        });
        expect(row).toStrictEqual(['--opt', '<str>', 'opt description']);
    });

    test('formats output section titles', () => {
        const title = formatter.sectionTitle('title');
        expect(title).toEqual('title');
    });
});