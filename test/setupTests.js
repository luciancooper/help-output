const chalk = require('chalk');

expect.extend({
    toThrowValidation(received, errors = []) {
        const expectedErrors = typeof errors === 'string' ? [errors] : errors;
        let recievedErrors = [];
        try {
            received();
            return {
                pass: false,
                message: () => 'Expected validation error',
            };
        } catch (e) {
            if (!e.errors) {
                return {
                    pass: false,
                    message: () => `Expected validation error, but recieved non-validation error:\n${
                        chalk.dim(e.message)
                    }`,
                };
            }
            recievedErrors = e.errors;
        }
        const failedMatches = expectedErrors.filter((substr) => (
                !recievedErrors.some((str) => str.indexOf(substr) >= 0)
            )),
            pass = failedMatches.length === 0;
        return {
            pass,
            message: pass ? () => (
                `Errors found during validation:${
                    recievedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }${
                    expectedErrors.length ? `\nMatched the following substring(s) as expected:${
                        expectedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                    }` : ''
                }`
            ) : () => (
                `Errors found during validation:${
                    recievedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }\nDid not match the following substring(s) as expected:${
                    failedMatches.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }`
            ),
        };
    },
});