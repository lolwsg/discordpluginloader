// injector/asar-patcher/patch.js
const asar = require('@electron/asar');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ASARPatcher {
    constructor(discordPath) {
        this.discordPath = discordPath;
        this.coreAsarPath = path.join(discordPath, 'modules', 'discord_desktop_core-1', 'discord_desktop_core', 'core.asar');
        this.backupPath = this.coreAsarPath + '.backup';
        this.unpackedPath = path.join(__dirname, 'unpacked_core');
        this.logFile = path.join(__dirname, '..', '..', 'plugin-loader.log');
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(this.logFile, logMessage);
        console.log(message);
    }

    async patch() {
        this.log('🔧 Starting patch...');
        
        if (!fs.existsSync(this.coreAsarPath)) {
            throw new Error('core.asar not found');
        }

        if (!fs.existsSync(this.backupPath)) {
            fs.copyFileSync(this.coreAsarPath, this.backupPath);
            this.log('✅ Backup created');
        }

        if (fs.existsSync(this.unpackedPath)) {
            fs.rmSync(this.unpackedPath, { recursive: true, force: true });
        }

        this.log('📦 Extracting ASAR...');
        await asar.extractAll(this.coreAsarPath, this.unpackedPath);
        
        const mainScreenPath = path.join(this.unpackedPath, 'app', 'mainScreen.js');
        let content = fs.readFileSync(mainScreenPath, 'utf8');
        
        if (content.includes('PLUGIN_LOADER_INJECTION')) {
            this.log('⚠️ Already patched');
            return;
        }

        this.log('📝 Patching mainScreen.js...');
        content = content.replace(/nodeIntegration:\s*false/g, 'nodeIntegration: true');
        
        const preloadPath = path.join(__