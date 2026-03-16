import json
import re

with open('lib/data.ts', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

for a in data['articles']:
    if 'The Final' in a['title']:
        print(f"{a['title']}: {a.get('image')}")
