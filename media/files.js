module.exports = [{
    id: 'example',
    config: {
        name: 'mycli',
        description: 'A cli program that does something useful',
        positional: [{
            name: 'arg',
            description: 'A required positional argument',
        }],
        options: [{
            name: 'log',
            arg: 'lvl',
            conflicts: ['q', 'd'],
            description: "Set logging level ('error', 'warning', 'debug', or 'silent')",
        }, {
            name: 'quiet',
            alias: 'q',
            description: "Silence console output, equivalent to setting --log='silent'",
        }, {
            name: 'debug',
            alias: 'd',
            conflicts: 'quiet',
            description: "Log verbose output, equivalent to setting --log='debug'",
        }, {
            name: 'help',
            alias: 'h',
            preferAlias: true,
            description: 'Display this help message',
        }, {
            name: 'version',
            alias: 'v',
            preferAlias: true,
            description: 'Display program version',
        }],
    },
    options: { width: 80 },
}, {
    id: 'examples-basic',
    config: {
        name: 'mycli',
        options: [{
            name: 'foo',
            required: true,
            description: 'A required flag',
        }, {
            name: 'bar',
            description: 'An optional flag',
        }, {
            name: 'baz',
            description: 'Another optional flag',
        }, {
            name: 'qux',
            dependsOn: 'baz',
            description: 'A flag that can only be specified if --baz is present',
        }],
    },
    options: { width: 80 },
}, {
    id: 'examples-me-groups',
    config: {
        name: 'mycli',
        options: [{
            name: 'foo',
            required: true,
            conflicts: 'bar',
            description: 'Part of a required mutually exclusive group with --bar',
        }, {
            name: 'bar',
            required: true,
            description: 'Part of a required mutually exclusive group with --foo',
        }, {
            name: 'baz',
            conflicts: 'qux',
            description: 'Part of an optional mutually exclusive group with --qux',
        }, {
            name: 'qux',
            description: 'Part of an optional mutually exclusive group with --baz',
        }],
    },
    options: { width: 80 },
}, {
    id: 'examples-pe-groups',
    config: {
        name: 'mycli',
        options: [{
            name: 'foo',
            conflicts: ['bar', 'baz', 'qux'],
            description: 'Cannot be specified alongside --bar, --baz, or --qux',
        }, {
            name: 'bar',
            description: 'Can be specified alongside --baz and --qux, but not --foo',
        }, {
            name: 'baz',
            description: 'Can be specified alongside --bar and --qux, but not --foo',
        }, {
            name: 'qux',
            description: 'Can be specified alongside --bar and --baz, but not --foo',
        }],
    },
    options: { width: 80 },
}];