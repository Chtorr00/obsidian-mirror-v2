import os

articles_dir = "content/sources/articles"
count = 0

for f in os.listdir(articles_dir):
    if not f.endswith('.md'):
        continue
        
    path = os.path.join(articles_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
        
    # Check if it starts with 'title:' instead of '---'
    if content.strip().startswith('title:'):
        lines = content.splitlines()
        # Find where frontmatter ends (usually before the first ### or # header)
        header_index = -1
        for i, line in enumerate(lines):
            if line.startswith('#') or line.startswith('###'):
                header_index = i
                break
        
        if header_index != -1:
            # Reconstruct with delimiters
            new_lines = ['---'] + lines[:header_index]
            # Ensure there is a blank line before the header
            if new_lines[-1].strip() != "":
                new_lines.append("")
            new_lines.append('---')
            new_lines.append("")
            new_lines.extend(lines[header_index:])
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write("\n".join(new_lines))
            print(f"Fixed: {f}")
            count += 1

print(f"Total files fixed: {count}")
