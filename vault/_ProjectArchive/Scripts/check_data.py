import json

with open("lib/data_new.ts", encoding="utf-8") as f:
    content = f.read()

# Strip TS wrapper
json_str = content.replace("export const SYNO_DATA = ", "").rstrip(";\n\r")
data = json.loads(json_str)

articles = data["articles"]
print(f"Total articles: {len(articles)}")

# Count by month
from collections import Counter
months = Counter(a["month"] for a in articles)
for m in ["January","February","March","July","August","September","October","November","December"]:
    print(f"  {m}: {months.get(m, 0)}")

# Count with images
with_img = sum(1 for a in articles if a.get("image"))
print(f"\nWith images: {with_img}")
print(f"Without images: {len(articles) - with_img}")

# Check STEEP placeholders
primaries = Counter(a["primary"] for a in articles)
print(f"\nPrimary categories: {dict(primaries)}")

# Show the no-image article
for a in articles:
    if not a.get("image"):
        print(f"\nNo image: [{a['month']}] {a['title']}")

# Check for duplicate titles
titles = [a["title"] for a in articles]
dupes = [t for t in titles if titles.count(t) > 1]
if dupes:
    print(f"\nDuplicate titles: {set(dupes)}")
else:
    print("\nNo duplicate titles")

# Check for duplicate filenames
fnames = [a["filename"] for a in articles]
dupe_fn = [f for f in fnames if fnames.count(f) > 1]
if dupe_fn:
    print(f"Duplicate filenames: {set(dupe_fn)}")
else:
    print("No duplicate filenames")
