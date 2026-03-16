import json
import os
import re

with open('lib/data.ts', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export const SYNO_DATA = (\{.*\});?', text, re.DOTALL)
data = json.loads(match.group(1))

mapped_images = set(
    os.path.basename(a['image'])
    for a in data['articles']
    if a.get('image') and a['image'] != '/images/FinalFantasy.jpg'
)

images_dir = r"public/images"
available_images = set(
    img for img in os.listdir(images_dir)
    if img.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
)

unmapped = available_images - mapped_images
print("Unmapped images:")
for img in sorted(unmapped):
    print(" - " + img)
