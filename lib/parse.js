/**
 * Split a string of positional args
 * @param {string} str - arg string
 * @returns {string[]}
 */
function splitArgs(str) {
    const n = str.length,
        stack = [],
        args = [];
    let j = -1;
    for (let i = 0; i < n; i += 1) {
        switch (str[i]) {
            case '<':
            case '[':
                stack.push(str[i]);
                break;
            case '>': {
                const x = stack.lastIndexOf('<');
                if (x >= 0) stack.splice(x, 1);
                break;
            }
            case ']': {
                const x = stack.lastIndexOf('[');
                if (x >= 0) stack.splice(x, 1);
                break;
            }
            case ' ':
                if (!stack.length) {
                    if (i > j + 1) args.push(str.slice(j + 1, i));
                    j = i;
                }
                break;
            default:
                break;
        }
    }
    if (n > j + 1) args.push(str.slice(j + 1));
    // merge floating variadic indicators
    {
        let i = 0;
        while (i < args.length) {
            // check for variadic arg indicator (at least 2 '.' or '…')
            if (/^(?:\.{2,}|…)$/.test(args[i])) {
                if (i === 0) {
                    throw new Error(`arg '${str}' contains a leading variadic indicator`);
                }
                // append to previous arg string
                args[i - 1] += ` ${args[i]}`;
                // remove variadic indicator from array
                args.splice(i, 1);
            } else {
                i += 1;
            }
        }
    }
    return args;
}

/**
 * Parse a positional arg value
 * @param {string} str - arg string
 * @returns {Object}
 */
function parseArg(str) {
    // transform arg string to object
    let name = str,
        variadic = false,
        required = true;
    // check for outer variadic indicator
    if (/(?:^(?:\.{2,}|…)|(?:\.{2,}|…)$)/.test(name)) {
        variadic = true;
        name = name.replace(/(?:^(?:\.{2,}|…) *| *(?:\.{2,}|…)$)/g, '');
    }
    // check for optional brackets
    if (/^\[.+\]$/.test(name)) {
        required = false;
        name = name.replace(/^\[ *(.+?) *\]$/, '$1');
    }
    // remove outer '<' '>' brackets
    name = name.replace(/^< *(.+?) *>$/, '$1');
    // check for inner variadic indicator
    if (/(?:^(?:\.{2,}|…)|(?:\.{2,}|…)$)/.test(name)) {
        variadic = true;
        name = name
            .replace(/(?:^(?:\.{2,}|…) *| *(?:\.{2,}|…)$)/g, '')
            .replace(/^< *(.+?) *>$/, '$1');
    }
    // return parsed arg object
    return { name, required, variadic };
}

module.exports = {
    splitArgs,
    parseArg,
};