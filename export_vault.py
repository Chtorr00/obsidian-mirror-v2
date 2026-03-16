import json
import os
import re

# Load Data
with open("lib/data.ts", "r", encoding="utf-8") as f:
    raw = f.read()
    json_raw = raw.replace("export const SYNO_DATA = ", "").strip().rstrip(";")
    data = json.loads(json_raw)

# Load Glossary
with open("lib/glossary.json", "r", encoding="utf-8") as f:
    glossary = json.load(f)

# Create Directories
os.makedirs("vault/articles", exist_ok=True)
os.makedirs("vault/glossary", exist_ok=True)

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name).replace(" ", "_")

# Export Articles
for article in data["articles"]:
    title = article["title"]
    filename = article.get("filename", sanitize_filename(title) + ".md")
    path = os.path.join("vault/articles", filename)
    
    # Build Frontmatter
    frontmatter = [
        "---",
        f'title: "{title}"',
        f'primary: {article.get("primary", "")}',
        f'secondary: {json.dumps(article.get("secondary", []))}',
        f'source: "{article.get("original_source", "")}"',
        f'month: {article.get("month", "")}',
        "---",
        ""
    ]
    
    body = article["body"]
    
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(frontmatter) + body)

# Export Glossary
for term in glossary:
    name = term["term"]
    path = os.path.join("vault/glossary", sanitize_filename(name) + ".md")
    
    frontmatter = [
        "---",
        f'term: "{name}"',
        f'years: "{term["years"]}"',
        "---",
        ""
    ]
    
    content = f"# {name}\n\n**Timeline:** {term['years']}\n\n{term['description']}"
    
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(frontmatter) + content)

print(f"Exported {len(data['articles'])} articles and {len(glossary)} glossary terms to 'vault/' directory.")
