const formatUsage = require('../lib/usage');

describe('usage section formatter', () => {
    const mockUsage = [
        { long: '<arg>', short: '<arg>' },
        { long: '[--message <msg>]', short: '[-m <msg>]' },
        { long: '[--quiet | --verbose]', short: '[-q | -V]' },
        { long: '[--help]', short: '[-h]' },
        { long: '[--version]', short: '[-v]' },
    ];

    test('returns usage args in a single line given infinite width', () => {
        const str = formatUsage('test', mockUsage, Infinity);
        expect(str).toEqual('test <arg> [--message <msg>] [--quiet | --verbose] [--help] [--version]');
    });

    test('wraps usage args to multiple lines if available width is limited', () => {
        const str = formatUsage('test', mockUsage, 60);
        expect(typeof str).toBe('string');
        expect(str.split('\n')).toEqual([
            'test <arg> [--message <msg>]',
            '     [--quiet | --verbose] [--help] [--version]',
        ]);
    });

    test('returns wrapped short form args if available width is severely limited', () => {
        const str = formatUsage('test', mockUsage, 20);
        expect(typeof str).toBe('string');
        expect(str.split('\n')).toEqual([
            'test <arg>',
            '     [-m <msg>]',
            '     [-q | -V]',
            '     [-h] [-v]',
        ]);
    });

    test('hides usage args if available width is very severely limited', () => {
        const str = formatUsage('test', mockUsage, 10);
        expect(str).toEqual('test ...');
    });
});