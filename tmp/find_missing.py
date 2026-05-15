import os, json, re

articles_dir = "content/sources/articles"
data_path = "lib/data.ts"

with open(data_path, 'r', encoding='utf-8') as f:
    raw = f.read()
match = re.search(r'export const SYNO_DATA = ({.*});', raw, re.DOTALL)
data = json.loads(match.group(1))
synced_filenames = {a.get('filename') for a in data['articles']}

all_files = {f for f in os.listdir(articles_dir) if f.endswith('.md')}

missing = all_files - synced_filenames
print(f"Total files in dir: {len(all_files)}")
print(f"Total synced: {len(synced_filenames)}")
print(f"Missing from data.ts: {len(missing)}")
for f in missing:
    print(f"  - {f}")
