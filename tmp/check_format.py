import os
articles_dir = "content/sources/articles"
count = 0
for f in os.listdir(articles_dir):
    if f.endswith('.md'):
        with open(os.path.join(articles_dir, f), 'r', encoding='utf-8') as file:
            content = file.read()
            parts = content.split('---')
            if len(parts) < 3:
                count += 1
                print(f"Invalid format: {f}")
print(f"Total invalid: {count}")
