import json

with open("lib/data_new.ts", encoding="utf-8") as f:
    raw = f.read()

data = json.loads(raw.replace("export const SYNO_DATA = ", "").rstrip(";\n\r"))

with open("two_articles.txt", "w", encoding="utf-8") as out:
    for a in data["articles"]:
        if "Polemics" in a["title"] or "Stackless" in a["title"]:
            out.write("=" * 60 + "\n")
            out.write("TITLE: " + a["title"] + "\n")
            out.write("SOURCE: " + str(a.get("original_source", "NONE")) + "\n")
            out.write("BODY (first 1200 chars):\n")
            out.write(a["body"][:1200] + "\n\n")
