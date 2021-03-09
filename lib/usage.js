const ansi = require('./ansi');

/**
 * Format a help output usage description
 * @param {string} name - command name
 * @param {Object[]} usage - array of long & short verisons for each usage arg string
 * @param {string} width - terminal window width
 * @returns {string}
 */
module.exports = (name, usage, width) => {
    // space allocated for prefix & arguments
    const prewidth = name.length + 1,
        argwidth = width - prewidth;
    // start with the long versions of each arg
    let args = usage.map(({ long }) => long);
    // if the length of any long args is greator than allocated width, use short args args
    if (Math.max(...args.map(ansi.width)) > argwidth) {
        args = usage.map(({ short }) => short);
        // if the length of any short args is greator than allocated width, hide everything
        if (Math.max(...args.map(ansi.width)) > argwidth) {
            return `${name} ...`;
        }
    }
    // if all usage args fit in allocated width, return a single line
    if (ansi.width(args.join(' ')) <= argwidth) {
        return [name, ...args].join(' ');
    }
    // wrap usage args within the space allocated
    return args
        .slice(1)
        .reduce(([ln, ...lns], arg) => {
            const argln = `${ln} ${arg}`;
            return (ansi.width(argln) <= argwidth) ? [argln, ...lns] : [arg, ln, ...lns];
        }, args.slice(0, 1))
        .reverse()
        .map((l, i) => (i ? ' '.repeat(prewidth) : `${name} `) + l)
        .join('\n');
};