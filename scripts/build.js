const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CORE = path.join(ROOT, 'core');
const PLUGINS = path.join(ROOT, 'plugins');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFile(src, dest) {
    fs.copySync(src, dest, { overwrite: true });
    console.log(`✓ ${path.basename(src)}`);
}

function build() {
    console.log('🔨 Building Discord Plugin Loader...\n');
    
    // Clean and create dist
    if (fs.existsSync(DIST)) {
        fs.removeSync(DIST);
    }
    ensureDir(DIST);
    ensureDir(path.join(DIST, 'plugins'));

    // Copy core files
    console.log('📦 Copying core files...');
    const coreFiles = fs.readdirSync(CORE).filter(f => f.endsWith('.js'));
    coreFiles.forEach(file => {
        copyFile(path.join(CORE, file), path.join(DIST, file));
    });

    // Bundle loader specifically
    console.log('\n📦 Bundling loader...');
    const loaderContent = fs.readFileSync(path.join(CORE, 'loader.js'), 'utf8');
    
    // Create standalone loader that can be injected
    const bundledLoader = `
// Discord Plugin Loader - Bundled
const Module = require('module');
const path = require('path');
const fs = require('fs');

// Ensure we can require from the right location
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain) {
    if (request.startsWith('./') || request.startsWith('../')) {
        const resolved = path.join('${DIST.replace(/\\/g, '\\\\')}', request);
        if (fs.existsSync(resolved) || fs.existsSync(resolved + '.js')) {
            return originalResolve.call(this, resolved, parent, isMain);
        }
    }
    return originalResolve.call(this, request, parent, isMain);
};

${loaderContent}
`;

    fs.writeFileSync(path.join(DIST, 'loader.js'), bundledLoader);

    // Copy plugins
    console.log('\n📦 Copying plugins...');
    if (fs.existsSync(PLUGINS)) {
        const pluginFiles = fs.readdirSync(PLUGINS).filter(f => f.endsWith('.js'));
        pluginFiles.forEach(file => {
            copyFile(path.join(PLUGINS, file), path.join(DIST, 'plugins', file));
        });
    } else {
        ensureDir(PLUGINS);
        // Create example plugin
        const examplePlugin = `const Plugin = require('../core/plugin-api/base');

class ExamplePlugin extends Plugin {
    constructor(loader) {
        super(loader);
        this.name = 'ExamplePlugin';
        this.description = 'An example plugin';
        this.author = 'You';
        this.version = '1.0.0';
    }

    start() {
        this.log('Hello from ExamplePlugin!');
        
        // Example: Patch console.log
        const originalLog = console.log;
        console.log = (...args) => {
            if (args[0]?.includes?.('discord')) {
                originalLog('[Intercepted]', ...args);
            }
            originalLog(...args);
        };
    }
}

module.exports = ExamplePlugin;`;
        
        fs.writeFileSync(path.join(PLUGINS, 'example.js'), examplePlugin);
        copyFile(path.join(PLUGINS, 'example.js'), path.join(DIST, 'plugins', 'example.js'));
    }

    // Create package.json for dist (for electron require)
    const distPackage = {
        name: "discord-plugin-loader-inject",
        version: "1.0.0",
        main: "loader.js"
    };
    fs.writeFileSync(path.join(DIST, 'package.json'), JSON.stringify(distPackage, null, 2));

    console.log('\n✅ Build complete!');
    console.log(`📁 Output: ${DIST}`);
}

// Watch mode
if (process.argv.includes('--watch')) {
    console.log('👀 Watching for changes...');
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch([CORE, PLUGINS], {
        ignored: /node_modules/,
        persistent: true
    });

    watcher.on('change', (path) => {
        console.log(`\n📝 ${path} changed, rebuilding...`);
        try {
            build();
        } catch (e) {
            console.error('Build failed:', e);
        }
    });

    // Initial build
    build();
} else {
    build();
}