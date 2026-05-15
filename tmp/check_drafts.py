import os, yaml, json
from datetime import date

articles_dir = "content/sources/articles"

draft_articles = []

for f in os.listdir(articles_dir):
    if f.endswith('.md'):
        with open(os.path.join(articles_dir, f), 'r', encoding='utf-8') as file:
            content = file.read()
            if content.startswith('---'):
                try:
                    parts = content.split('---')
                    if len(parts) >= 3:
                        data = yaml.safe_load(parts[1])
                        status = data.get('status')
                        if status == 'draft':
                            draft_articles.append(f)
                except Exception as e:
                    pass

print(f"Draft articles: {len(draft_articles)}")
for f in draft_articles:
    print(f"  - {f}")
