/**
 * Given an array of conflict pairs, identify clusters of mutually exclusive options
 * @param {Array[]} conflicts - array of option conflict pairs
 * @returns {Array[]}
 */
function findExclusiveGroups(conflicts) {
    const groups = conflicts.map((pair) => [...pair]);
    // merge groups
    {
        let i = 0;
        while (i < groups.length) {
            const g1 = groups[i],
                j = groups.slice(i + 1).findIndex((g2) => g1.some((k) => g2.includes(k)));
            if (j >= 0) {
                // merge g1 with g2
                const [g2] = groups.splice(j + i + 1, 1);
                groups[i] = [...new Set([...g1, ...g2])];
            } else i += 1;
        }
    }
    return groups;
}

function extractAccumulatedErrors(arr) {
    return arr.reduce((acc, member) => {
        if (member.errors && Array.isArray(member.errors) && member.errors.length) {
            acc.push(...member.errors);
            delete member.errors;
        }
        return acc;
    }, []);
}

/**
 * Create a mutually exclusive group object from a set of conflicting options
 * @param {Object[]} group - array of options that constitute the group
 * @param {Array[]} conflicts - array of option conflict pairs
 * @returns {Object}
 */
function resolveExclusiveGroup(group, conflicts) {
    const [n, c] = [group.length, conflicts.length];
    // check to ensure option group meets requirements of a mutually exclusive cluster
    if (c < n - 1) {
        throw new Error(`option group [${
            group.map(({ name }) => name).join(', ')
        }] with conflict pairs ${
            conflicts.map(([p1, p2]) => `(${p1}, ${p2})`).join(', ')
        } does not meet mutually exclusive group requirements`);
    }
    // create a map of links between each option in the group
    const linkMap = group.reduce((acc, { name }) => {
            acc[name] = conflicts
                .filter((p) => p.includes(name))
                .map(([k1, k2]) => (k1 === name ? k2 : k1));
            return acc;
        }, {}),
        // find any options that are completely mutually exclusive with every other option in the group
        mutuallyExclusive = group.filter(({ name }) => linkMap[name].length === n - 1);
    // if any options are completely mutually exclusive, divide and conquor
    if (mutuallyExclusive.length) {
        const members = [...mutuallyExclusive],
            // find all options in the group that are only partially exclusive
            partiallyExclusive = group.filter(({ name }) => linkMap[name].length < n - 1);
        if (partiallyExclusive.length) {
            let partial;
            // break group into smaller pieces and resolve recursively
            const partialConflicts = conflicts.filter(([id1, id2]) => (
                    !mutuallyExclusive.some(({ name }) => (name === id1 || name === id2))
                )),
                partialGroups = findExclusiveGroups(partialConflicts),
                // find options that do not belong to a partial group
                singleNodes = partiallyExclusive.filter(({ name }) => !partialGroups.some((g) => g.includes(name)));
            // check if any single nodes exist, or if there are multiple groups
            if (singleNodes.length || partialGroups.length > 1) {
                // resolve members of partial group
                const partialMembers = [
                    ...singleNodes,
                    ...partialGroups.map((gids) => resolveExclusiveGroup(
                        gids.map((id) => group.find(({ name }) => name === id)),
                        partialConflicts.filter(([k]) => gids.includes(k)),
                    )),
                ].sort(({ order: a }, { order: b }) => a - b);
                // create partial group
                partial = {
                    type: 'group',
                    members: partialMembers,
                    order: Math.min(...partialMembers.map(({ order }) => order)),
                    required: partialMembers.some(({ required: r }) => r),
                    // extract & accumulate all errors from partial members
                    errors: extractAccumulatedErrors(partialMembers),
                };
            } else {
                // resolve partial mutual exclusion group
                partial = resolveExclusiveGroup(
                    partiallyExclusive,
                    partialConflicts,
                );
            }
            // add partial to members array
            members.push(partial);
        }
        // count number of `required` members of the group
        const requiredCount = members.reduce((t, { required: r }) => t + (r ? 1 : 0), 0),
            // extract & accumulate all errors from members
            errors = extractAccumulatedErrors(members);
        // if not all members are required, then add to errors array
        if (requiredCount > 0 && requiredCount < members.length) {
            // find all non-required option members
            const requiredOptions = group
                .filter(({ type, required: r }) => (type === 'option' && r));
            // find all required option members
            group
                .filter(({ type, required: r }) => (type === 'option' && !r))
                .forEach((opt2) => {
                    const linked = linkMap[opt2.name];
                    errors.push(
                        ...requiredOptions
                            .filter(({ name }) => linked.includes(name))
                            .map((opt1) => [opt1, opt2]),
                    );
                });
        }
        // return exclusive-group
        return {
            type: 'exclusive-group',
            members: members.sort(({ order: a }, { order: b }) => a - b),
            order: Math.min(...members.map(({ order }) => order)),
            required: requiredCount > 0,
            errors,
        };
    }
    // for each option, create a combination of options that it is not mutually exclusive with
    const optionCombos = group.map(({ name }) => {
            const linked = linkMap[name];
            return group.filter(({ name: id }) => !linked.includes(id));
        }),
        // extract & accumulate all errors from option group
        errors = extractAccumulatedErrors(group);
    // group identical option combinations
    {
        let i = 0;
        while (i < optionCombos.length) {
            const combo = optionCombos[i],
                j = optionCombos.slice(i + 1).findIndex((cmb) => (
                    (combo.length === cmb.length)
                        ? !combo.some(({ name: a }) => !cmb.some(({ name: b }) => a === b))
                        : false
                ));
            if (j >= 0) optionCombos.splice(j + i + 1, 1);
            else i += 1;
        }
    }
    // create an array of member groups from unique option combos
    const members = optionCombos.map((opts) => ({
            type: 'group',
            members: opts.sort(({ order: a }, { order: b }) => a - b),
            order: Math.min(...opts.map(({ order }) => order)),
            required: opts.some(({ required: r }) => r),
        })).sort(({ order: a }, { order: b }) => a - b),
        // count number of `required` members of the group
        requiredCount = members.reduce((t, { required: r }) => t + (r ? 1 : 0), 0);
    // if not all member groups have at least 1 required option, then add to errors array
    if (requiredCount > 0 && requiredCount < members.length) {
        // create array of names of required options in the group
        const requiredOptions = group.filter(({ required: r }) => r);
        // create set of members of an optional combo group
        new Set(
            members
                .filter(({ required: r }) => !r)
                .flatMap(({ members: m }) => m),
        ).forEach((opt2) => {
            const linked = linkMap[opt2.name];
            errors.push(
                ...requiredOptions
                    .filter(({ name }) => linked.includes(name))
                    .map((opt1) => [opt1, opt2]),
            );
        });
    }
    // return exclusive group
    return {
        type: 'exclusive-group',
        members,
        order: Math.min(...members.map(({ order }) => order)),
        required: requiredCount > 0,
        errors,
    };
}

/**
 * Find all exclusive groups in a given set of options
 * @param {Array[]} conflicts - array of option conflict pairs
 * @param {Object[]} opts - the total collection of options
 * @param {Object[]} [optsubset=opts] - a subset of `opts` to resolve
 * @returns {Object[]}
 */
function resolveOptionUsage(conflicts, opts, optsubset = opts) {
    // find mutually exclusive groups
    const groups = findExclusiveGroups(conflicts);
    // return items sorted by their `order` property
    return [
        // find options that do not belong to any exclusive groups
        ...optsubset.filter(({ name }) => !groups.some((g) => g.includes(name))),
        // resolve each exclusive group
        ...groups.map((gids) => resolveExclusiveGroup(
            gids.map((id) => opts.find(({ name }) => name === id)),
            conflicts.filter(([k]) => gids.includes(k)),
        )),
    ].sort(({ order: a }, { order: b }) => a - b);
}

function createError(errors) {
    const messages = errors.sort(([{ order: a1 }, { order: a2 }], [{ order: b1 }, { order: b2 }]) => (
            a1 === b1 ? a2 - b2 : a1 - b1
        )).filter(([{ name: a1 }, { name: a2 }], i, array) => {
            if (i === array.length - 1) return true;
            const [{ name: b1 }, { name: b2 }] = array[i + 1];
            return (a1 !== b1 || a2 !== b2);
        }).map(([{ name: a }, { name: b }]) => (
            `Required option '${a}' cannot have a mutually exclusive relationship with non-required option '${b}'`
        )),
        error = new Error(`Invalid help output config${
            messages.map((desc) => `\n * ${desc}`).join('')
        }`);
    error.errors = messages;
    return error;
}

/**
 * Given the options objects from a help ouput config, generate usage arguments
 * @param {Object} options - options objects from a help output config
 * @returns {Object[]}
 */
module.exports = (options) => {
    let opts = options.map((opt, order) => ({ type: 'option', ...opt, order })),
        // generate a list of option conflict pairs
        conflicts = opts
            .filter(({ conflicts: c }) => c)
            .flatMap(({ name, conflicts: c }) => (
                Array.isArray(c) ? c.map((key) => [name, key]) : [[name, c]]
            ));
    // remove duplicate conflict pairs
    for (let i = 0; i < conflicts.length; i += 1) {
        const [a1, a2] = conflicts[i],
            j = conflicts.slice(i + 1).findIndex(([b1, b2]) => b1 === a2 && a1 === b2);
        if (j >= 0) conflicts.splice(j + i + 1, 1);
    }

    opts
        // map option names to their dependent options
        .map((opt) => [opt, opts.filter(({ dependsOn }) => dependsOn === opt.name)])
        // filter out options with zero dependents
        .filter(([, deps]) => deps.length > 0)
        // sort dependency relationships so that the dependencies of dependencies are resolved first
        .sort(([{ name: aid, order: a }, adeps], [{ name: bid, order: b }, bdeps]) => (
            adeps.some(({ name }) => name === bid)
                ? 1
                : bdeps.some(({ name }) => name === aid) ? -1 : a - b
        ))
        // resolve each dependency relationship
        .forEach(([opt, deps]) => {
            // create an array of dependency name strings
            const ids = deps.map(({ name }) => name),
                // filter conflicts so that only those that are relevant to these dependencies remain
                dconflicts = conflicts.filter(([id1, id2]) => (ids.includes(id1) || ids.includes(id2))),
                // resolve dependency options
                depmembers = resolveOptionUsage(dconflicts, opts, deps),
                // extract & accumulate all errors from dep members
                errors = extractAccumulatedErrors(depmembers);
            // create opt.dependent property
            opt.dependent = (depmembers.length > 1) ? {
                type: 'group',
                members: depmembers,
                order: Math.min(...depmembers.map(({ order }) => order)),
            } : depmembers[0];
            // set opt.errors property
            opt.errors = errors;
            // filter out dependent items from master options list
            opts = opts.filter(({ name }) => !ids.includes(name));
            // filter out dependent items from master conflicts list
            conflicts = conflicts.filter(([id1, id2]) => !(ids.includes(id1) || ids.includes(id2)));
        });
    // resolve base option items
    const resolved = resolveOptionUsage(conflicts, opts),
        // extract & accumulate all errors from resolved options
        errors = extractAccumulatedErrors(resolved);
    // throw if any errors were found
    if (errors.length) throw createError(errors);
    return resolved;
};