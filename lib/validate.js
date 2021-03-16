function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate config `title` property
 * @param {Object} config - help config
 * @returns {string[]} - detected error descriptions
 */
function validateTitle(config) {
    if (config.title == null) return [];
    const { title } = config;
    // ensure `title` is a string
    if (typeof title !== 'string') {
        return ["Invalid title field: 'title' must be a string"];
    }
    // if `title` includes '%version' substring, ensure the `version` field is specified
    if (/%version/.test(title) && config.version == null) {
        return ["Invalid title field: 'version' field must be specified if 'title' includes placeholder"];
    }
    return [];
}

/**
 * Ensure an args `required` field is a boolean
 * @param {Object} arg - an argument spec
 * @param {boolean} def - default `required` value
 */
function ensureRequiredField(arg, def) {
    if (arg.required != null) {
        arg.required = Boolean(arg.required);
    } else if (arg.optional != null) {
        arg.required = !arg.optional;
    } else {
        arg.required = def;
    }
}

/**
 * Ensure help config positional args are valid
 * @param {Object[]} positional - help config positional args
 * @returns {Array} - validated positional args & detected error descriptions
 */
function validatePositional(positional) {
    if (!positional) return [[], []];
    // ensure `positional` is an array
    if (!Array.isArray(positional)) {
        return [, ["Invalid config structure: 'positional' field must be an array"]];
    }
    const errors = [];
    // ensure each arg spec is an object & has a 'name' field
    positional.forEach((arg, i) => {
        if (!isObject(arg)) {
            errors.push(`Invalid positional arg spec: positional[${i}] is not an object`);
            return;
        }
        if (!arg.name) {
            errors.push(`Missing positional arg name: none specified for positional[${i}]`);
        } else if (typeof arg.name !== 'string') {
            errors.push(`Invalid positional arg name: value specified for positional[${i}] must be a string`);
        }
        // ensure `required` field is a boolean
        ensureRequiredField(arg, true);
    });
    return [positional, errors];
}

/**
 * Parse an option `arg` string
 * @param {string} str - arg string
 * @returns {Object[]}
 */
function parseArg(str) {
    const args = str.trim().split(/ +/);
    let i = 0;
    while (i < args.length) {
        let arg = args[i];
        // check for repeating arg indicator (at least 2 '.' or '…')
        if (/^(?:\.{2,}|…)$/.test(arg)) {
            if (i === 0) {
                throw new Error(`arg '${str}' contains a leading repeating indicator`);
            }
            // update previous arg object
            args[i - 1].repeat = true;
            // remove repeating indicator from array
            args.splice(i, 1);
            continue;
        }
        // transform arg string to object
        const optional = /^\[.+\]$/.test(arg);
        if (optional) arg = arg.slice(1, -1);
        args[i] = {
            name: arg.replace(/^<(.+)>$/, '$1'),
            required: !optional,
        };
        i += 1;
    }
    return args;
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
        aliasNames = {},
        duplicateNames = new Set(),
        duplicateAliasNames = new Set();
    options.forEach(({ name, alias: a, ...opt }, i) => {
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
        let aliasList = [];
        // validate `alias` property
        if (a != null) {
            if (!(Array.isArray(a) && !a.some((s) => typeof s !== 'string')) && typeof a !== 'string') {
                errors.push(`Invalid alias field: spec for option '${name}' must be a string or array of strings`);
            } else {
                aliasList = typeof a === 'string' ? [a] : a;
            }
        }
        const alias = [];
        // ensure conflicts reference specified options
        aliasList.forEach((str) => {
            // remove dash prefix to normalize alias
            const id = str.replace(/^-+/, '');
            if (!id.length) {
                errors.push(`Invalid alias name: '${str}' is not a valid alias name`);
                return;
            }
            // if an alias is the same as the option name or is redundant, it is silently removed
            if (id === normalized || alias.includes(id)) return;
            // ensure alias id has not already been specified as an option
            if (optionNames.includes(id)) {
                duplicateNames.add(id);
            } else if (Object.hasOwnProperty.call(aliasNames, id)) {
                // alias has already been specified as an alias for a different option
                duplicateAliasNames.add(id);
            } else {
                alias.push(id);
                // add to alias map
                aliasNames[id] = normalized;
            }
        });
        // ensure `required` field is a boolean
        ensureRequiredField(opt, false);
        // add new option obj to opts array
        opts.push({ name: normalized, alias, ...opt });
        if (optionNames.includes(normalized) || Object.hasOwnProperty.call(aliasNames, normalized)) {
            duplicateNames.add(normalized);
            if (duplicateAliasNames.has(normalized)) duplicateAliasNames.delete(normalized);
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
    // check for duplicate alias names
    if (duplicateAliasNames.size) {
        [...duplicateAliasNames].forEach((a) => {
            errors.push(`Duplicate alias name: '${a}' is specified as an alias for multiple options`);
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
        const refs = [];
        // ensure conflicts reference specified options
        conf.forEach((str) => {
            // remove dash prefix to normalize reference
            let ref = str.replace(/^-+/, '');
            if (!ref.length) {
                errors.push(`Invalid conflict reference: '${str}' is not a valid option reference`);
                return;
            }
            // check for an alias
            if (Object.hasOwnProperty.call(aliasNames, ref)) ref = aliasNames[ref];
            // ensure ref points to an existing option
            if (!optionNames.includes(ref)) {
                errors.push(`Invalid conflict reference: option '${str}' is not specified`);
            } else if (name !== ref && !refs.includes(ref)) {
                // if a conflicts ref is redundant or points to itself, it is silently removed
                refs.push(ref);
            }
        });
        // update option conflicts property
        opt.conflicts = refs;
        // add to conflicts map
        conflictMap[name] = refs;
        // validate `preferAlias` field
        if (opt.preferAlias != null) {
            if (typeof opt.preferAlias === 'boolean') {
                // case where `preferAlias` is true but option has no aliases is silently ignored
                opt.preferAlias = (opt.preferAlias && opt.alias.length) ? opt.alias[0] : false;
            } else if (typeof opt.preferAlias === 'string') {
                const pref = opt.preferAlias.replace(/^-+/, '');
                if (opt.alias.includes(pref)) {
                    opt.preferAlias = pref;
                } else {
                    errors.push(`Invalid preferAlias field: '${opt.preferAlias}' does not match any alias of '${name}'`);
                }
            } else {
                errors.push(`Invalid preferAlias field: spec for option '${name}' must be a boolean or string`);
            }
        }
        // validate `arg` field
        if (!arg) return;
        if (Array.isArray(arg)) {
            if (arg.some((a) => !(typeof a === 'string' || (isObject(a) && typeof a.name === 'string')))) {
                errors.push(`Invalid option arg spec: array provided for option '${name}' contains improper elements`);
            } else {
                opt.arg = arg.flatMap((a) => {
                    if (typeof a !== 'string') {
                        // ensure `required` field is a boolean
                        ensureRequiredField(a, true);
                        return [a];
                    }
                    try {
                        return parseArg(a);
                    } catch ({ message }) {
                        errors.push(`Invalid option arg spec: ${message}`);
                        return [a];
                    }
                });
            }
        } else if (isObject(arg)) {
            if (typeof arg.name !== 'string') {
                errors.push(`Invalid option arg spec: object provided for option '${name}' must include a valid name`);
            } else {
                // ensure `required` field is a boolean
                ensureRequiredField(arg, true);
            }
        } else if (typeof arg !== 'string') {
            errors.push(`Invalid option arg spec: improper value provided for option '${name}'`);
        } else {
            try {
                opt.arg = parseArg(arg);
            } catch ({ message }) {
                errors.push(`Invalid option arg spec: ${message}`);
            }
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
        let ref = requires.replace(/^-+/, '');
        // ensure `requires` prop is a valid option name
        if (!ref.length) {
            errors.push(`Invalid requires field: '${requires}' is not a valid option reference`);
            return;
        }
        // check for an alias
        if (Object.hasOwnProperty.call(aliasNames, ref)) ref = aliasNames[ref];
        // ensure `requires` points to an existing option
        if (!optionNames.includes(ref)) {
            errors.push(`Invalid requires reference: option '${requires}' is not specified`);
            return;
        }
        // if `requires` points to itself, silently remove it
        if (name === ref) {
            opt.requires = undefined;
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
    const [positional, positionalErrors] = validatePositional(config.positional),
        [options, optErrors] = validateOptions(config.options),
        errors = [...validateTitle(config), ...positionalErrors, ...optErrors];
    // throw if any errors were found
    if (errors.length) {
        const error = new Error(`Invalid help output config${
            errors.map((desc) => `\n * ${desc}`).join('')
        }`);
        error.errors = errors;
        throw error;
    }
    return { positional, options };
};