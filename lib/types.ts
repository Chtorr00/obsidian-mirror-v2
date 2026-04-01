
export type STEPCategory = 'Social' | 'Technological' | 'Economic' | 'Political';

export interface Article {
  title: string;
  filename: string;
  primary: STEPCategory;
  secondary: STEPCategory[];
  image: string;
  preview: string;
  body: string;
  mtime: number;
  original_source?: string;
  source_meta?: {
    url?: string;
    archive_url?: string;
    title?: string;
    date?: string;
    author?: string;
    publication?: string;
  };
  order?: number;
  glossary_refs?: string[];
}

export interface GlossaryEntry {
  term: string;
  years: string;
  description: string;
}

export interface TagMatrix {
  [key: string]: {
    [key: string]: string[];
  };
}
