const styles = require('./styles');

module.exports = class Formatter {
    constructor({ color }) {
        this.color = color;
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
            return this.color ? styles.arg(str) : str;
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
        if (this.color) str = styles.arg(str);
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
        let str = this.color ? styles.name(displayName) : displayName;
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
        if (this.color) str = styles.arg(str);
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
            this.color ? styles.name(displayName) : displayName,
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
        return this.color ? styles.title(str) : str;
    }
};