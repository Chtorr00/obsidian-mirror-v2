import pypdf

def main():
    pdf_path = r"C:\Users\markj\OneDrive\Documents\AI\ObsidianMirror\s41598-026-57582-3_reference.pdf"
    reader = pypdf.PdfReader(pdf_path)
    print(f"Number of pages: {len(reader.pages)}")
    
    # Extract metadata
    meta = reader.metadata
    print("Metadata:")
    for k, v in meta.items():
        print(f"  {k}: {v}")
        
    # Extract text from first 2 pages
    text = ""
    for i in range(min(5, len(reader.pages))):
        text += f"\n--- PAGE {i+1} ---\n"
        text += reader.pages[i].extract_text()
        
    print("\nFirst part of text:")
    print(text[:2000])

if __name__ == "__main__":
    main()
