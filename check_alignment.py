import re
import json

def main():
    with open('lib/data.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # extract SYNO_DATA object string using regex because it's TypeScript
    # This is a bit tricky, let's just use regex to extract titles and images
    
    titles = re.findall(r'title:\s*"([^"]+)"', content)
    images = re.findall(r'image:\s*"([^"]+)"', content)

    # Note: because some titles or images might not be in the same order or some might be missing quotes,
    # let's write a parser

    articles = []
    
    article_blocks = content.split('filename:')[1:]
    for block in article_blocks:
        title_match = re.search(r'title:\s*"([^"]+)"', block)
        image_match = re.search(r'image:\s*"([^"]+)"', block)
        if title_match and image_match:
            articles.append({
                'title': title_match.group(1),
                'image': image_match.group(1).split('/')[-1]
            })

    # Print out obviously suspicious ones, or just write them to a markdown artifact
    
    with open('alignments.md', 'w') as f:
        for a in articles:
            f.write(f"- {a['title']} -> {a['image']}\n")

if __name__ == '__main__':
    main()
