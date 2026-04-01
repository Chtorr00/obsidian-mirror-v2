const fs = require('fs');
const path = require('path');

const dataPath = 'c:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/lib/data.ts';
let content = fs.readFileSync(dataPath, 'utf8');

// Fix malformed escapes: double backslash followed by quote ending string early
// We want to replace \\" with \" which correctly escapes the quote in the JS literal.
// However, we must be careful not to break intended double backslashes that AREN'T followed by a quote.
// But in this JSON-exported-to-TS file, any \\" is likely an error from a double-escaping attempt.

console.log('Original content length:', content.length);

// Count occurrences before
const count = (content.match(/\\\\"/g) || []).length;
console.log('Found', count, 'malformed escapes (\\\\")');

const fixedContent = content.replace(/\\\\"/g, '\\"');

fs.writeFileSync(dataPath, fixedContent);
console.log('Fixed file saved.');
