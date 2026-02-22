// dist/preload.js
console.log('%c[PluginLoader]', 'color: #5865F2; font-weight: bold;', 'Injected!');

setTimeout(() => {
    console.log('%c[PluginLoader]', 'color: #5865F2;', 'Running...');
    
    try {
        if (window.webpackChunkdiscord_app) {
            console.log('%c[PluginLoader]', 'color: #5865F2;', 'Webpack found!');
        }
    } catch (e) {
        console.error('%c[PluginLoader]', 'color: #5865F2;', 'Error:', e);
    }
}, 5000);