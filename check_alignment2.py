import re
import json

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
            current_title = None # reset for next article
            
    with open('alignments.md', 'w', encoding='utf-8') as f:
        for a in articles:
            f.write(f"- **{a['title']}**: {a['image']}\n")

if __name__ == '__main__':
    main()
