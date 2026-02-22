const fs = require('fs-extra');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

console.log('🧹 Cleaning build artifacts...');

if (fs.existsSync(DIST)) {
    fs.removeSync(DIST);
    console.log('✅ Removed dist/');
}

console.log('✨ Clean complete!');