import docx
import os

# Preview glossary structure
for fname in ["Obsidian Mirror Glossary.docx", "Obsidian Mirror Glossary 2.docx", "Obsidian Mirror v1 Concept Glossary.docx"]:
    filepath = os.path.join("om_docs", "Obsidian Mirror", fname)
    doc = docx.Document(filepath)
    print(f"\n{'='*60}")
    print(f"FILE: {fname} ({os.path.getsize(filepath)} bytes)")
    print(f"{'='*60}")
    for i, para in enumerate(doc.paragraphs[:60]):
        text = para.text.strip()
        if text:
            style = para.style.name if para.style else "None"
            is_bold = any(run.bold for run in para.runs if run.bold)
            prefix = f"[{style}]"
            if is_bold:
                prefix += "[BOLD]"
            print(f"  {i:3d}: {prefix} {text[:120]}")
