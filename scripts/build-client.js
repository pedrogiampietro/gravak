const fs = require('fs-extra');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');

const CLIENT_DIR = path.join(__dirname, '../client');
const SRC_DIR = path.join(CLIENT_DIR, 'src');
const DIST_DIR = path.join(CLIENT_DIR, 'dist');

async function build() {
    console.log('Starting client build...');

    // 1. Clean dist
    await fs.emptyDir(DIST_DIR);
    console.log('Cleaned dist directory.');

    // 2. Read launcher.js to get script order
    const launcherPath = path.join(SRC_DIR, 'launcher.js');
    const launcherContent = await fs.readFile(launcherPath, 'utf8');

    // Extract SCRIPTS array
    const scriptsMatch = launcherContent.match(/const SCRIPTS = \[\s*([\s\S]*?)\];/);
    if (!scriptsMatch) {
        throw new Error('Could not find SCRIPTS array in launcher.js');
    }

    const scriptPaths = scriptsMatch[1]
        .split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(s => s.length > 0)
        .map(s => path.join(CLIENT_DIR, s));

    console.log(`Found ${scriptPaths.length} scripts to bundle.`);

    // 3. Concatenate scripts
    let bundledCode = '';
    for (const scriptPath of scriptPaths) {
        if (await fs.pathExists(scriptPath)) {
            const content = await fs.readFile(scriptPath, 'utf8');
            bundledCode += `\n// START ${path.basename(scriptPath)}\n${content}\n// END ${path.basename(scriptPath)}\n`;
        } else {
            console.warn(`Warning: Script not found: ${scriptPath}`);
        }
    }

    // 4. Obfuscate bundled code
    console.log('Obfuscating game code...');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(bundledCode, {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: false,
        simplify: true,
        splitStrings: false,
        stringArray: true,
        stringArrayThreshold: 0.75,
        transformObjectKeys: false,
        unicodeEscapeSequence: false
    });

    const gameJsPath = path.join(DIST_DIR, 'game.js');
    await fs.writeFile(gameJsPath, obfuscationResult.getObfuscatedCode());
    console.log('Written obfuscated game.js');

    // 5. Create modified launcher.js
    const newLauncherContent = launcherContent.replace(/const SCRIPTS = \[\s*[\s\S]*?\];/, 'const SCRIPTS = [];');

    console.log('Obfuscating launcher...');
    const launcherObfuscationResult = JavaScriptObfuscator.obfuscate(newLauncherContent, {
        compact: true,
        controlFlowFlattening: false,
        stringArray: true,
        stringArrayThreshold: 0.75
    });

    const distLauncherPath = path.join(DIST_DIR, 'launcher.js');
    await fs.writeFile(distLauncherPath, launcherObfuscationResult.getObfuscatedCode());
    console.log('Written obfuscated launcher.js');

    // 6. Copy Assets
    console.log('Copying assets...');
    await fs.copy(path.join(CLIENT_DIR, 'css'), path.join(DIST_DIR, 'css'));
    await fs.copy(path.join(CLIENT_DIR, 'data'), path.join(DIST_DIR, 'data'));
    await fs.copy(path.join(CLIENT_DIR, 'png'), path.join(DIST_DIR, 'png'));
    await fs.copy(path.join(CLIENT_DIR, 'sounds'), path.join(DIST_DIR, 'sounds'));

    // 7. Bundle and Minify CSS
    console.log('Bundling CSS...');
    let indexHtml = await fs.readFile(path.join(CLIENT_DIR, 'index.html'), 'utf8');
    let cssContent = '';

    // Extract CSS files from index.html to ensure correct order
    // Matches <link rel="stylesheet" type="text/css" href="./css/filename.css">
    const linkRegEx = /<link rel="stylesheet" type="text\/css" href="\.\/css\/([^"]+)">/g;
    let match;
    while ((match = linkRegEx.exec(indexHtml)) !== null) {
        const cssFile = match[1];
        const cssPath = path.join(CLIENT_DIR, 'css', cssFile);
        if (await fs.pathExists(cssPath)) {
            console.log(`Adding CSS: ${cssFile}`);
            cssContent += await fs.readFile(cssPath, 'utf8');
        } else {
            console.warn(`Warning: CSS file not found: ${cssPath}`);
        }
    }

    const cssOutput = new CleanCSS({
        rebase: false
    }).minify(cssContent);

    const distCssPath = path.join(DIST_DIR, 'css', 'style.css');
    await fs.writeFile(distCssPath, cssOutput.styles);
    console.log('Written obfuscated style.css');

    // 8. Create index.html
    indexHtml = indexHtml.replace(
        '<script src="src/launcher.js"></script>',
        '<script src="game.js"></script>\n  <script src="launcher.js"></script>'
    );

    // Remove all existing CSS links
    indexHtml = indexHtml.replace(/<link rel="stylesheet" type="text\/css" href="\.\/css\/[^"]+">\s*/g, '');

    // Add new CSS link
    if (indexHtml.includes('</head>')) {
        indexHtml = indexHtml.replace('</head>', '  <link rel="stylesheet" type="text/css" href="css/style.css">\n</head>');
    } else {
        // Fallback if no </head> tag exists (common in some html files)
        indexHtml = indexHtml.replace('<body>', '  <link rel="stylesheet" type="text/css" href="css/style.css">\n<body>');
    }

    await fs.writeFile(path.join(DIST_DIR, 'index.html'), indexHtml);
    console.log('Written index.html');

    console.log('Build complete! Output in client/dist');
}

build().catch(console.error);
