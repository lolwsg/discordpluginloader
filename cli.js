// cli.js
const ASARPatcher = require('./injector/asar-patcher/patch');
const path = require('path');
const os = require('os');
const fs = require('fs');

function findDiscordPath() {
    const platform = os.platform();
    const home = os.homedir();
    
    if (platform === 'win32') {
        const discordBase = path.join(process.env.LOCALAPPDATA, 'Discord');
        
        // Find the latest app-1.0.xxxx folder
        if (fs.existsSync(discordBase)) {
            const dirs = fs.readdirSync(discordBase)
                .filter(d => d.startsWith('app-'))
                .sort()
                .reverse();
            
            if (dirs.length > 0) {
                return path.join(discordBase, dirs[0]);
            }
        }
        
        // Fallback to hardcoded version
        return path.join(discordBase, 'app-1.0.9016');
    } else if (platform === 'darwin') {
        return '/Applications/Discord.app/Contents/Resources';
    } else {
        return path.join(home, '.config', 'Discord');
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const discordPath = findDiscordPath();
    console.log('Found Discord at:', discordPath);
    
    // Check if path exists
    if (!fs.existsSync(discordPath)) {
        console.error('❌ Discord not found at:', discordPath);
        console.log('Please check your Discord installation path.');
        process.exit(1);
    }
    
    const patcher = new ASARPatcher(discordPath);

    switch(command) {
        case 'install':
            await patcher.patch();
            console.log('✅ Plugin loader installed. Restart Discord.');
            break;
        case 'uninstall':
            patcher.restore();
            console.log('✅ Plugin loader removed. Restart Discord.');
            break;
        case 'dev':
            console.log('👀 Watching for changes...');
            break;
        default:
            console.log('Usage: node cli.js [install|uninstall|dev]');
    }
}

main().catch(console.error);