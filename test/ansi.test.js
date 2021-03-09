const ansi = require('../lib/ansi');

describe('ansi utils', () => {
    test('`ansi.regex` is a regular expression', () => {
        expect(ansi.regex).toBeInstanceOf(RegExp);
    });

    test('`ansi.strip()` removes excape sequences from input strings', () => {
        const str = ansi.strip('\u001b[32mstring\u001b[39m');
        expect(str).toBe('string');
    });

    test('`ansi.strip()` returns a string given a non string input', () => {
        const str = ansi.strip(5);
        expect(str).toBe('5');
    });

    test('`ansi.width()` measures strings with escape sequences', () => {
        const w = ansi.width('\u001b[32mstring\u001b[39m');
        expect(w).toBe(6);
    });

    test('`ansi.contains()` correctly identifies strings with escape sequences', () => {
        const hasAnsi = ansi.contains('\u001b[32mstring\u001b[39m');
        expect(hasAnsi).toBe(true);
    });

    test('`ansi.contains()` correctly identifies strings without escape sequences', () => {
        const hasAnsi = ansi.contains('string');
        expect(hasAnsi).toBe(false);
    });
});