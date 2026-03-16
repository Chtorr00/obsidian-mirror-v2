
import json
import re

with open('C:/Users/markj/OneDrive/Documents/Antigravity/general/projects/dev-projects/web/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the SYNO_DATA object contents
# data.js starts with "const SYNO_DATA = "
match = re.search(r'const SYNO_DATA = (\{.*\});', content, re.DOTALL)
if match:
    data_str = match.group(1)
    # The JSON in data.js might have trailing commas or other non-standard things if it was hand-edited,
    # but usually it's standard-ish. Let's try to parse it.
    # Actually, it's easier to just write it out as a .ts file with an export.
    with open('C:/Users/markj/OneDrive/Documents/Antigravity/general/projects/obsidian-mirror-v2/lib/data.ts', 'w', encoding='utf-8') as out:
        out.write("export const SYNO_DATA = ")
        out.write(data_str)
        out.write(";")
else:
    print("Could not find SYNO_DATA in data.js")
