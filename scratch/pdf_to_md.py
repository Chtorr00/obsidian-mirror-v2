import pypdf
import os

def main():
    pdf_path = r"C:\Users\markj\OneDrive\Documents\AI\ObsidianMirror\s41598-026-57582-3_reference.pdf"
    intake_dir = r"C:\Users\markj\OneDrive\Documents\ObsidianArchive\Obsidian Mirror Intake"
    out_path = os.path.join(intake_dir, "falling-fertility-on-the-left.md")
    
    print(f"Reading PDF from {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    
    text_content = []
    
    # Add citation block at the beginning
    text_content.append("# Falling fertility on the left as key driver of US birth decline\n")
    text_content.append("*Falling fertility on the left as key driver of US birth decline*, By Martin Fieder & Susanne Huber,")
    text_content.append("Scientific Reports, June 8, 2026")
    text_content.append("https://doi.org/10.1038/s41598-026-57582-3\n")
    text_content.append("---\n")
    
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            text_content.append(f"\n## PAGE {i+1}\n")
            text_content.append(page_text)
            
    print(f"Writing markdown to {out_path}...")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(text_content))
    print("Done!")

if __name__ == "__main__":
    main()
