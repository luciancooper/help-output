const path = require('path');

function terminalWidth() {
    return (
        (typeof process.stdout.getWindowSize === 'function')
            ? process.stdout.getWindowSize()[0]
            : (process.stdout.columns || 80)
    ) - (process.platform === 'win32' ? 1 : 0);
}

function scriptName() {
    const [, script] = process.argv;
    return path.basename(script, path.extname(script));
}

module.exports = {
    terminalWidth,
    scriptName,
};