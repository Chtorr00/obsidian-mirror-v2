import json
import re

# Load Glossary
with open("lib/glossary.json", "r", encoding="utf-8") as f:
    glossary = json.load(f)

# Sort by length descending to handle overlapping terms (e.g. "Sovereign Stacks" before "Stacks")
glossary_terms = sorted([g["term"] for g in glossary], key=len, reverse=True)

# Load Articles
with open("lib/data.ts", "r", encoding="utf-8") as f:
    raw = f.read()

# Strip export syntax to parse JSON
json_raw = raw.replace("export const SYNO_DATA = ", "").strip().rstrip(";")
data = json.loads(json_raw)

def inject_links(body, terms):
    found_in_body = []
    
    # We want to replace the first occurrence of each unique term found in the body.
    # To avoid double-linking or linking inside brackets, we'll keep track of ranges.
    
    # Simple strategy: iterate through terms. Find first occurrence.
    # If found, check if it's already "enclosed" in brackets.
    
    for term in terms:
        # Use regex to find whole word matches, case-insensitive
        # This matches the term if it's not preceded by [[
        # (Using a simplified approach for speed and correctness)
        
        # Escaping term for regex
        pattern = r"(?<!\[\[)\b" + re.escape(term) + r"\b(?!\]\])"
        
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            # Found a match!
            found_in_body.append(term)
            
            # Replace ONLY the first occurrence
            start, end = match.span()
            # We use the original glossary term casing for the brackets to ensure consistency
            # but we preserve the text found if it was slightly different (though usually it matches).
            # Actually, standard [[Term]] usually uses the exact term name for the link.
            body = body[:start] + f"[[{term}]]" + body[end:]
            
    return body, sorted(list(set(found_in_body)))

articles_updated = 0
for article in data["articles"]:
    new_body, found_refs = inject_links(article["body"], glossary_terms)
    
    # Also check existing glossary_refs and merge
    existing_refs = article.get("glossary_refs", [])
    all_refs = sorted(list(set(existing_refs + found_refs)))
    
    article["body"] = new_body
    article["glossary_refs"] = all_refs
    articles_updated += 1

# Save updated data
output_json = json.dumps(data, indent=2, ensure_ascii=False)
output_ts = f"export const SYNO_DATA = {output_json};\n"

with open("lib/data.ts", "w", encoding="utf-8") as f:
    f.write(output_ts)

print(f"Updated {articles_updated} articles with glossary backlinks.")
