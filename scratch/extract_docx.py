import docx
import os

def main():
    docx_path = r"C:\Users\markj\OneDrive\Documents\AI\ObsidianMirror\Constraining Colossus_ Obsidian Mirror Series.docx"
    doc = docx.Document(docx_path)
    
    paragraphs = []
    for p in doc.paragraphs:
        paragraphs.append(p.text)
        
    full_text = "\n".join(paragraphs)
    
    # Save as md in AI workspace
    out_path = r"C:\Users\markj\OneDrive\Documents\AI\ObsidianMirror\Constraining Colossus_ Obsidian Mirror Series.md"
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(full_text)
        
    print(f"Extracted {len(paragraphs)} paragraphs to {out_path}")
    print("Preview of first 1000 characters:")
    print(full_text[:1000])

if __name__ == "__main__":
    main()
