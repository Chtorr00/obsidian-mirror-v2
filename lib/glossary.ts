
import { SYNO_DATA } from './data';
import { Article } from './types';

export interface GlossaryTerm {
  term: string;
  slug: string;
  backlinks: Article[];
}

export function getGlossaryTerms(): GlossaryTerm[] {
  const articles = SYNO_DATA.articles as unknown as Article[];
  const termsMap = new Map<string, Article[]>();

  const linkRegex = /\[\[(.*?)\]\]/g;

  articles.forEach((article) => {
    const matches = article.body.matchAll(linkRegex);
    for (const match of matches) {
      const term = match[1];
      if (!termsMap.has(term)) {
        termsMap.set(term, []);
      }
      if (!termsMap.get(term)?.some(a => a.filename === article.filename)) {
        termsMap.get(term)?.push(article);
      }
    }
  });

  return Array.from(termsMap.entries()).map(([term, backlinks]) => ({
    term,
    slug: term.toLowerCase().replace(/\s+/g, '-'),
    backlinks
  })).sort((a, b) => a.term.localeCompare(b.term));
}

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  const terms = getGlossaryTerms();
  return terms.find(t => t.slug === slug);
}
