import json

# Load Glossary
with open("lib/glossary.json", "r", encoding="utf-8") as f:
    glossary = json.load(f)

# Load existing data.ts
with open("lib/data.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

# find where "articles": [ is and where it ends
# Actually, it's easier to just rebuild the export part.
# But data.ts is huge, so I'll just read the JSON part, modify it, and write it back.

raw = "".join(lines)
json_raw = raw.replace("export const SYNO_DATA = ", "").strip().rstrip(";")
data = json.loads(json_raw)

# Add glossary to the data object
data["glossary"] = glossary

# Write back
output_json = json.dumps(data, indent=2, ensure_ascii=False)
output_ts = f"export const SYNO_DATA = {output_json};\n"

with open("lib/data.ts", "w", encoding="utf-8") as f:
    f.write(output_ts)

print("Added glossary to lib/data.ts")
