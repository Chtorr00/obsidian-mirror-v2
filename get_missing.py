import json
import re

with open('lib/data.ts', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

missing = [a['title'] for a in data['articles'] if a.get('image') == '/images/FinalFantasy.jpg']

with open('missing_images.txt', 'w', encoding='utf-8') as f:
    for m in missing:
        f.write(m + '\n')
