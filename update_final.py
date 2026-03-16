import json
import re
import os

images_dir = 'public/images'
imgs = os.listdir(images_dir)

def find_matches(month_prefixes, day):
    for p in month_prefixes:
        # Match e.g. September3 or Sept03 or September03
        for i in imgs:
            if re.match(rf'^{p}0?{day}[A-Z\.]', i, re.IGNORECASE):
                return i
    return None

targets = {
    'The Final Verdict': (['September', 'Sept'], '3'),
    'The Final, Sane Prescription': (['November', 'Nov'], '7'),
    'The Final, Sane Diagnosis': (['December', 'Dec'], '6'),
    'The Final Poll': (['August', 'Aug'], '30'),
    'The Final Polite Request': (['August', 'Aug'], '4'),
    'The Final Philosophy of a Dying Age': (['November', 'Nov'], '29'),
    'The Final Ghost of a Dead Idea': (['September', 'Sept'], '21'),
    'The Final Fantasy': (['December', 'Dec'], '2'),
    'The Final Calculation': (['November', 'Nov'], '28'),
    'The Final Calculation Before the Flood': (['August', 'Aug'], '15')
}

mapping = {}
for title, (prefixes, day) in targets.items():
    found = find_matches(prefixes, day)
    print(f"{title}: {found}")
    if found:
        mapping[title] = "/images/" + found

# Load data.ts
data_ts_path = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\lib\data.ts"
with open(data_ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', content, re.DOTALL)
data = json.loads(match.group(1))

# Apply mappings
for article in data['articles']:
    title = article['title']
    if title in mapping and mapping[title]:
        old_image = article.get('image', '/images/FinalFantasy.jpg')
        new_image = mapping[title]
        article['image'] = new_image
        if 'preview' in article:
            article['preview'] = article['preview'].replace(old_image, new_image)
        if 'body' in article:
            article['body'] = article['body'].replace(old_image, new_image)

with open(data_ts_path, 'w', encoding='utf-8') as f:
    f.write("export const SYNO_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";\n")

print("Done updating lib/data.ts with exact manual date matches.")
