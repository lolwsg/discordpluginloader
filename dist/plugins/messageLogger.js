// plugins/messageLogger.js
const Plugin = require('../core/plugin-api/base');

class MessageLogger extends Plugin {
    constructor(loader) {
        super(loader);
        this.name = 'MessageLogger';
        this.description = 'Logs deleted messages';
        this.author = 'You';
        this.deletedMessages = new Map();
    }

    start() {
        // Find Discord's message store
        const MessageStore = this.getModule(m => m?.getMessages && m?.getMessage);
        const Dispatcher = this.getModule(m => m?.dispatch && m?.subscribe);

        if (!Dispatcher) return;

        // Patch dispatch to intercept MESSAGE_DELETE
        const originalDispatch = Dispatcher.dispatch;
        Dispatcher.dispatch = (action) => {
            if (action.type === 'MESSAGE_DELETE') {
                const message = MessageStore?.getMessage(action.channelId, action.id);
                if (message) {
                    this.deletedMessages.set(action.id, message);
                    this.showToast(`Message deleted: ${message.content.substring(0, 50)}`);
                }
            }
            return originalDispatch.call(Dispatcher, action);
        };

        this.log('MessageLogger started');
    }

    showToast(message) {
        // Inject toast notification into Discord's UI
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #5865F2;
            color: white;
            padding: 12px;
            border-radius: 8px;
            z-index: 9999;
            font-family: var(--font-primary);
        `;
        container.textContent = message;
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 5000);
    }
}

module.exports = MessageLogger;