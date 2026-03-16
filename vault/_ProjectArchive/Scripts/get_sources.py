import os
import re

missing = [
    "The Final Verdict",
    "The Final, Sane Prescription",
    "The Final, Sane Diagnosis",
    "The Final Poll",
    "The Final Polite Request",
    "The Final Philosophy of a Dying Age",
    "The Final Ghost of a Dead Idea",
    "The Final Fantasy",
    "The Final Calculation",
    "The Final Calculation Before the Flood"
]

article_dir = r"c:\Users\markj\OneDrive\Documents\Antigravity\general\projects\dev-projects\projects\obsidian-mirror\01_Articles"

for m in missing:
    fileName = re.sub(r'[^a-zA-Z0-9]+', '-', m.lower()).strip('-') + ".md"
    path = os.path.join(article_dir, fileName)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            source = re.search(r'source:\s*(.*)', content)
            print(f"{m} -> {source.group(1).strip() if source else 'Unknown'}")
    else:
        print(f"{m} -> File not found: {fileName}")
