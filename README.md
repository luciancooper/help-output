# help-output

[![travis](https://img.shields.io/travis/com/luciancooper/help-output/master?logo=travis&style=for-the-badge)](https://travis-ci.com/luciancooper/help-output)
[![coverage](https://img.shields.io/codecov/c/gh/luciancooper/help-output?logo=codecov&style=for-the-badge)](https://codecov.io/gh/luciancooper/help-output)
![LICENSE](https://img.shields.io/github/license/luciancooper/help-output?color=brightgreen&style=for-the-badge)

Create beautifully formatted help messages for your command line programs.

Pairs nicely with libraries like `minimist` and `yargs-parser` that are great for parsing command line arguments but don't have a help message generator built in.

## Installation

Install with `npm`:

```bash
npm install help-output
```

Or with `yarn`:

```bash
yarn add help-output
```

## Usage

Import the `helpOutput` function and pass it a configuration object with the name of your program, positional arguments, and options:

```js
const helpOutput = require('help-output')

const message = helpOutput({
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
}, { width: 80 });

console.log(message);
```

Positional arguments and option flags are formatted into columns, and a git style usage section is automatically generated based on the information provided about them:

<p align="center">
    <img src="media/example.svg" alt="example"/>
</p>

## API

### `helpOutput(config, [options])`

A function that takes a `config` object and `options` object as arguments, and returns a help output message `string`. The `config` object is where you specify the arguments and options that will be displayed in the help output message, while the optional `options` object gives you some control over how the message will be formatted. 

#### Configuration

> **Note:** configuration validation is strict - an error will be thrown if any properties do not conform to the schema detailed below.

##### `config.name`

Type: `string`

The name of your cli program. If left unspecified, a name will be inferred from `process.argv`.

##### `config.title`

Type: `string`

An optional title to display at the top of the outputted help message. It can it can include two placeholder strings, `%name` and `%version`, which will be replaced by the values of `config.name` and `config.version`, respectively.

##### `config.version`

Type: `string`

The programs current version. This field only necessary if `config.title` is set and includes the `%version` placeholder string.

##### `config.description`

Type: `string`

An optional description of what the program does. If specified, it will be displayed at the top of the outputted help message, just below `config.title`.

##### `config.positional`

Type: `Object[]`

An array of objects specifying your programs positional arguments. They will be displayed in the order they are specified. Each argument spec object can contain the following properties:

   * `name` - The name of the positional argument (**required**).
   * `description` - A description of the argument. This property is not strictly required, but is strongly encouraged.
   * `required` - A boolean (defaults to `true`) indicating whether the argument is required.
   * `variadic` - A boolean (defaults to `false`) indicating whether the argument is variadic.

##### `config.options`

Type: `Object[]`

An array of objects specifying your programs option flags. They will be displayed in the order they are specified. Each option spec object can contain the following properties:

   * `name` - The name of the option (**required**).
   * `description` - A description of the option. This property is not strictly required, but is strongly encouraged.
   * `required` - A boolean (defaults to `false`) indicating whether the option is required.
   * `arg` - A string, object, or array of either specifying one or more positional arguments the option takes. Object specs use the same structure as those specified in `config.positional` (minus the `description` field). String specs are equivalent to specifiying an object containing only a `name` property.
   * `alias` - A string or array of strings specifying any aliases for the option.
   * `preferAlias` - A boolean or string indicating that the options alias name should be used in the program usage section that gets generated. If value is a string, it must be one of the alias names specified for the option. Defaults to `false`.
   * `dependsOn` - The name of another option that this option depends on. Make sure that the option referenced here has been configured, otherwise an error will be thrown. References to alias names are allowed.
   * `conflicts` - Another option name or array of names that this option conflicts with. Make sure that these option names specified here reference other options that have been configured, otherwise an error will be thrown. References to alias names are allowed.

**Note:** relationships specified by the `dependsOn` and `conflicts` fields are reflected in the program usage section that is automatically generated. Check out the [examples](#Examples) section below for more information.

#### Options

##### `options.width`

Type: `number`

Character width to wrap the help output message to, defaults to the width of `process.stdout`.

##### `options.spacing`

Type: `number`

Size of the gap between table columns, default is `2`.

##### `options.indent`

Type: `number`

How much to indent the content of each section on the left side, defaults to the value of `options.spacing`.

##### `options.color`

Type: `boolean`

Whether the returned help message string should be colorized, default is `true`.

##### `options.styles`

Type: `Object`

Ansi colorization customizations This option is only relevant if `options.color` is `true`. Must be an object that maps *style selector ids* to *ansi style values*. The following are valid style selector ids that target different components of the help output string:

 * `'positional'` - selector id for positional arguments (default style is `'yellow'`).
 * `'option'` - selector id for option names (default style is `'green'`).
 * `'header'` - selector id for section headers (default style is `'bold.underline'`).

Specifying `null` or `''` for a selector id will result in no style being applied. Check out [`ansi-styles`](https://github.com/chalk/ansi-styles) for a list of valid style values, (multiple values must be separated by a `'.'`, or supplied as an array).

## Examples

Additional information specified about a program option, such as whether it is required or if it depends on another option, is reflected in the program usage section that is included in the returned help message.

The following example demonstrates how using the `required` and `dependsOn` fields will affect the resulting message.

```js
const message = helpOutput({
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
});
```

The generated usage will indicate that the `--foo` flag must be present, the `--bar` and `--baz` flags are optional, and the `--qux` flag is allowed only if the `--baz` flag is present:

<p align="center">
    <img src="media/examples-basic.svg" alt="examples-basic"/>
</p>

### Mutually Exclusive Groups

Option conflicts specified via the `conflicts` field will be indicated in the generated usage in form of mutually exclusive groups.
Groups with required members are enclosed in parentheses, while groups with optional members are enclosed in brackets.

> **Note:** all options that make up a mutually exclusive group must be either optional or required - attempting to have a mutually exclusive group with a mixture of optional and required members will result in an error being thrown.

In the following example, the `--foo` and `--bar` flags form one group, and the `--baz` and `--qux` flags form another. 

```js
const message = helpOutput({
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
});
```

The generated usage will indicate that either the `--foo` or the `--bar` flag *must* be preset, and that either the `--baz` or the `--qux` flag may optionally be present:

<p align="center">
    <img src="media/examples-me-groups.svg" alt="examples-me-groups"/>
</p>

### Partially Exclusive Groups

It is not a requirement that every member of a mutually exclusive group conflict with every other option in that group.

In the following example `--foo` conflicts with the `--bar`, `--baz`, and `--qux` flags, but the latter three flags do not conflict with each other.

```js
const message = helpOutput({
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
});
```

The generated usage will indicate that either the `--foo` flag may be present, or any combination of the `--bar`, `--baz`, and `--qux` flags may be present:

<p align="center">
    <img src="media/examples-pe-groups.svg" alt="examples-pe-groups"/>
</p>

## Development

Contributions are welcome!

To report a bug or request a feature, please [open a new issue](../../issues/new).

### Running Tests 

Install project dependencies and run the test suite with the following command:

```bash
yarn && yarn test
```

To generate coverage reports, run:

```bash
yarn coverage
```

## License

[MIT](LICENSE)
