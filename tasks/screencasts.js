const fs = require('fs'),
    path = require('path'),
    https = require('https'),
    chalk = require('chalk'),
    { render } = require('svg-term'),
    { optimize } = require('svgo'),
    ansi = require('../lib/ansi'),
    helpOutput = require('../lib'),
    mediaFiles = require('../media/files');

const theme = {
    // black
    0: [0, 0, 0],
    // red
    1: [255, 92, 87],
    // green
    2: [90, 247, 142],
    // yellow
    3: [243, 249, 157],
    // blue
    4: [87, 199, 255],
    // magenta
    5: [255, 106, 193],
    // cyan
    6: [154, 237, 254],
    // white
    7: [241, 241, 240],
    // light black
    8: [104, 104, 104],
    // light red
    9: [255, 92, 87],
    // light green
    10: [90, 247, 142],
    // light yellow
    11: [243, 249, 157],
    // light blue
    12: [87, 199, 255],
    // light magenta
    13: [255, 106, 193],
    // light cyan
    14: [154, 237, 254],
    // light white
    15: [241, 241, 240],
    background: [40, 42, 54],
    bold: [248, 248, 248],
    cursor: [234, 234, 234],
    text: [239, 240, 235],
    fontFamily: 'Fira Code',
};

/**
 * Make a GET request
 * @param {string} url
 * @returns {Promise<Object>}
 */
function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            const chunks = [];
            // handle response chunks
            resp.on('data', (chunk) => {
                chunks.push(chunk);
            });
            // response complete
            resp.on('end', () => {
                const { 'content-type': type } = resp.headers,
                    data = Buffer.concat(chunks);
                resolve({ type, data });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Fetch the required css code for a subset of characters and font family
 * @param {string} charSubset - the character subset to specify
 * @param {string} fontFamily - the name of the font to use
 * @returns {string} - css code
 */
async function fetchFontCss(charSubset, fontFamily) {
    // create google fonts url
    const cssUrl = `https://fonts.googleapis.com/css2?family=${
        fontFamily.replace(' ', '+')
    }:wght@400;700&text=${encodeURI(charSubset)}`;
    // fetch css from google api
    let { data: css } = await fetchData(cssUrl);
    css = css.toString();
    // find all font urls in css code
    const regex = /url\((https?:\/\/.+?)\)/g,
        urls = [];
    for (let m = regex.exec(css); m; m = regex.exec(css)) {
        const { 0: str, 1: url, index } = m;
        urls.push([index + str.indexOf(url), url]);
    }
    // return css with font urls replace with base64 encoded versions
    return urls.reduce((p, [j, url], idx) => p.then(async ([i, str]) => {
        const { type, data } = await fetchData(url),
            base64 = `data:${type};charset=utf-8;base64,${data.toString('base64')}`,
            j2 = j + url.length;
        return (idx === urls.length - 1)
            ? str + css.slice(i, j) + base64 + css.slice(j2)
            : [j2, str + css.slice(i, j) + base64];
    }), Promise.resolve([0, '']));
}

/**
 * Render a help output svg screencast
 * @param {Object} config - help output config
 * @param {Object} [options] - help output options
 * @returns {string} - screencast svg
 */
async function renderScreencast(config, options) {
    const message = helpOutput(config, options),
        // strip ansi from output
        plainMessage = ansi.strip(message),
        // determine character subset
        charSubset = [...new Set([...plainMessage.replace(/[\n\r]/g, '')])].sort().join(''),
        // width of the terminal
        width = (options && options.width) || Math.max(...plainMessage.split('\n').map((l) => l.length)),
        // height of the terminal
        height = plainMessage.split('\n').length + 1;

    // fetch font css from the google fonts api
    let fontCss;
    try {
        fontCss = await fetchFontCss(charSubset, theme.fontFamily);
    } catch (e) {
        console.log(chalk`{bold.red Error occured fetching google font:}\n${e.message}`);
        return null;
    }
    // an asciicast v2 file with one event frame
    const asciicast = [
        // `{"version": 2, "width": ${width}, "height": ${height}}`,
        `{"version": 2, "width": ${width}, "height": ${height}, "title": "Demo" }`,
        `[0.5, "o", ${JSON.stringify(message).replace(/\\n/g, '\\r\\n')}]`,
    ].join('\n');
    // render terminal svg using `svg-term`
    let svg = render(asciicast, {
        theme,
        at: 1000,
        cursor: false,
        to: null,
        from: null,
        window: true,
        paddingX: 5,
        paddingY: 5,
        width,
        height,
    });
    // inject google font css <style> tag into svg
    svg = svg.replace(/^(<svg.*?>)/, `$1<defs><style type="text/css">${fontCss}</style></defs>`);
    // optimize with svgo
    ({ data: svg } = optimize(svg, { inlineStyles: false }));
    // returned optimized svg string
    return svg;
}

async function run() {
    // render all screencast svg media files
    await mediaFiles.reduce((p, { id, config, options }) => p.then(async () => {
        const filePath = path.resolve(__dirname, `../media/${id}.svg`);
        console.log(chalk`rendering screencast {cyan '${id}'} to {yellow ${path.relative(process.cwd(), filePath)}}`);
        const svg = await renderScreencast(config, options);
        fs.writeFileSync(filePath, svg);
    }), Promise.resolve());
}

run();