const validate = require('../lib/validate');

describe('Config validator', () => {
    test('detects invalid config structure', () => {
        expect(() => validate({
            args: 'name',
            options: {},
        })).toThrowValidation('Invalid config structure:');
    });

    test('detects invalid argument & option specs', () => {
        expect(() => validate({
            args: ['arg'],
            options: ['option'],
        })).toThrowValidation([
            'Invalid argument spec:',
            'Invalid option spec:',
        ]);
    });

    test('detects missing argument & option names', () => {
        expect(() => validate({
            args: [{}],
            options: [{}],
        })).toThrowValidation([
            'Missing argument name:',
            'Missing option name:',
        ]);
    });

    test('detects invalid argument & option names', () => {
        expect(() => validate({
            args: [{ name: true }],
            options: [{ name: 5 }],
        })).toThrowValidation([
            'Invalid argument name:',
            'Invalid option name:',
        ]);
    });

    test('detects duplicate option names', () => {
        expect(() => validate({
            options: [
                { name: 'A' },
                { name: 'A' },
            ],
        })).toThrowValidation('Duplicate option name:');
    });

    test('detects invalid `conflicts` field values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: { name: 'B' },
            }],
        })).toThrowValidation('Invalid conflicts field:');
    });

    test('detects invalid conflict references', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                conflicts: 'B',
            }],
        })).toThrowValidation('Invalid conflict reference:');
    });

    test('detects invalid requires field values', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 5,
            }],
        })).toThrowValidation('Invalid requires field:');
    });

    test('detects invalid requires references', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
            }],
        })).toThrowValidation('Invalid requires reference:');
    });

    test('detects contradictory references within option specs', () => {
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

    test('detects contradictory references across option specs', () => {
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

    test('detects circular require relationships between options', () => {
        expect(() => validate({
            options: [{
                name: 'A',
                requires: 'B',
            }, {
                name: 'B',
                requires: 'A',
            }],
        })).toThrowValidation('Circular require:');
    });

    test('recognizes valid configs', () => {
        expect(() => validate({
            args: [{ name: 'arg' }],
            options: [
                { name: 'A', requires: 'B' },
                { name: 'B', conflicts: 'C' },
                { name: 'C' },
            ],
        })).not.toThrowValidation();
    });
});