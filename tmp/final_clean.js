const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Robust regex to catch the boilerplate in parts or together, with any whitespace
    const r1 = /You are reading an archaeological diagnostic retrieved from the Obsidian Mirror Archive\./gi;
    const r2 = /The Hindsight Filter has been applied to this artifact\./gi;
    
    let newContent = content.replace(r1, '').replace(r2, '');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Cleaned: ${filePath}`);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.md') || file.endsWith('.ts')) {
            cleanFile(fullPath);
        }
    });
}

walk('c:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/vault');
cleanFile('c:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/lib/data.ts');
cleanFile('c:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/lib/data_new.ts');

console.log('Final boilerplate sweep complete.');
