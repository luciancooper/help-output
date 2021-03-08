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
        if (!expectedErrors.length) {
            return {
                pass: true,
                message: () => (
                    `Validation error thrown:${
                        recievedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                    }`
                ),
            };
        }
        let pass = expectedErrors.length === recievedErrors.length;
        if (pass) {
            const remainingErrors = [...recievedErrors];
            expectedErrors.forEach((substr) => {
                const i = remainingErrors.findIndex((str) => str.indexOf(substr) >= 0);
                if (i >= 0) remainingErrors.splice(i, 1);
            });
            pass = remainingErrors.length === 0;
        }
        return {
            pass,
            message: pass ? () => (
                `Errors found during validation:${
                    recievedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }\nMatched expected error(s):${
                    expectedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }`
            ) : () => (
                `Errors found during validation:${
                    recievedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }\nDid not match expected error(s):${
                    expectedErrors.map((s) => chalk`\n {dim *} {yellow ${s}}`).join('')
                }`
            ),
        };
    },
});