import os, yaml, json
from datetime import date

articles_dir = "content/sources/articles"
today = date.today().isoformat()

future_articles = []
all_articles = 0

for f in os.listdir(articles_dir):
    if f.endswith('.md'):
        all_articles += 1
        with open(os.path.join(articles_dir, f), 'r', encoding='utf-8') as file:
            content = file.read()
            # Extract frontmatter
            if content.startswith('---'):
                try:
                    parts = content.split('---')
                    if len(parts) >= 3:
                        data = yaml.safe_load(parts[1])
                        pd = data.get('publish_date')
                        if pd:
                            if isinstance(pd, date):
                                pd = pd.isoformat()
                            if pd > today:
                                future_articles.append((f, pd))
                except Exception as e:
                    print(f"Error parsing {f}: {e}")

print(f"Total MD articles: {all_articles}")
print(f"Future-dated articles: {len(future_articles)}")
for f, pd in sorted(future_articles, key=lambda x: x[1]):
    print(f"  {pd}: {f}")
