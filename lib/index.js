const path = require('path'),
    wrapAnsi = require('wrap-ansi'),
    styles = require('./styles'),
    ansi = require('./ansi'),
    formatUsage = require('./usage');

function terminalWidth() {
    return (
        (typeof process.stdout.getWindowSize === 'function')
            ? process.stdout.getWindowSize()[0]
            : (process.stdout.columns || 80)
    ) - (process.platform === 'win32' ? 1 : 0);
}

/**
 * Determine how much space to allocate to the help outputs left & right columns
 * @param {Object[]} rows - all help output argument info objects
 * @param {number} width - terminal window width
 * @param {number} spacing - amount of column gap space
 * @returns {number[]}
 */
function allocateColumnWidths(rows, width, spacing) {
    // max arg column width
    const argExp = Math.max(...rows.map(({ name, arg }) => name.length + (arg ? arg.length + 1 : 0))),
        // max description column width
        descMax = Math.max(...rows.map(({ description }) => description.length));
    // check if total span fits within terminal window
    if (argExp + descMax + spacing <= width) return [argExp, descMax];
    // collapsed arg column width
    const argClpse = Math.max(...rows.map(({ name, arg }) => (
        arg ? Math.max(name.length + 1, arg.length) : name.length
    )));
    // if arg column width is greator than window width even when collapsed, hide both columns
    if (argClpse > width) return [0, 0];
    // available width for description column with args expanded
    const dscExp = Math.max(width - argExp - spacing, 0),
        // available width for description column with args collapsed
        dscClpse = Math.max(width - argClpse - spacing, 0),
        // calculate total row height when args are expanded & when collapsed
        [hExp, hClpse] = rows.map(({ name, arg, description }) => {
            // wrap description to space available with args expanded
            const wrapExp = wrapAnsi(description, dscExp).split('\n'),
                // wrap description to space available with args collapsed
                wrapClpse = wrapAnsi(description, dscClpse).split('\n');
            return [
                // row height with args expanded
                wrapExp.some((l) => ansi.width(l) > dscExp) ? NaN : wrapExp.length,
                // row height with args collapsed
                wrapClpse.some((l) => ansi.width(l) > dscClpse) ? NaN : Math.max(
                    name.length + (arg ? arg.length + 1 : 0) > argClpse ? 2 : 1,
                    wrapClpse.length,
                ),
            ];
        }).reduce(([a, b], [x, y]) => [a + x, b + y]);
    // return best allocation of space
    return !Number.isNaN(hExp)
        ? (hExp < hClpse ? [argExp, dscExp] : [argClpse, dscClpse])
        : !Number.isNaN(hClpse) ? [argClpse, dscClpse] : [width, 0];
}

/**
 * Align help output argument/description columns
 * @param {Object[]} rows - positional or optional argument info objects
 * @param {number} lcol - width allocated to the left column
 * @param {number} rcol - width allocated to the right column
 * @param {number} spacing - spacing between columns
 * @returns {string}
 */
function alignColumnContent(rows, lcol, rcol, spacing) {
    // if width of arg column is 0, hide content
    if (!lcol) return '';
    // loop through each row and align
    return rows.flatMap(({ name, arg = '', description = '' }) => {
        // format arg column (left side)
        let id;
        if (name.length + (arg.length && arg.length + 1) > lcol) {
            id = [
                styles.name(name) + ' '.repeat(lcol - name.length),
                ' '.repeat(lcol - arg.length) + styles.arg(arg),
            ];
        } else {
            const str = [styles.name(name), arg && styles.arg(arg)].filter(Boolean).join(' ');
            id = [str + ' '.repeat(lcol - ansi.width(str))];
        }
        // if width of description column is 0, hide description
        if (!rcol) return id;
        // format description column (right side)
        const wrapped = wrapAnsi(description, rcol)
                .split('\n')
                .map((line) => line + ' '.repeat(rcol - ansi.width(line))),
            // line height of the row
            height = Math.max(id.length, wrapped.length);
        // return aligned content
        return Array(height).fill(' '.repeat(spacing)).map((gap, i) => [
            id[i] || ' '.repeat(lcol),
            gap,
            wrapped[i] || ' '.repeat(rcol),
        ].join(''));
    }).filter(Boolean).join('\n');
}

/**
 * Generate cli help output given a schema
 * @param {Object} schema - help output schema
 * @param {Object} [options]
 * @param {number} [options.width] - column width to wrap ouput to
 * @param {number} [options.spacing=2] - amount of column gap space
 * @param {number} [options.indent=options.spacing] - amount of column indent space
 * @returns {string}
 */
module.exports = (schema, {
    width = terminalWidth(),
    spacing = 2,
    indent = spacing,
} = {}) => {
    const { usage, args, options } = schema,
        // determine command name
        [, script] = process.argv,
        name = path.basename(script, path.extname(script)),
        // allocate column widths
        [lcol, rcol] = allocateColumnWidths([...args, ...options], width - indent, spacing);
    // format each output section
    return [[
        'USAGE:',
        // format usage description
        formatUsage(name, usage, lcol + rcol + (rcol ? spacing : 0)),
    ], [
        'ARGUMENTS:',
        // align argument columns
        alignColumnContent(args, lcol, rcol, spacing),
    ], [
        'OPTIONS:',
        // align option columns
        alignColumnContent(options, lcol, rcol, spacing),
    ]].map(([title, content]) => (
        content && [
            styles.title(title),
            ...content.split('\n').map((l) => (' '.repeat(indent)) + l),
        ].join('\n')
    )).filter(Boolean).join('\n\n');
};