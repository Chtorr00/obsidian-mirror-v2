import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('lib/data.ts', 'utf-8');
const dataStr = content.replace('export const SYNO_DATA = ', '').replace(/;$/, '');
// because it's evaluated JS with types or syntax we can't easily parse with JSON.parse,
// wait, instead of executing, I'll compile it with tsc or use regex.

// Actually this might be easier in python with basic regex splits.
