import json
import re

with open('lib/data.ts', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

july_articles = []
for a in data['articles']:
    # Let's see if 'July' is in the title, or if it has a July image, or anything.
    if 'july' in a.get('image', '').lower() or 'july' in a.get('date', '').lower() or 'july' in a['title'].lower():
        july_articles.append((a['title'], a.get('image')))

print(f"Total July-related articles found: {len(july_articles)}")
for title, img in july_articles:
    print(f"- {title} ({img})")
