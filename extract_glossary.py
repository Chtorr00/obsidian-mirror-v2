import docx
import re
import json

files = [
    r"om_docs\Obsidian Mirror\Obsidian Mirror Glossary.docx",
    r"om_docs\Obsidian Mirror\Obsidian Mirror Glossary 2.docx"
]

glossary_entries = []

for file in files:
    doc = docx.Document(file)
    current_term = None
    current_years = None
    current_desc = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
            
        # Many terms are bolded, but let's rely on the structure:
        # It starts with an optional number, a short phrase, and then a date in parentheses.
        # Like: "51. The Administrative Stacks (c. 2035 - Present) The successor states..."
        # Or: "The Age of Institutional Exhaustion (c. 2008 \u2013 2032)"
        
        # We can find the first occurrence of '(' and ')'
        match = re.search(r'^\s*([\d\.]*\s*)([^()]+?)\s*\(([^)]+)\)', text)
        
        # Let's ensure the term part isn't too long, so we don't accidentally match a sentence with a parenthetical.
        if match and len(match.group(2)) < 60:
            if current_term:
                glossary_entries.append({
                    "term": current_term,
                    "years": current_years,
                    "description": "\n".join(current_desc).strip()
                })
                
            number_part = match.group(1).strip()
            term_part = match.group(2).strip()
            years_part = match.group(3).strip()
            remainder = text[match.end():].strip()
            
            # Clean up the term
            term_part = re.sub(r'^\d+\.\s*', '', term_part).strip()
            
            # Remove "c." from years and clean up dashes/unknown chars
            years_part = re.sub(r'^c\.\s*', '', years_part)
            years_part = re.sub(r'[^\d\w\sPresent\-to]', '-', years_part).replace('--', '-')
            
            current_term = term_part
            current_years = years_part
            current_desc = [remainder] if remainder else []
        else:
            if current_term is not None:
                current_desc.append(text)

    if current_term:
        glossary_entries.append({
            "term": current_term,
            "years": current_years,
            "description": "\n".join(current_desc).strip()
        })

processed_entries = []
for entry in glossary_entries:
    term = entry["term"].strip()
    years = entry["years"].strip()
    desc = entry["description"].strip()
    
    if years:
        # Check if single year: e.g. "2068"
        years_clean = re.sub(r'[^\d]', '', years)
        if len(years_clean) == 4 and ('-' not in years) and ('Present' not in years):
            y = int(years_clean)
            years = f"{y-5}-{y+5}"
            
    processed_entries.append({
        "term": term,
        "years": years,
        "description": desc
    })

# Deduplicate based on term, just in case
unique_terms = {}
for e in processed_entries:
    unique_terms[e["term"]] = e
processed_entries = list(unique_terms.values())

# Alphabetize
processed_entries.sort(key=lambda x: x["term"].lower())

with open("lib/glossary.json", "w", encoding="utf-8") as f:
    json.dump(processed_entries, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(processed_entries)} unique glossary terms.")
for i, e in enumerate(processed_entries[:5]):
    print(f"[{e['years']}] {e['term']}: {e['description'][:30]}...")
