import json
import re

data_ts_path = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\lib\data.ts"
with open(data_ts_path, 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

reset_titles = [
    "The Final, Sane Prescription",
    "The Final Poll",
    "The Final Philosophy of a Dying Age",
    "The Final Calculation"
]

for article in data['articles']:
    if article['title'] in reset_titles:
        old_image = article.get('image', '/images/FinalFantasy.jpg')
        new_image = '/images/FinalFantasy.jpg'
        article['image'] = new_image
        if 'preview' in article:
            article['preview'] = article['preview'].replace(old_image, new_image)
        if 'body' in article:
            article['body'] = article['body'].replace(old_image, new_image)

with open(data_ts_path, 'w', encoding='utf-8') as f:
    f.write("export const SYNO_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";\n")
