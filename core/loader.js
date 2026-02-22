// dist/loader.js - Runs in renderer, use window.require instead
console.log('%c[PluginLoader]', 'color: #5865F2; font-weight: bold;', 'Loading...');

// Use Electron's exposed require (if available) or wait for it
const waitForRequire = () => {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.require) {
            resolve(window.require);
        } else {
            setTimeout(() => waitForRequire().then(resolve), 100);
        }
    });
};

async function init() {
    try {
        const req = await waitForRequire();
        const fs = req('fs');
        const path = req('path');
        
        console.log('%c[PluginLoader]', 'color: #5865F2;', 'Initialized');
        
        const pluginDir = path.join(__dirname, '..', 'plugins');
        console.log('%c[PluginLoader]', 'color: #5865F2;', 'Looking in:', pluginDir);
        
        if (!fs.existsSync(pluginDir)) {
            console.log('%c[PluginLoader]', 'color: #5865F2;', 'No plugins folder');
            return;
        }

        const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
        console.log('%c[PluginLoader]', 'color: #5865F2;', 'Found plugins:', files);

        for (const file of files) {
            try {
                const pluginPath = path.join(pluginDir, file);
                const PluginClass = req(pluginPath);
                const instance = new PluginClass({ 
                    log: (...args) => console.log(`[${file}]`, ...args),
                    getModule: () => null 
                });
                
                if (instance.enabled !== false && instance.start) {
                    instance.start();
                    console.log('%c[PluginLoader]', 'color: #5865F2;', 'Started:', instance.name || file);
                }
            } catch (err) {
                console.error('%c[PluginLoader]', 'color: #5865F2;', 'Failed:', file, err.message);
            }
        }
    } catch (e) {
        console.error('%c[PluginLoader]', 'color: #5865F2;', 'Error:', e);
    }
}

init();