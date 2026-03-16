import os
import json
import re

md_dir = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\dev-projects\projects\obsidian-mirror\01_Articles"
data_ts_path = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\lib\data.ts"

with open(data_ts_path, 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

# Extract original sources
source_map = {}
for filename in os.listdir(md_dir):
    if not filename.endswith('.md'):
        continue
    filepath = os.path.join(md_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to grab frontmatter
    fm_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        fm = fm_match.group(1)
        # Find title
        title_m = re.search(r'^title:\s*"(.*?)"', fm, re.MULTILINE)
        if not title_m:
            title_m = re.search(r"^title:\s*'(.*?)'", fm, re.MULTILINE)
        if not title_m:
            title_m = re.search(r"^title:\s*(.*)$", fm, re.MULTILINE)
            
        src_m = re.search(r'^original_source:\s*"(.*?)"$', fm, re.MULTILINE)
        if not src_m:
            src_m = re.search(r"^original_source:\s*'(.*?)'$", fm, re.MULTILINE)
        if not src_m:
            # Maybe it spans multiple lines or has no quotes
            # Just grab everything after original_source: up to the next key
            src_m2 = re.search(r'^original_source:\s*(.*?)(?=\n[a-z_]+:)', fm, re.DOTALL | re.MULTILINE)
            if src_m2:
                src_val = src_m2.group(1).strip().strip('"').strip("'")
            else:
                src_val = ""
        else:
            src_val = src_m.group(1).strip()
            
        if title_m and src_val:
            title = title_m.group(1).strip()
            source_map[title] = src_val

for article in data['articles']:
    title = article['title']
    if title in source_map:
        article['original_source'] = source_map[title]

with open(data_ts_path, 'w', encoding='utf-8') as f:
    f.write("export const SYNO_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";\n")

print(f"Injected sources for {len(source_map)} articles out of {len(data['articles'])}")
