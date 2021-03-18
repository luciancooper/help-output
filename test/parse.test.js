const { splitArgs, parseArg } = require('../lib/parse');

describe('splitArgs', () => {
    test('splits single args', () => {
        const args = splitArgs('<foo>');
        expect(args).toStrictEqual(['<foo>']);
    });

    test('splits single character args', () => {
        const args = splitArgs('x  y');
        expect(args).toStrictEqual(['x', 'y']);
    });

    test('splits strings with untrimmed whitespace', () => {
        const args = splitArgs('  foo bar ');
        expect(args).toStrictEqual(['foo', 'bar']);
    });

    test('splits floating variadic indicators', () => {
        const args = splitArgs('<foo> [bar] ...');
        expect(args).toStrictEqual(['<foo>', '[bar] ...']);
    });

    test('splits args with internal whitespace', () => {
        const args = splitArgs('<foo ...>  [ <bar> ]');
        expect(args).toStrictEqual(['<foo ...>', '[ <bar> ]']);
    });

    test('splits unbalanced brackets', () => {
        const args = splitArgs('<foo>>  [bar]] [[baz]');
        expect(args).toStrictEqual(['<foo>>', '[bar]]', '[[baz]']);
    });

    test('splits empty strings', () => {
        const args = splitArgs('');
        expect(args).toHaveLength(0);
    });

    test('throws an error on leading variadic indicators', () => {
        expect(() => splitArgs('... foo')).toThrow("arg '... foo' contains a leading variadic indicator");
    });
});

describe('parseArg', () => {
    test('parses required args', () => {
        const args = parseArg('<foo>');
        expect(args).toStrictEqual({ name: 'foo', required: true, variadic: false });
    });

    test('parses optional args', () => {
        const args = parseArg('[foo]');
        expect(args).toStrictEqual({ name: 'foo', required: false, variadic: false });
    });

    test('parses optional args with inner whitespace', () => {
        const args = parseArg('[ foo ]');
        expect(args).toStrictEqual({ name: 'foo', required: false, variadic: false });
    });

    test('parses optional args with inner brackets', () => {
        const args = parseArg('[<foo>]');
        expect(args).toStrictEqual({ name: 'foo', required: false, variadic: false });
    });

    test('parses outer variadic indicators', () => {
        const args = parseArg('<foo>...');
        expect(args).toStrictEqual({ name: 'foo', required: true, variadic: true });
    });

    test('parses inner variadic indicators', () => {
        const args = parseArg('[foo ...]');
        expect(args).toStrictEqual({ name: 'foo', required: false, variadic: true });
    });

    test('parses inner variadic indicators on optional args with inner brackets', () => {
        const args = parseArg('[<foo...>]');
        expect(args).toStrictEqual({ name: 'foo', required: false, variadic: true });
    });
});