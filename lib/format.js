const styles = require('./styles');

/**
 * Format a usage argument
 * @param {string|Object|Array} arg
 * @returns {string}
 */
function formatArgument(arg) {
    if (Array.isArray(arg)) {
        return arg.map(formatArgument).join(' ');
    }
    if (typeof arg === 'string') {
        return styles.arg(/^<.+>$/.test(arg) ? arg : `<${arg}>`);
    }
    if (typeof arg !== 'object' || arg === null) {
        throw new Error(`Cannot format invalid arg: ${arg}`);
    }
    const { name, repeat = false } = arg,
        optional = (typeof arg.required === 'boolean')
            ? !arg.required
            : (typeof arg.optional === 'boolean') ? arg.optional : false;
    let str = /^<.+>$/.test(name) ? name : `<${name}>`;
    if (repeat) str = `${str} ...`;
    // colorize arg
    str = styles.arg(str);
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
function formatOption({ type, ...item }, parentheses = true) {
    switch (type) {
        case 'option': {
            const { name, arg, dependent } = item,
                formatted = [
                    styles.name(name),
                    arg && formatArgument(arg),
                    dependent && formatOption(dependent),
                ].filter(Boolean).join(' ');
            return parentheses ? `[${formatted}]` : formatted;
        }
        case 'group': {
            const { members } = item;
            return members.map((m) => formatOption(m, true)).join(' ');
        }
        case 'exclusive-group': {
            const { members } = item;
            return `[${members.map((m) => formatOption(m, false)).join(' | ')}]`;
        }
        default:
            throw new Error(`unknown item type '${type}'`);
    }
}

module.exports = {
    formatArgument,
    formatOption,
};