const helpOutput = require('..');

describe('exported module', () => {
    test('is a function', () => {
        expect(typeof helpOutput).toBe('function');
    });

    test('throws an error if a config object is not passed as the first argument', () => {
        expect(() => helpOutput()).toThrow('A config object is required');
    });

    describe('help message header', () => {
        test('top level title handles `%name` & `%version` placeholders', () => {
            const str = helpOutput({
                name: 'mycli',
                version: '1.0.0',
                title: '%name %version',
            }, { color: false, width: 40 });
            expect(str).toBe('mycli 1.0.0');
        });

        test('top level description wraps to specified width', () => {
            const str = helpOutput({
                description: 'Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
            }, { color: false, width: 40 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'Lorem Ipsum dolor sit amet, consectetur',
                'adipiscing elit, sed do eiusmod tempor.',
            ]);
        });

        test('top level description uses hard word wrap if width is sufficiently large', () => {
            const str = helpOutput({
                description: 'Lorem Ipsum dolor sit amet, consecteturadipiscingelitseddoeiusmodtempor.',
            }, { color: false, width: 40 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'Lorem Ipsum dolor sit amet, consectetura',
                'dipiscingelitseddoeiusmodtempor.',
            ]);
        });

        test('top level description is hidden if width is extremely limited', () => {
            const str = helpOutput({
                description: 'Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
            }, { color: false, width: 10 });
            expect(str).toBe('');
        });
    });

    describe('help message columns', () => {
        const mockConfig = {
            name: 'test',
            positional: [{
                name: 'arg',
                description: 'A positional argument',
            }],
            options: [{
                name: 'message',
                arg: 'msg',
                description: 'An optional message string',
            }, {
                name: 'quiet',
                alias: 'q',
                description: 'Do not log any output',
                conflicts: 'verbose',
            }, {
                name: 'verbose',
                alias: 'V',
                description: 'Log verbose output',
                conflicts: 'quiet',
            }, {
                name: 'help',
                alias: 'h',
                description: 'Display help message',
            }, {
                name: 'version',
                alias: 'v',
                description: 'Display program version',
            }],
        };

        test('do not collapse if available width is large', () => {
            const str = helpOutput(mockConfig, { color: false, width: 80 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'USAGE:',
                '  test <arg> [--message <msg>]',
                '       [--quiet | --verbose] [--help] [--version]',
                '',
                'ARGUMENTS:',
                '  <arg>                A positional argument',
                '',
                'OPTIONS:',
                '      --message <msg>  An optional message string',
                '  -q, --quiet          Do not log any output',
                '  -V, --verbose        Log verbose output',
                '  -h, --help           Display help message',
                '  -v, --version        Display program version',
            ]);
        });

        test('collapse id column to minimize vertical span if width is limited', () => {
            const str = helpOutput(mockConfig, { color: false, width: 45 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'USAGE:',
                '  test <arg> [--message <msg>]',
                '       [--quiet | --verbose]',
                '       [--help] [--version]',
                '',
                'ARGUMENTS:',
                '  <arg>           A positional argument',
                '',
                'OPTIONS:',
                '      --message   An optional message string',
                '           <msg>',
                '  -q, --quiet     Do not log any output',
                '  -V, --verbose   Log verbose output',
                '  -h, --help      Display help message',
                '  -v, --version   Display program version',
            ]);
        });

        test('hides description column if width is severely limited', () => {
            const str = helpOutput(mockConfig, { color: false, width: 25 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'USAGE:',
                '  test <arg>',
                '       [--message <msg>]',
                '       [-q | -V]',
                '       [-h] [-v]',
                '',
                'ARGUMENTS:',
                '  <arg>',
                '',
                'OPTIONS:',
                '      --message <msg>',
                '  -q, --quiet',
                '  -V, --verbose',
                '  -h, --help',
                '  -v, --version',
            ]);
        });

        test('hides description column & collapses id column if width is very severely limited', () => {
            const str = helpOutput(mockConfig, { color: false, width: 20 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'USAGE:',
                '  test ...',
                '',
                'ARGUMENTS:',
                '  <arg>',
                '',
                'OPTIONS:',
                '      --message',
                '               <msg>',
                '  -q, --quiet',
                '  -V, --verbose',
                '  -h, --help',
                '  -v, --version',
            ]);
        });

        test('hides argument & option tables if width is extremely limited', () => {
            const str = helpOutput(mockConfig, { color: false, width: 15 });
            expect(typeof str).toBe('string');
            expect(str.split('\n')).toEqual([
                'USAGE:',
                '  test ...',
            ]);
        });
    });
});