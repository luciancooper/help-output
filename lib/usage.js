const ansi = require('./ansi');

/**
 * Format a help output usage description
 * @param {string} name - command name
 * @param {string[]} usage - usage arg strings
 * @param {string} width - terminal window width
 * @returns {string}
 */
module.exports = (name, usage, width) => {
    // space allocated for prefix & arguments
    const prewidth = name.length + 1,
        argwidth = width - prewidth;
    // if the length of any usage args is greator than allocated width, hide them
    if (Math.max(...usage.map(ansi.width)) > argwidth) {
        return `${name} ...`;
    }
    // if all usage args fit in allocated width, return a single line
    if (ansi.width(usage.join(' ')) <= argwidth) {
        return [name, ...usage].join(' ');
    }
    // wrap usage args within the space allocated
    return usage
        .slice(1)
        .reduce(([ln, ...lns], arg) => {
            const argln = `${ln} ${arg}`;
            return (ansi.width(argln) <= argwidth) ? [argln, ...lns] : [arg, ln, ...lns];
        }, usage.slice(0, 1))
        .reverse()
        .map((l, i) => (i ? ' '.repeat(prewidth) : `${name} `) + l)
        .join('\n');
};