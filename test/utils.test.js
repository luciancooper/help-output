const { terminalWidth, scriptName } = require('../lib/utils');

describe('utility functions', () => {
    test('`scriptName` returns a string', () => {
        const name = scriptName();
        expect(typeof name).toBe('string');
    });

    test('`terminalWidth` returns a number greator than 0', () => {
        const width = terminalWidth();
        expect(width).toBeGreaterThan(0);
    });
});