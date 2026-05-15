import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const VAULT_DIR = 'content/sources/articles';
const today = new Date().toISOString().split('T')[0];

const files = fs.readdirSync(VAULT_DIR).filter(f => f.endsWith('.md'));

for (const filename of files) {
    if (filename !== 'the-stasis-doctrine.md') continue;
    
    const filePath = path.join(VAULT_DIR, filename);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const parts = rawContent.split('---');
    
    console.log(`Filename: ${filename}`);
    console.log(`Parts length: ${parts.length}`);
    
    if (parts.length < 3) {
        console.log('Skipped: parts.length < 3');
        continue;
    }
    
    try {
        const frontmatter: any = yaml.load(parts[1]);
        console.log('Frontmatter:', JSON.stringify(frontmatter, null, 2));
        
        const status = frontmatter.status || 'published';
        const publish_date = frontmatter.publish_date || "";
        
        console.log(`Status: ${status}`);
        console.log(`Publish Date: ${publish_date}`);
        console.log(`Today: ${today}`);
        
        const isNotDraft = status !== 'draft';
        const isNotEmbargoed = !publish_date || publish_date <= today;
        
        console.log(`Is not draft: ${isNotDraft}`);
        console.log(`Is not embargoed: ${isNotEmbargoed}`);
        
        if (isNotDraft && isNotEmbargoed) {
            console.log('SUCCESS: Would be included');
        } else {
            console.log('FILTERED OUT');
        }
        
    } catch (e) {
        console.log('Error parsing YAML:', e.message);
    }
}
