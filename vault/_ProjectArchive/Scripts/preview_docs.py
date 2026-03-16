import docx
import os
import re

DOCS_DIR = r"om_docs\Obsidian Mirror"

monthly_docs = [
    "January Obsidian Mirror Articles.docx",
    "February Obsidian Mirror Articles.docx",
    "March Obsidian Mirror Articles.docx",
    "July Obsidian Mirror articles.docx",
    "Obsidian Mirror August articles.docx",
    "Obsidian Mirror September Articles.docx",
    "Obsidian Mirror October Articles.docx",
    "Obsidian Mirror November Articles.docx",
    "December Obsidian Mirror articles.docx",
]

for docname in monthly_docs:
    filepath = os.path.join(DOCS_DIR, docname)
    if not os.path.exists(filepath):
        print(f"MISSING: {docname}")
        continue
    
    doc = docx.Document(filepath)
    
    print(f"\n{'='*80}")
    print(f"FILE: {docname}")
    print(f"{'='*80}")
    
    # Print first 100 paragraphs to understand structure
    for i, para in enumerate(doc.paragraphs[:150]):
        text = para.text.strip()
        if text:
            style = para.style.name if para.style else "None"
            # Check if it looks like a title (bold, heading, etc.)
            is_bold = any(run.bold for run in para.runs if run.bold)
            prefix = f"[{style}]"
            if is_bold:
                prefix += "[BOLD]"
            print(f"  {i:3d}: {prefix} {text[:120]}")
