// core/plugin-api/base.js
class Plugin {
    constructor(loader) {
        this.loader = loader;
        this.name = 'Unnamed Plugin';
        this.description = '';
        this.author = '';
        this.version = '1.0.0';
        this.enabled = true;
        this.patches = [];
    }

    start() {
        // Override in subclass
    }

    stop() {
        this.patches.forEach(unpatch => unpatch());
        this.patches = [];
    }

    log(...args) {
        console.log(`[${this.name}]`, ...args);
    }

    // Convenience methods
    getModule(filter) {
        return this.loader.getModule(filter);
    }

    patch(target, method, handler, type = 'after') {
        const unpatch = this.loader.patch()[type](target, method, handler);
        this.patches.push(unpatch);
        return unpatch;
    }

    addStyles(css) {
        const style = document.createElement('style');
        style.textContent = css;
        style.id = `plugin-${this.name}-styles`;
        document.head.appendChild(style);
        
        this.patches.push(() => style.remove());
    }
}

module.exports = Plugin;