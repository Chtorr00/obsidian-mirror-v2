import json
import re
import os

images_dir = 'public/images'
available_images = [img for img in os.listdir(images_dir) if img.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

# Load data.ts
data_ts_path = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\lib\data.ts"
with open(data_ts_path, 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

mapped_images = set(
    os.path.basename(a['image'])
    for a in data['articles']
    if a.get('image') and not a['title'].startswith('The Final')
)

unmapped = list(set(available_images) - mapped_images)

print("Let's try to find matches strictly within unmapped images for the 'Final' articles:")

import difflib

titles = [
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

for title in titles:
    title_clean = re.sub(r'[^a-zA-Z0-9]', '', title).lower()
    title_tokens = set(re.findall(r'[a-zA-Z0-9]{3,}', title.lower()))
    
    best_img = None
    best_score = 0
    for img in unmapped:
        img_name = os.path.splitext(img)[0]
        img_clean = re.sub(r'^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|aug|sept|oct|nov|dec)\d*', '', img_name, flags=re.IGNORECASE)
        img_clean = re.sub(r'[^a-zA-Z0-9]', '', img_clean).lower()
        
        ratio = difflib.SequenceMatcher(None, title_clean, img_clean).ratio()
        
        img_tokens = set(re.findall(r'[a-zA-Z0-9]{3,}', img_name.lower()))
        overlap = len(title_tokens.intersection(img_tokens))
        
        score = ratio + (overlap * 1.5) # heavy weight on word overlap
        
        # specific manual heuristics
        if "Polite" in title and "PleaForPolite" in img:
            score += 10
        if "Ghost" in title and "Ghost" in img:
            score += 10
        if "Diagnosis" in title and "Diagnosis" in img:
            score += 10
        if "Fantasy" in title and "Fantasy" in img:
            score += 10
        if "Calculation" in title and "Audit" in img:
            score += 2
        
        if score > best_score:
            best_score = score
            best_img = img

    if "Final Fantasy" in title:
        best_img = "FinalFantasy.jpg"
        best_score = 100
        
    print(f"'{title}' -> {best_img} (Score: {best_score:.2f})")
    
    if best_img:
        for article in data['articles']:
            if article['title'] == title:
                old_img = article.get('image', '/images/FinalFantasy.jpg')
                new_img = f"/images/{best_img}"
                article['image'] = new_img
                if 'preview' in article:
                    article['preview'] = article['preview'].replace(old_img, new_img)
                if 'body' in article:
                    article['body'] = article['body'].replace(old_img, new_img)

with open(data_ts_path, 'w', encoding='utf-8') as f:
    f.write("export const SYNO_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";\n")
