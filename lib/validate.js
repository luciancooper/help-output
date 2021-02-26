function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ensure help config args are valid
 * @param {Object[]} args - help config args
 * @returns {Array} - validated args & detected error descriptions
 */
function validateArgs(args) {
    if (!args) return [[], []];
    // ensure `args` is an array
    if (!Array.isArray(args)) {
        return [, ["Invalid config structure: 'args' field must be an array"]];
    }
    const errors = [];
    // ensure each arg spec is an object & has a 'name' field
    args.forEach((arg, i) => {
        if (!isObject(arg)) {
            errors.push(`Invalid argument spec: args[${i}] is not an object`);
        } else if (!arg.name) {
            errors.push(`Missing argument name: none specified for arg[${i}]`);
        } else if (typeof arg.name !== 'string') {
            errors.push(`Invalid argument name: value specified for arg[${i}] must be a string`);
        }
    });
    return [args, errors];
}

/**
 * Ensure help config options are valid
 * @param {Object[]} options - help config options
 * @returns {Array} - validated options & detected error descriptions
 */
function validateOptions(options) {
    if (!options) return [[], []];
    // ensure `options` is an array
    if (!Array.isArray(options)) {
        return [, ["Invalid config structure: 'options' field must be an array"]];
    }
    const errors = [];
    // ensure each option spec is an object
    options.forEach((opt, i) => {
        if (!isObject(opt)) {
            errors.push(`Invalid option spec: options[${i}] is not an object`);
        }
    });
    // stop if any option specs are found to not be objects
    if (errors.length) return [, errors];
    // ensure each option spec has a 'name' field
    const opts = [],
        optionNames = [],
        duplicateNames = new Set();
    options.forEach(({ name, ...opt }, i) => {
        if (!name) {
            errors.push(`Missing option name: none specified for option[${i}]`);
            return;
        }
        if (typeof name !== 'string') {
            errors.push(`Invalid option name: type of name specified for option[${i}] is not a string`);
            return;
        }
        // remove dash prefix to normalize name
        const normalized = name.replace(/^-+/, '');
        // if name is only '-' characters, it is invalid
        if (!normalized.length) {
            errors.push(`Invalid option name: '${name}' is not a valid option name`);
            return;
        }
        // add new option obj to opts array
        opts.push({ name: normalized, ...opt });
        if (optionNames.includes(normalized)) {
            duplicateNames.add(normalized);
        } else {
            optionNames.push(normalized);
        }
    });
    // check for duplicate option names
    if (duplicateNames.size) {
        [...duplicateNames].forEach((name) => {
            errors.push(`Duplicate option name: '${name}' is specified multiple times`);
        });
    }
    // stop if any errors with option names are found
    if (errors.length) return [, errors];
    // initialize a `conflicts` map
    const conflictMap = {};
    // loop through options & build conflict map
    opts.forEach((opt) => {
        const { name, conflicts: c, arg } = opt;
        let conf = [];
        // validate `conflicts` field
        if (c != null) {
            if (!(Array.isArray(c) && !c.some((s) => typeof s !== 'string')) && typeof c !== 'string') {
                errors.push(`Invalid conflicts field: spec for option '${name}' must be a string or array of strings`);
            } else {
                conf = typeof c === 'string' ? [c] : c;
            }
        }
        // ensure conflicts reference specified options
        conf = conf.map((str) => {
            // remove dash prefix to normalize reference
            const ref = str.replace(/^-+/, '');
            if (!ref.length) {
                errors.push(`Invalid conflict reference: '${str}' is not a valid option reference`);
            } else if (!optionNames.includes(ref)) {
                errors.push(`Invalid conflict reference: option '${str}' is not specified`);
            }
            return ref;
        });
        // update option conflicts property
        opt.conflicts = conf;
        // add to conflicts map
        conflictMap[name] = conf;
        // validate `arg` field
        if (!arg) return;
        if (Array.isArray(arg)) {
            if (arg.some((a) => !(typeof a === 'string' || (isObject(a) && typeof a.name === 'string')))) {
                errors.push(`Invalid option arg spec: array provided for option '${name}' contains improper elements`);
            }
        } else if (isObject(arg)) {
            if (typeof arg.name !== 'string') {
                errors.push(`Invalid option arg spec: object provided for option '${name}' must include a valid name`);
            }
        } else if (typeof arg !== 'string') {
            errors.push(`Invalid option arg spec: improper value provided for option '${name}'`);
        }
    });
    // validate `requires` field for each option
    opts.forEach((opt) => {
        const { name, requires } = opt;
        if (!requires) return;
        // ensure `requires` prop is a string
        if (typeof requires !== 'string') {
            errors.push(`Invalid requires field: type of reference specified for option '${name}' is not a string`);
            return;
        }
        // remove dash prefix to normalize reference
        const ref = requires.replace(/^-+/, '');
        // ensure `requires` prop is a valid option name
        if (!ref.length) {
            errors.push(`Invalid requires field: '${requires}' is not a valid option reference`);
            return;
        }
        // ensure `requires` points to an existing option
        if (!optionNames.includes(ref)) {
            errors.push(`Invalid requires reference: option '${requires}' is not specified`);
            return;
        }
        opt.requires = ref;
        // ensure option does not require a conflicting ref
        if (conflictMap[name].includes(ref) || conflictMap[ref].includes(name)) {
            errors.push(`Contradictory reference: option '${name}' both conflicts with and requires '${ref}'`);
        }
    });
    // check for circular `requires` relationships
    opts
        .map(({ name, requires }) => (requires && [name, requires]))
        .filter(Boolean)
        .forEach(([name, req], i, pairs) => {
            if (pairs.slice(i + 1).some(([n, r]) => (req === n && name === r))) {
                errors.push(`Circular require: options '${name}' and '${req}' depend on each other`);
            }
        });
    return [opts, errors];
}

/**
 * Ensure a help output config is valid
 * @param {Object} config
 * @throws {Error}
 */
module.exports = (config) => {
    const [args, argErrors] = validateArgs(config.args),
        [options, optErrors] = validateOptions(config.options),
        errors = [...argErrors, ...optErrors];
    // throw if any errors were found
    if (errors.length) {
        const error = new Error(`Invalid help output config${
            errors.map((desc) => `\n * ${desc}`).join('')
        }`);
        error.errors = errors;
        throw error;
    }
    return { args, options };
};