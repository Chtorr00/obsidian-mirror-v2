import json
import re
import os
import difflib

# Load data.ts
data_ts_path = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\lib\data.ts"
with open(data_ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', content, re.DOTALL)
dataStr = match.group(1)
data = json.loads(dataStr)

images_dir = r"C:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\public\images"
available_images = [img for img in os.listdir(images_dir) if img.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

def get_best_match(title, images):
    title_clean = re.sub(r'[^a-zA-Z0-9]', '', title).lower()
    
    best_img = None
    best_ratio = 0
    for img in images:
        img_name = os.path.splitext(img)[0]
        img_clean = re.sub(r'^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|aug|sept|oct|nov|dec)\d*', '', img_name, flags=re.IGNORECASE)
        img_clean = re.sub(r'[^a-zA-Z0-9]', '', img_clean).lower()
        
        ratio = difflib.SequenceMatcher(None, title_clean, img_clean).ratio()
        
        title_tokens = set(re.findall(r'[a-zA-Z0-9]{3,}', title.lower()))
        img_tokens = set(re.findall(r'[a-zA-Z0-9]{3,}', img_name.lower()))
        overlap = len(title_tokens.intersection(img_tokens))
        
        score = ratio + (overlap * 0.5)
        
        if score > best_ratio:
            best_ratio = score
            best_img = img
            
    return best_img, best_ratio

for article in data['articles']:
    if article.get('image') == '/images/FinalFantasy.jpg':
        title = article['title']
        best_img, ratio = get_best_match(title, available_images)
        if best_img and ratio > 0.3:
            print(f"Matched '{title}' to '{best_img}' (Score: {ratio:.2f})")
            old_image = article['image']
            article['image'] = f"/images/{best_img}"
            if 'preview' in article:
                article['preview'] = article['preview'].replace(old_image, article['image'])
            if 'body' in article:
                article['body'] = article['body'].replace(old_image, article['image'])
        else:
            print(f"NO MATCH FOR: '{title}' (Best was {best_img} with score {ratio:.2f})")

with open(data_ts_path, 'w', encoding='utf-8') as f:
    f.write("export const SYNO_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";")
