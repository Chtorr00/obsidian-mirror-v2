import os

def check_dir(d):
    invalid = []
    for f in os.listdir(d):
        if f.endswith('.md'):
            with open(os.path.join(d, f), 'r', encoding='utf-8') as file:
                content = file.read()
                if not content.strip().startswith('---'):
                    invalid.append(f)
    return invalid

print("Articles:", len(check_dir("content/sources/articles")))
print("Glossary:", len(check_dir("content/sources/glossary")))
for f in check_dir("content/sources/glossary"):
    print(f"  - {f}")
