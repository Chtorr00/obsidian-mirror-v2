import re
from collections import defaultdict

def main():
    with open('lib/data.ts', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    articles = []
    current_title = None
    
    for line in lines:
        title_match = re.search(r'"title":\s*"([^"]+)"', line)
        image_match = re.search(r'"image":\s*"([^"]+)"', line)
        
        if title_match:
            current_title = title_match.group(1)
        elif image_match and current_title:
            articles.append({
                'title': current_title,
                'image': image_match.group(1).split('/')[-1]
            })
            current_title = None
            
    # Group by image
    image_to_titles = defaultdict(list)
    for a in articles:
        image_to_titles[a['image']].append(a['title'])

    with open('duplicated_images.md', 'w', encoding='utf-8') as f:
        f.write("# Images assigned to multiple articles:\n\n")
        has_dupes = False
        for img, titles in image_to_titles.items():
            if len(titles) > 1:
                has_dupes = True
                f.write(f"### {img}\n")
                for t in titles:
                    f.write(f"- {t}\n")
                f.write("\n")
                
        if not has_dupes:
            f.write("No duplicated images found.\n")

if __name__ == '__main__':
    main()
