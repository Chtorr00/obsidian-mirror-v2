import os

articles_dir = "content/sources/articles"
count = 0

for f in os.listdir(articles_dir):
    if not f.endswith('.md'):
        continue
        
    path = os.path.join(articles_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
        
    if content.strip().startswith('title:'):
        print(f"Processing: {f}")
        lines = content.splitlines()
        header_index = -1
        for i, line in enumerate(lines):
            if line.startswith('#'):
                header_index = i
                break
        
        if header_index != -1:
            print(f"  Found header at line {header_index}: {lines[header_index]}")
            # Reconstruct
            new_lines = ['---'] + lines[:header_index]
            # Clean up trailing empty lines in frontmatter
            while new_lines and new_lines[-1].strip() == "":
                new_lines.pop()
            new_lines.append('---')
            new_lines.append("")
            new_lines.extend(lines[header_index:])
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write("\n".join(new_lines))
            print(f"  SUCCESS: Fixed {f}")
            count += 1
        else:
            print(f"  ERROR: No header found in {f}")

print(f"Total files fixed: {count}")
