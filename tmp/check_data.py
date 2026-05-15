import re, json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data.ts', 'r', encoding='utf-8') as f:
    raw = f.read()

match = re.search(r'export const SYNO_DATA = ({.*});', raw, re.DOTALL)
data = json.loads(match.group(1))
articles = data.get('articles', [])

print(f"Total articles in data.ts: {len(articles)}")

# Check publish_date distribution
dates = {}
missing_date = 0
for a in articles:
    pd = a.get('publish_date', '')
    if pd:
        dates[pd] = dates.get(pd, 0) + 1
    else:
        missing_date += 1

print(f"Articles with publish_date: {len(articles) - missing_date}")
print(f"Articles WITHOUT publish_date: {missing_date}")
print()

for d in sorted(dates.keys()):
    print(f"  {d}: {dates[d]} articles")

# Check for future-dated articles
from datetime import date
today = date.today().isoformat()
future = [a for a in articles if a.get('publish_date', '') > today]
print(f"\nFuture-dated articles in data.ts (should NOT be here): {len(future)}")
for a in future:
    print(f"  - {a['title']} ({a.get('publish_date', 'N/A')})")

# Check status distribution
statuses = {}
for a in articles:
    s = a.get('status', 'unknown')
    statuses[s] = statuses.get(s, 0) + 1
print(f"\nStatus distribution: {statuses}")

# Check the new articles from today's batch
print("\n--- New batch articles in content/sources/ ---")
import os
inbox_dir = r"C:\Users\markj\OneDrive\Documents\ObsidianArchive\Mirror\Current\Inbox"
if os.path.exists(inbox_dir):
    files = os.listdir(inbox_dir)
    print(f"Files in Inbox: {files}")
else:
    print("Inbox directory not found")

staging_articles = r"C:\Users\markj\OneDrive\Documents\ObsidianArchive\Mirror\Staging\Articles"
if os.path.exists(staging_articles):
    files = os.listdir(staging_articles)
    print(f"Files in Staging/Articles: {files}")
else:
    print("Staging/Articles directory not found")
