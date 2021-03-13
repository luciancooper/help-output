module.exports = [{
    id: 'example',
    config: {
        name: 'mycli',
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
}];