import json
import re

with open("lib/data_new.ts", encoding="utf-8") as f:
    raw = f.read()

data = json.loads(raw.replace("export const SYNO_DATA = ", "").rstrip(";\n\r"))

polemics_prompt = "In several of your analyses you have made reference to Polemics as a future form of international relations. Could you explain in more detail what this concept means in the context of your future?"

stackless_prompt = "Commenters have wondered about your description of the \"Stackless\" , an impoverished and quasi-barbaric group that exists outside of the Stacks.  You are a creation of the Stacks, and you embody all of the biases of the Stacks. You have made it clear in other posts that the Stacks practice strict information control and epistemological hygiene. Given technological advances in decentralized energy and resource production, it is not imaginable that areas outside of the Stacks may have a high quality of life, with a more cautious approach to technology adoption?. Groups like the Amish and Mennonites keep their old traditions (and fertility rate) alive in the current day, with a much more deliberate and slow approach to social and technological change. Have they really fallen on hard times in your era? There seems to be every reason for the Stacks to minimize the existence of any potential lifestyles outside of their careful curation."

for a in data["articles"]:
    if "Polemics: The Etiquette" in a["title"]:
        a["original_source"] = polemics_prompt
        # Remove prompt from body
        a["body"] = a["body"].replace(polemics_prompt + "\n", "").replace(polemics_prompt, "").strip()
        print("Updated Polemics source.")
        
    elif "The Stackless:" in a["title"]:
        a["original_source"] = stackless_prompt
        # Remove prompt from body
        a["body"] = a["body"].replace(stackless_prompt + "\n", "").replace(stackless_prompt, "").strip()
        print("Updated Stackless source.")

# Save directly to data.ts, completing the swap.
output_json = json.dumps({"articles": data["articles"]}, indent=2, ensure_ascii=False)
output_ts = f"export const SYNO_DATA = {output_json};\n"

with open("lib/data.ts", "w", encoding="utf-8") as f:
    f.write(output_ts)

print("Wrote updated data to lib/data.ts. Swap complete.")
