function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ensure help config args are valid
 * @param {Object[]} args - help config args
 * @returns {string[]} - detected error descriptions
 */
function validateArgs(args) {
    if (!args) return [];
    // ensure `args` is an array
    if (!Array.isArray(args)) {
        return ["Invalid config structure: 'args' field must be an array"];
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
    return errors;
}

/**
 * Ensure help config options are valid
 * @param {Object[]} options - help config options
 * @returns {string[]} - detected error descriptions
 */
function validateOptions(options) {
    if (!options) return [];
    // ensure `options` is an array
    if (!Array.isArray(options)) {
        return ["Invalid config structure: 'options' field must be an array"];
    }
    const errors = [];
    // ensure each option spec is an object
    options.forEach((opt, i) => {
        if (!isObject(opt)) {
            errors.push(`Invalid option spec: options[${i}] is not an object`);
        }
    });
    // stop if any option specs are found to not be objects
    if (errors.length) return errors;
    // ensure each option spec has a 'name' field
    const optionNames = [],
        duplicateNames = new Set();
    options.forEach(({ name }, i) => {
        if (!name) {
            errors.push(`Missing option name: none specified for option[${i}]`);
        } else if (typeof name !== 'string') {
            errors.push(`Invalid option name: value specified for option[${i}] must be a string`);
        } else if (optionNames.includes(name)) {
            duplicateNames.add(name);
        } else {
            optionNames.push(name);
        }
    });
    // check for duplicate option names
    if (duplicateNames.size) {
        [...duplicateNames].forEach((name) => {
            errors.push(`Duplicate option name: '${name}' is specified multiple times`);
        });
    }
    // stop if any errors with option names are found
    if (errors.length) return errors;
    // create a `conflicts` map
    const conflictMap = options.reduce((acc, { name, conflicts: c }, i) => {
        let conf;
        // validate `conflicts` field
        if (c != null && !Array.isArray(c) && typeof c !== 'string') {
            errors.push(`Invalid conflicts field: spec for option '${name}' must be a string or array of strings`);
            conf = [];
        } else conf = c || [];
        acc[name] = (acc[name] || []).concat(conf);
        return acc;
    }, {});
    // validate option references & relationships
    options.forEach(({ name, requires }) => {
        const conf = conflictMap[name];
        // ensure conflicts reference specified options
        if (conf.length) {
            conf.forEach((id) => {
                if (!optionNames.includes(id)) {
                    errors.push(`Invalid conflict reference: option '${id}' is not specified`);
                }
            });
        }
        // validate `requires` field
        if (requires) {
            if (typeof requires !== 'string') {
                errors.push(`Invalid requires field: value specified for option '${name}' must be a string`);
            } else if (!optionNames.includes(requires)) {
                errors.push(`Invalid requires reference: option '${requires}' is not specified`);
            } else if (conf.includes(requires) || (name && conflictMap[requires].includes(name))) {
                // ensure option does not require a conflicting ref
                errors.push(`Contradictory reference: option '${name}' both conflicts with and requires '${requires}'`);
            }
        }
    });
    // check for circular `requires` relationships
    options
        .map(({ name, requires }) => (requires ? [name, requires] : null))
        .filter(Boolean)
        .forEach(([name, req], i, pairs) => {
            if (pairs.slice(i + 1).some(([n, r]) => (req === n && name === r))) {
                errors.push(`Circular require: options '${name}' and '${req}' depend on each other`);
            }
        });
    return errors;
}

/**
 * Ensure a help output config is valid
 * @param {Object} config
 * @param {Object} config.args
 * @param {Object} config.options
 * @throws {Error}
 */
module.exports = ({ args, options }) => {
    const errors = [
        ...validateArgs(args),
        ...validateOptions(options),
    ];
    if (!errors.length) return;
    // throw if any errors were found
    const error = new Error(`Invalid help output config${
        errors.map((desc) => `\n * ${desc}`).join('')
    }`);
    error.errors = errors;
    throw error;
};