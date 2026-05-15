import os

# Folders to fix
folders = [
    r"content/sources/articles",
    r"C:\Users\markj\OneDrive\Documents\ObsidianArchive\Mirror\2026\Weblog-Sources\articles"
]

total_fixed = 0

for articles_dir in folders:
    if not os.path.exists(articles_dir):
        print(f"Skipping non-existent folder: {articles_dir}")
        continue
        
    print(f"Scanning: {articles_dir}")
    count = 0
    for f in os.listdir(articles_dir):
        if not f.endswith('.md'):
            continue
            
        path = os.path.join(articles_dir, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        if content.strip().startswith('title:'):
            lines = content.splitlines()
            header_index = -1
            for i, line in enumerate(lines):
                if line.startswith('#'):
                    header_index = i
                    break
            
            if header_index != -1:
                # Reconstruct
                new_lines = ['---'] + lines[:header_index]
                while new_lines and new_lines[-1].strip() == "":
                    new_lines.pop()
                new_lines.append('---')
                new_lines.append("")
                new_lines.extend(lines[header_index:])
                
                with open(path, 'w', encoding='utf-8') as file:
                    file.write("\n".join(new_lines))
                count += 1
                total_fixed += 1
    print(f"  Fixed {count} files in {articles_dir}")

print(f"Done. Total fixed across all folders: {total_fixed}")
