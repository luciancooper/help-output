const path = require('path'),
    wrapAnsi = require('wrap-ansi'),
    ansi = require('./ansi'),
    validate = require('./validate'),
    optionsUsage = require('./options'),
    Formatter = require('./format'),
    formatUsage = require('./usage');

function terminalWidth() {
    return (
        (typeof process.stdout.getWindowSize === 'function')
            ? process.stdout.getWindowSize()[0]
            : (process.stdout.columns || 80)
    ) - (process.platform === 'win32' ? 1 : 0);
}

function programName() {
    const [, script] = process.argv;
    return path.basename(script, path.extname(script));
}

/**
 * Determine how much space to allocate to the help outputs left & right columns
 * @param {Object[]} rows - 2d array of strings
 * @param {number} width - terminal window width
 * @param {number} spacing - amount of column gap space
 * @returns {number[]}
 */
function allocateColumnWidths(rows, width, spacing) {
    // max arg column width
    const argExp = Math.max(...rows.map(([name, arg = '']) => ansi.width(name + (arg && ` ${arg}`)))),
        // max description column width
        descMax = Math.max(...rows.map(([,, description = '']) => ansi.width(description)));
    // check if total span fits within terminal window
    if (argExp + descMax + spacing <= width) return [argExp, descMax];
    // collapsed arg column width
    const argClpse = Math.max(...rows.map(([name, arg]) => (
        arg ? Math.max(ansi.width(name) + 1, ansi.width(arg)) : ansi.width(name)
    )));
    // if arg column width is greator than window width even when collapsed, hide both columns
    if (argClpse > width) return [0, 0];
    // available width for description column with args expanded
    const dscExp = Math.max(width - argExp - spacing, 0),
        // available width for description column with args collapsed
        dscClpse = Math.max(width - argClpse - spacing, 0),
        // calculate total row height when args are expanded & when collapsed
        [hExp, hClpse] = rows.map(([name, arg = '', description = '']) => {
            // wrap description to space available with args expanded
            const wrapExp = wrapAnsi(description, dscExp).split('\n'),
                // wrap description to space available with args collapsed
                wrapClpse = wrapAnsi(description, dscClpse).split('\n');
            return [
                // row height with args expanded
                wrapExp.some((l) => ansi.width(l) > dscExp) ? NaN : wrapExp.length,
                // row height with args collapsed
                wrapClpse.some((l) => ansi.width(l) > dscClpse) ? NaN : Math.max(
                    ansi.width(name + (arg && ` ${arg}`)) > argClpse ? 2 : 1,
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
 * @param {Array[]} rows - 2d array of strings
 * @param {number} lcol - width allocated to the left column
 * @param {number} rcol - width allocated to the right column
 * @param {number} spacing - spacing between columns
 * @returns {string}
 */
function alignColumnContent(rows, lcol, rcol, spacing) {
    // if width of arg column is 0, hide content
    if (!lcol) return '';
    // loop through each row and align
    return rows.flatMap(([name, arg = '', description = '']) => {
        // format arg column (left side)
        const [nl, al] = [ansi.width(name), ansi.width(arg)],
            n = nl + (al && al + 1),
            id = (n > lcol)
                ? [name, ' '.repeat(lcol - al) + arg]
                : [name + (arg && ` ${arg}`)];
        // if width of description column is 0, hide description
        if (!rcol) return id;
        // format description column (right side)
        const wrapped = wrapAnsi(description, rcol).split('\n'),
            // line height of the row
            height = Math.max(id.length, wrapped.length);
        // return aligned content
        return Array(height).fill(' '.repeat(spacing)).map((gap, i) => (
            (id[i] ? id[i] + ' '.repeat(lcol - ansi.width(id[i])) : ' '.repeat(lcol))
            + (wrapped[i] ? gap + wrapped[i] : '')
        ));
    }).filter(Boolean).join('\n');
}

/**
 * Produce output head section if config contains `title` and / or `description`
 * @param {string} name - program name
 * @param {Object} config - help output config
 * @param {number} width - width to wrap to
 * @returns {string}
 */
function createOutputHead(name, config, width) {
    const title = config.title ? config.title.replace(/%(?:name|version)/gi, (str) => (
        str.toLowerCase() === '%name' ? name : String(config.version)
    )) : '';
    // format description
    let desc = '';
    if (config.description) {
        desc = wrapAnsi(String(config.description), width);
        // check if any word in the description is longer than the available width
        if (desc.split('\n').some((l) => ansi.width(l) > width)) {
            desc = (width >= 40)
                // if width is sufficiantly large, then use hard wrap
                ? wrapAnsi(String(config.description), width, { hard: true })
                // otherwise hide description
                : '';
        }
    }
    return [title, desc].filter(Boolean).join('\n');
}

/**
 * Generate cli help output
 * @param {Object} config - help output config
 * @param {Object} [options]
 * @param {number} [options.width] - column width to wrap ouput to
 * @param {number} [options.spacing=2] - amount of column gap space
 * @param {number} [options.indent=options.spacing] - amount of column indent space
 * @param {boolean} [options.color=true] - colorize output
 * @param {Object} [options.styles] - style customizations
 * @returns {string}
 */
module.exports = (config, {
    width = terminalWidth(),
    spacing = 2,
    indent = spacing,
    color = true,
    styles,
} = {}) => {
    // ensure a config object was provided
    if (!(typeof config === 'object' && config !== null && !Array.isArray(config))) {
        throw new Error('A config object is required');
    }
    // validate config
    let { positional, options } = validate(config);
    // determine command name
    const name = config.name ? String(config.name) : programName(),
        // instantiate a formatter
        formatter = new Formatter(color, styles),
        // output head section
        head = createOutputHead(name, config, width),
        // generate options usage items
        opts = optionsUsage(options),
        // generate & format usage args
        usage = [
            ...positional.map((arg) => formatter.usageArg(arg)),
            ...opts.map((opt) => formatter.usageOption(opt)),
        ];
    // convert args to rows
    positional = formatter.positionalRows(positional);
    // convert options to rows
    options = formatter.optionRows(options);
    // allocate column widths
    const [lcol, rcol] = allocateColumnWidths([...positional, ...options], width - indent, spacing),
        // total span of both columns
        colspan = lcol + rcol + (rcol && spacing);
    // format each output section
    return [
        head,
        ...[[
            'USAGE:',
            // format usage description
            formatUsage(name, usage, width - indent, colspan),
        ], [
            'ARGUMENTS:',
            // align argument columns
            alignColumnContent(positional, lcol, rcol, spacing),
        ], [
            'OPTIONS:',
            // align option columns
            alignColumnContent(options, lcol, rcol, spacing),
        ]].map(([title, content]) => (
            content && [
                formatter.sectionTitle(title),
                ...content.split('\n').map((l) => (' '.repeat(indent)) + l),
            ].join('\n')
        )),
    ].filter(Boolean).join('\n\n');
};