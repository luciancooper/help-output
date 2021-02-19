const ansiRegex = require('ansi-regex');

const regex = ansiRegex();

function strip(string) {
    return (typeof string === 'string') ? string.replace(regex, '') : String(string);
}

function contains(string) {
    return typeof string === 'string' && regex.test(string);
}

function width(string) {
    return strip(string).length;
}

module.exports = {
    regex,
    strip,
    width,
    contains,
};