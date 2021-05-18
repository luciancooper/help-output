const { stringWidth } = require('tty-strings');

/**
 * Wrap usage args to a specified width with minimal raggedness
 * Adapted from {@link https://github.com/nginz/fair-lines|fair-lines}
 * @param {string[]} items - usage item strings to wrap
 * @param {number} width - char width to wrap to
 * @returns {string[]} - wrapped lines
 */
function wrapUsage(items, width) {
    const n = items.length,
        slack = Array.from({ length: n }, () => new Array(n));
    // compute first row of slack table
    items.reduce((len, item, i) => {
        slack[0][i] = len + stringWidth(item);
        return slack[0][i];
    }, 0);
    // fill in remaining rows of slack table
    for (let i = 1; i < n; i += 1) {
        for (let k = i; k < n; k += 1) {
            slack[i][k] = slack[0][k] - slack[0][i - 1];
        }
    }
    // compute slack squares
    for (let i = 0; i < n; i += 1) {
        for (let k = i; k < n; k += 1) {
            const s = width - (slack[i][k] + (k - i));
            slack[i][k] = (s >= 0) ? (s ** 2) : Infinity;
        }
    }
    // fill cost & lines arrays
    const cost = [],
        lines = [];
    for (let i = 0; i < n; i += 1) {
        let ci = Infinity;
        for (let k = 0; k <= i; k += 1) {
            const cik = (k === 0) ? slack[k][i] : cost[k - 1] + slack[k][i];
            if (cik < ci) {
                ci = cik;
                lines[i] = k;
            }
        }
        cost[i] = ci;
    }
    // determine line break points
    const breaks = [];
    {
        let i = lines.length - 1;
        while (i >= 0) {
            breaks.push(lines[i]);
            i = lines[i] - 1;
        }
    }
    // slice items at break points to form lines
    return breaks.reverse().map((idx, i, arr) => (
        items.slice(idx, arr[i + 1]).join(' ')
    ));
}

/**
 * Format a help output usage description
 * @param {string} name - command name
 * @param {Object[]} usage - array of long & short verisons for each usage arg string
 * @param {number} maxWidth - maximum line width
 * @param {number} [targetWidth=maxWidth] - target line width to wrap to
 * @returns {string}
 */
module.exports = (name, usage, maxWidth, targetWidth = maxWidth) => {
    // space allocated for prefix
    const prewidth = name.length + 1;
    // start with the long versions of each arg
    let args = usage.map(({ long }) => long),
        // calculate max length of a single long arg
        argwidth = Math.max(...args.map(stringWidth));
    // determine args to use
    if (argwidth > maxWidth - prewidth) {
        // at least one long arg is wider than the maximum available width, switch to short args
        args = usage.map(({ short }) => short);
        // calculate max length of a single short arg
        argwidth = Math.max(...args.map(stringWidth));
        // if the length of any short args is greator the maximum available width, hide everything
        if (argwidth > maxWidth - prewidth) {
            return `${name} ...`;
        }
    }
    // the line width to wrap to
    const width = Math.max(argwidth, targetWidth - prewidth);
    // if all usage args fit in allocated width, return a single line
    if (stringWidth(args.join(' ')) <= width) {
        return [name, ...args].join(' ');
    }
    // wrap usage args within the space allocated
    return wrapUsage(args, width)
        .map((l, i) => (i ? ' '.repeat(prewidth) : `${name} `) + l)
        .join('\n');
};