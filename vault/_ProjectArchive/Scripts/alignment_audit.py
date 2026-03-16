import re
import os
import json

ARTICLES_DIR = r"c:\Users\markj\OneDrive\Documents\Antigravity\general\projects\dev-projects\projects\obsidian-mirror\01_Articles"
IMAGES_DIR = r"c:\Users\markj\OneDrive\Documents\Antigravity\general\projects\obsidian-mirror-v2\public\images"
DATA_FILE = r"lib/data.ts"

# Step 1: Parse all image filenames, extract month and day
month_names = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December',
               'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec']

month_normalize = {
    'january': 'January', 'jan': 'January',
    'february': 'February', 'feb': 'February',
    'march': 'March', 'mar': 'March',
    'april': 'April', 'apr': 'April',
    'may': 'May',
    'june': 'June', 'jun': 'June',
    'july': 'July', 'jul': 'July',
    'august': 'August', 'aug': 'August',
    'september': 'September', 'sep': 'September', 'sept': 'September',
    'october': 'October', 'oct': 'October',
    'november': 'November', 'nov': 'November',
    'december': 'December', 'dec': 'December',
}

def parse_image_filename(filename):
    """Extract month, day, and keyword from image filename like 'August14AIalienation.jpeg'"""
    # Try to match MonthDayKeyword pattern
    pattern = r'^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(\d{1,2})(.+)\.(png|jpeg|jpg)$'
    m = re.match(pattern, filename, re.IGNORECASE)
    if m:
        month_raw = m.group(1).lower()
        day = int(m.group(2))
        keyword = m.group(3)
        month = month_normalize.get(month_raw, month_raw.capitalize())
        return month, day, keyword
    return None, None, None

# Step 2: Group images by month, sorted by day
image_files = os.listdir(IMAGES_DIR)
images_by_month = {}
for img in image_files:
    month, day, keyword = parse_image_filename(img)
    if month:
        if month not in images_by_month:
            images_by_month[month] = []
        images_by_month[month].append({
            'filename': img,
            'day': day,
            'keyword': keyword
        })

for month in images_by_month:
    images_by_month[month].sort(key=lambda x: x['day'])

# Step 3: Read data.ts and extract article titles + current image assignments
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

articles = []
current = {}
for line in lines:
    title_match = re.search(r'"title":\s*"([^"]+)"', line)
    image_match = re.search(r'"image":\s*"([^"]+)"', line)
    filename_match = re.search(r'"filename":\s*"([^"]+)"', line)
    
    if title_match:
        current['title'] = title_match.group(1)
    elif filename_match:
        current['filename'] = filename_match.group(1)
    elif image_match and 'title' in current:
        current['image'] = image_match.group(1).split('/')[-1]
        articles.append(current)
        current = {}

# Step 4: Read markdown files to get the original_source and try to determine month
# Also check the articles_index.json for ordering
articles_index_path = r"c:\Users\markj\OneDrive\Documents\Antigravity\general\projects\dev-projects\projects\obsidian-mirror\articles_index.json"

article_metadata = {}
if os.path.exists(articles_index_path):
    with open(articles_index_path, 'r', encoding='utf-8') as f:
        index_data = json.load(f)
    for entry in index_data:
        article_metadata[entry.get('filename', '')] = entry

# Step 5: For each article, try to determine its month from its current image assignment
# Since the current image has a monthday prefix, we can extract the month
articles_by_month = {}
for a in articles:
    img_month, img_day, img_keyword = parse_image_filename(a['image'])
    if img_month:
        a['assigned_month'] = img_month
        a['assigned_day'] = img_day
        a['assigned_keyword'] = img_keyword
        if img_month not in articles_by_month:
            articles_by_month[img_month] = []
        articles_by_month[img_month].append(a)

# Sort articles within each month by their assigned day
for month in articles_by_month:
    articles_by_month[month].sort(key=lambda x: x.get('assigned_day', 0))

# Step 6: Build comparison table
output_lines = []
output_lines.append("# Article-Image Alignment Audit\n")
output_lines.append("For each month, articles are listed alongside images, both sorted by day.\n")
output_lines.append("**Match Confidence**: ✅ = keyword match, ⚠️ = no keyword match but same day slot, ❌ = duplicate image\n\n")

all_months = sorted(set(list(images_by_month.keys()) + list(articles_by_month.keys())),
                    key=lambda m: ['January','February','March','April','May','June','July','August','September','October','November','December'].index(m))

for month in all_months:
    imgs = images_by_month.get(month, [])
    arts = articles_by_month.get(month, [])
    
    output_lines.append(f"## {month}\n")
    output_lines.append(f"**Images**: {len(imgs)} | **Articles assigned to this month**: {len(arts)}\n\n")
    
    # Build table
    output_lines.append("| # | Image File (by day) | Day | Article Title | Current Image | Match? |")
    output_lines.append("|---|---------------------|-----|---------------|---------------|--------|")
    
    # Create a unified view: list all images for the month, and map articles
    # First, check which articles use which images
    img_to_articles = {}
    for a in arts:
        img = a['image']
        if img not in img_to_articles:
            img_to_articles[img] = []
        img_to_articles[img].append(a['title'])
    
    # List images and find their matching articles
    used_articles = set()
    for i, img in enumerate(imgs):
        # Find articles assigned to this image
        matching_arts = [a for a in arts if a['image'] == img['filename']]
        
        if matching_arts:
            for j, a in enumerate(matching_arts):
                # Check keyword match
                title_words = set(a['title'].lower().replace("'", '').replace(',', '').split())
                keyword_words = set(re.findall(r'[a-z]+', img['keyword'].lower()))
                has_match = bool(title_words & keyword_words)
                
                match_symbol = "✅" if has_match else "⚠️"
                if len(matching_arts) > 1 and j > 0:
                    match_symbol = "❌ DUP"
                    
                prefix = f"{i+1}" if j == 0 else ""
                img_name = img['filename'] if j == 0 else "↑ (same)"
                day = img['day'] if j == 0 else ""
                
                output_lines.append(f"| {prefix} | {img_name} | {day} | {a['title']} | {a['image']} | {match_symbol} |")
                used_articles.add(a['title'])
        else:
            output_lines.append(f"| {i+1} | {img['filename']} | {img['day']} | *UNMATCHED IMAGE* | — | ❌ |")
    
    # Any articles in this month not yet shown (assigned to images from other months?)
    unshown = [a for a in arts if a['title'] not in used_articles]
    for a in unshown:
        output_lines.append(f"| — | — | — | {a['title']} | {a['image']} | ⚠️ ORPHAN |")
    
    output_lines.append("\n")

with open('alignment_audit.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print(f"Done! Wrote alignment_audit.md")
print(f"Total articles: {len(articles)}")
print(f"Total images: {sum(len(v) for v in images_by_month.values())}")
for month in all_months:
    print(f"  {month}: {len(images_by_month.get(month, []))} images, {len(articles_by_month.get(month, []))} articles")
