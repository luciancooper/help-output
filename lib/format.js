const ansiStyles = require('ansi-styles');

const defaultStyle = {
    arg: 'yellow',
    option: 'green',
    title: 'bold.underline',
};

module.exports = class Formatter {
    /**
     * @param {boolean} color - colorize output
     * @param {Object} [styles] - style customizations
     */
    constructor(color, styles = defaultStyle) {
        this.color = color;
        if (color) {
            this.resolveStyles(styles);
        } else {
            this.styles = {};
        }
    }

    resolveStyles(config) {
        if (!(typeof config === 'object' && config !== null && !Array.isArray(config))) {
            throw new Error('styles option must be an object');
        }
        const errors = [],
            validKeys = Object.keys(defaultStyle),
            validStyles = Object.keys(ansiStyles);
        // build a map of styler functions
        this.styles = Object.entries({
            ...defaultStyle,
            ...config,
        }).reduce((acc, [key, value]) => {
            // ensure key is valid
            if (!validKeys.includes(key)) {
                errors.push(`'${key}' is not a valid style key`);
                return acc;
            }
            // check for no style
            if (value == null) {
                acc[key] = (str) => str;
                return acc;
            }
            // resolve style ids
            let styleIds;
            if (typeof value === 'string') {
                styleIds = value.split('.').filter(Boolean);
            } else if (Array.isArray(value) && !value.some((v) => typeof v !== 'string')) {
                styleIds = value.flatMap((s) => s.split('.')).filter(Boolean);
            } else {
                errors.push(`style value for '${key}' must be a string, array of strings, or null`);
                return acc;
            }
            // construct open & close ansi escape codes
            let [open, close] = ['', ''];
            styleIds.forEach((id) => {
                if (validStyles.includes(id)) {
                    const { open: o, close: c } = ansiStyles[id];
                    [open, close] = [open + o, c + close];
                } else {
                    errors.push(`'${id}' is not a recognized style`);
                }
            });
            // create styler function
            acc[key] = (str) => (open + str + close);
            return acc;
        }, {});
        // throw error if any errors were found in the provided styles config
        if (errors.length) {
            const error = new Error(`Invalid styles config${
                errors.map((desc) => `\n * ${desc}`).join('')
            }`);
            error.errors = errors;
            throw error;
        }
    }

    /**
     * Format a usage argument
     * @param {string|Object|Array} arg
     * @returns {string}
     */
    usageArg(arg) {
        if (Array.isArray(arg)) {
            return arg.map((a) => this.usageArg(a)).join(' ');
        }
        if (typeof arg === 'string') {
            const str = /^<.+>$/.test(arg) ? arg : `<${arg}>`;
            return this.color ? this.styles.arg(str) : str;
        }
        if (typeof arg !== 'object' || arg === null) {
            throw new Error(`Cannot format arg: ${arg}`);
        }
        const { name, repeat = false } = arg,
            optional = (typeof arg.required === 'boolean')
                ? !arg.required
                : (typeof arg.optional === 'boolean') ? arg.optional : false;
        let str = /^<.+>$/.test(name) ? name : `<${name}>`;
        if (repeat) str = `${str} ...`;
        // colorize arg
        if (this.color) str = this.styles.arg(str);
        if (optional) str = `[${str}]`;
        return str;
    }

    /**
     * Convert a structured option object to string
     * @param {Object} option - structured option object
     * @param {string} option.type - option object type (option, group, exclusive-group)
     * @param {boolean} [parentheses=true] - enclose options in parentheses
     * @returns {string}
     */
    usageOption({ type, ...option }, parentheses = true) {
        if (type === 'group') {
            const { members } = option;
            return members.map((m) => this.usageOption(m, true)).join(' ');
        }
        if (type === 'exclusive-group') {
            const { members } = option;
            return `[${members.map((m) => this.usageOption(m, false)).join(' | ')}]`;
        }
        if (type !== 'option') {
            throw new Error(`unknown option type '${type}'`);
        }
        const { name, arg, dependent } = option,
            displayName = name.length > 1 ? `--${name}` : `-${name}`;
        let str = this.color ? this.styles.option(displayName) : displayName;
        if (arg) str += ` ${this.usageArg(arg)}`;
        if (dependent) str += ` ${this.usageOption(dependent)}`;
        return parentheses ? `[${str}]` : str;
    }

    /**
     * Format positional arguments for display in a table
     * @param {Object[]} args
     * @returns {string[][]}
     */
    argRows(args) {
        return args.map(({ name, description, ...opts }) => {
            let str = name;
            if (opts.repeat) str = `${str} ...`;
            const optional = (typeof opts.required === 'boolean')
                ? !opts.required
                : (typeof opts.optional === 'boolean') ? opts.optional : false;
            if (optional) str = `[${str}]`;
            if (this.color) str = this.styles.arg(str);
            return [str, '', description];
        });
    }

    /**
     * Format options for display in a table
     * @param {Object[]} options
     * @returns {string[][]}
     */
    optionRows(options) {
        // convert each option to a row arrays containing their aliases & names
        let idRows = options.map(({ name, alias }) => {
            // we want all alias names to be sorted by length, (with a stable sorting algorithm)
            const ids = [...(alias || []), name],
                n = ids.length - 1;
            // only 1 or 2 alias names expected at most, so insertion sort is fine
            for (let i = 1; i < n; i += 1) {
                let j = i;
                while (j > 0 && ids[j - 1].length > ids[j].length) {
                    // swap
                    [ids[j], ids[j - 1]] = [ids[j - 1], ids[j]];
                    j -= 1;
                }
            }
            return ids.map((s) => (s.length > 1 ? `--${s}` : `-${s}`));
        });
        // determine id column span
        const n = Math.max(...idRows.map((r) => r.length));
        // if there is more than 1 column, alignment is required
        if (n > 1) {
            // align each row to the rightmost column
            idRows = idRows.map((r) => [...Array(n - r.length).fill(''), ...r]);
            // calculate max width of each id column
            const w = Array(n - 1).fill(0).map((_, i) => Math.max(...idRows.map((r) => r[i].length)));
            // align each column
            idRows = idRows.map((r) => [
                ...r.slice(0, -1).map((s, j) => (
                    s ? (
                        `${' '.repeat(w[j] - s.length)}${this.color ? this.styles.option(s) : s}, `
                    ) : ' '.repeat(w[j] + 2)
                )),
                this.color ? this.styles.option(r[n - 1]) : r[n - 1],
            ].join(''));
        } else {
            // convert 2d array to a 1d array of styled id strings
            idRows = idRows.map(([name]) => (this.color ? this.styles.option(name) : name));
        }
        // return table rows
        return options.map(({ arg, description }, i) => [
            idRows[i],
            arg ? this.usageArg(arg) : '',
            description,
        ]);
    }

    /**
     * Format a section title
     * @param {string} str - section title
     * @returns {string}
     */
    sectionTitle(str) {
        return this.color ? this.styles.title(str) : str;
    }
};