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
     * Format a positional argument for display in a table
     * @param {Object} arg
     * @param {string} arg.name
     * @param {string} arg.description
     * @returns {string[]}
     */
    argRow({ name, description, ...opts }) {
        let str = name;
        if (opts.repeat) str = `${str} ...`;
        const optional = (typeof opts.required === 'boolean')
            ? !opts.required
            : (typeof opts.optional === 'boolean') ? opts.optional : false;
        if (optional) str = `[${str}]`;
        if (this.color) str = this.styles.arg(str);
        return [str, '', description];
    }

    /**
     * Format an option for display in a table
     * @param {Object} option
     * @param {string} option.name
     * @param {string|Object|Array} option.arg
     * @param {string} option.description
     */
    optionRow({ name, arg, description }) {
        const displayName = name.length > 1 ? `--${name}` : `-${name}`;
        return [
            this.color ? this.styles.option(displayName) : displayName,
            arg && this.usageArg(arg),
            description,
        ];
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