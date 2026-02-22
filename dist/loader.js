
// Discord Plugin Loader - Bundled
const Module = require('module');
const path = require('path');
const fs = require('fs');

// Ensure we can require from the right location
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain) {
    if (request.startsWith('./') || request.startsWith('../')) {
        const resolved = path.join('C:\\Users\\hookx\\Downloads\\discord-plugin-loader\\dist', request);
        if (fs.existsSync(resolved) || fs.existsSync(resolved + '.js')) {
            return originalResolve.call(this, resolved, parent, isMain);
        }
    }
    return originalResolve.call(this, request, parent, isMain);
};

// core/loader.js
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

class PluginLoader {
    constructor() {
        this.plugins = new Map();
        this.webpackCache = null;
        this.settings = {};
    }

    async init() {
        console.log('[PluginLoader] Initializing...');
        
        // Wait for Discord's webpack
        await this.waitForWebpack();
        
        // Patch module system
        this.patchWebpack();
        
        // Load plugins
        await this.loadPlugins();
        
        // Setup IPC with main process
        this.setupIPC();
        
        console.log('[PluginLoader] Ready');
    }

    waitForWebpack() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.webpackChunkdiscord_app) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    patchWebpack() {
        // Get Discord's webpack require
        const webpackExports = window.webpackChunkdiscord_app.push([
            ['__plugin_loader__'],
            {},
            (req) => {
                this.webpackCache = req.c;
                return req;
            }
        ]);
        window.webpackChunkdiscord_app.pop();

        // Monkey-patch require for plugin access
        const originalRequire = window.require;
        window.require = (id) => {
            if (id.startsWith('@discord/')) {
                return this.findModule(id.replace('@discord/', ''));
            }
            return originalRequire(id);
        };
    }

    findModule(filter) {
        if (!this.webpackCache) return null;
        
        for (const id in this.webpackCache) {
            const mod = this.webpackCache[id].exports;
            if (mod && filter(mod)) return mod;
            if (mod?.default && filter(mod.default)) return mod.default;
        }
        return null;
    }

    async loadPlugins() {
        const pluginDir = path.join(__dirname, '..', 'plugins');
        
        if (!fs.existsSync(pluginDir)) {
            fs.mkdirSync(pluginDir, { recursive: true });
        }

        const files = fs.readdirSync(pluginDir);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                await this.loadPlugin(path.join(pluginDir, file));
            }
        }
    }

    async loadPlugin(filePath) {
        try {
            delete require.cache[require.resolve(filePath)];
            const PluginClass = require(filePath);
            const instance = new PluginClass(this);
            
            this.plugins.set(instance.name, instance);
            
            if (instance.enabled !== false) {
                instance.start();
            }
            
            console.log(`[PluginLoader] Loaded: ${instance.name}`);
        } catch (err) {
            console.error(`[PluginLoader] Failed to load ${filePath}:`, err);
        }
    }

    // API for plugins
    getModule(filter) {
        return this.findModule(filter);
    }

    patch(before, instead, after) {
        return {
            before: (target, method, callback) => {
                const original = target[method];
                target[method] = function(...args) {
                    callback.call(this, args, original);
                    return original.apply(this, args);
                };
            },
            instead: (target, method, callback) => {
                target[method] = function(...args) {
                    return callback.call(this, args, original);
                };
            },
            after: (target, method, callback) => {
                const original = target[method];
                target[method] = function(...args) {
                    const result = original.apply(this, args);
                    callback.call(this, args, result);
                    return result;
                };
            }
        };
    }

    showNotification(title, body) {
        new Notification(title, { body });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PluginLoader().init());
} else {
    new PluginLoader().init();
}

module.exports = (mainWindow) => {
    // Preload injection for main process
    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.executeJavaScript(`
            ${fs.readFileSync(__filename, 'utf8')}
        `);
    });
};
