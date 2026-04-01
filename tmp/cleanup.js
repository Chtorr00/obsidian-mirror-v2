const fs = require('fs');
const dataPath = 'c:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/lib/data.ts';
let content = fs.readFileSync(dataPath, 'utf8');
const boilerplateRegex = /You are reading an archaeological diagnostic retrieved from the Obsidian Mirror Archive\.\s*The Hindsight Filter has been applied to this artifact\./gi;
content = content.replace(boilerplateRegex, '');

// Also remove the same from data_new.ts just in case
const dataNewPath = 'c:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/lib/data_new.ts';
if (fs.existsSync(dataNewPath)) {
    let contentNew = fs.readFileSync(dataNewPath, 'utf8');
    contentNew = contentNew.replace(boilerplateRegex, '');
    fs.writeFileSync(dataNewPath, contentNew);
}

fs.writeFileSync(dataPath, content);
console.log('Cleaned data.ts');
