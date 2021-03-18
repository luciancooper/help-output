const path = require('path');

function terminalWidth() {
    const width = (typeof process.stdout.getWindowSize === 'function')
        ? process.stdout.getWindowSize()[0]
        : process.stdout.columns;
    if (!width) return 80;
    return width - ((process.platform === 'win32' && width > 1) ? 1 : 0);
}

function scriptName() {
    const [, script] = process.argv;
    return path.basename(script, path.extname(script));
}

module.exports = {
    terminalWidth,
    scriptName,
};