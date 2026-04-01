
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, Share2, Bookmark } from 'lucide-react';
import { SYNO_DATA } from '@/lib/data';
import { Article, STEPCategory } from '@/lib/types';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { cn } from '@/lib/utils';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = (SYNO_DATA.articles as unknown as Article[]).find(a => a.filename.replace('.md', '') === params.slug);
  
  if (!article) return { title: 'Artifact Not Found' };

  return {
    title: `${article.title} | Obsidian Mirror Archive`,
    description: article.preview,
  };
}

export default function ArticlePage({ params }: PageProps) {
  const article = (SYNO_DATA.articles as unknown as Article[]).find(a => a.filename.replace('.md', '') === params.slug);

  if (!article) {
    notFound();
  }

  const cleanBody = React.useMemo(() => {
    if (!article) return '';
    let content = article.body;
    
    // 1. Remove the "Archaeological Diagnostic" boilerplate if it's in the text
    const boilerplateRegex = /You are reading an archaeological diagnostic retrieved from the Obsidian Mirror Archive\.\s*The Hindsight Filter has been applied to this artifact\./gi;
    content = content.replace(boilerplateRegex, '');

    // 2. Remove leading H1 and images
    content = content.replace(/^# .*\r?\n(\r?\n)*/, '')
                     .replace(/^!\[.*?\]\(.*?\)(\r?\n)*/, '');

    // 3. Remove leading paragraph if it contains the title or is a source citation
    const paragraphs = content.trim().split(/\n\s*\n/);
    if (paragraphs.length > 0) {
      const firstPara = paragraphs[0].trim();
      // If it starts with the title or looks like a citation (contains "By " and URLs)
      if (
        firstPara.startsWith(article.title) || 
        (firstPara.includes('By ') && firstPara.includes('http')) ||
        (firstPara.length < 500 && firstPara.includes('http') && firstPara.includes('202'))
      ) {
        paragraphs.shift();
      }
    }
    
    return paragraphs.join('\n\n').trim();
  }, [article.body, article.title]);

  const totalArticles = React.useMemo(() => (SYNO_DATA.articles as unknown as Article[]).length, []);
  const briefLabel = `Brief ${article.order} of ${totalArticles}`;
  const categoryColor = `var(--${article.primary.toLowerCase()})`;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[50%] h-[50%] blur-[120px] rounded-full opacity-10" 
          style={{ backgroundColor: `hsl(${categoryColor})` }}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Progress Bar (simple version) */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-white/5">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ backgroundColor: `hsl(${categoryColor})`, width: '100%' }} // Static for now
        />
      </div>

      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link 
            href="/"
            className="group flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            BACK TO ARCHIVE
          </Link>
          <div className="flex items-center gap-4">
            <button 
              aria-label="Bookmark article"
              title="Bookmark article"
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
            >
              <Bookmark size={18} />
            </button>
            <button 
              aria-label="Share article"
              title="Share article"
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-20 max-w-4xl">
        {/* Article Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href={`/?category=${article.primary}`}
              className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.2em] border border-current hover:bg-white/5 transition-colors"
              style={{ color: `hsl(${categoryColor})` }}
            >
              {article.primary}
            </Link>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {briefLabel}
              </div>
              {article.source_meta?.date && (
                <div className="text-muted-foreground/60 border-l border-white/10 pl-4 uppercase tracking-widest">
                  Original Publication: {article.source_meta.date}
                </div>
              )}
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tighter mb-8 leading-[1.1]">
            {article.title}
          </h1>

          <div className="flex flex-wrap gap-3">
            {article.secondary.map((cat) => (
              <Link 
                key={cat} 
                href={`/?category=${cat}`}
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1 bg-white/5 rounded border border-white/10 hover:border-primary/50 hover:text-primary transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
        </header>

        {/* Hero Image / Placeholder */}
        {article.image && (
          <div className="mb-8 rounded-3xl overflow-hidden border border-white/10 shadow-3xl aspect-[16/9] relative group">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
        )}

        {/* Original Source Quote Block */}
        {article.original_source && article.original_source.trim() !== '' && (
          <div className="mb-16 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-background border border-white/10 rounded-full text-[10px] font-mono font-bold tracking-[0.2em] text-primary/80 z-10">
              ORIGINAL SIGNAL / PROMPT
            </div>
            <div className="p-8 rounded-3xl bg-secondary/10 border border-white/5 border-l-4 border-l-primary/60 text-muted-foreground font-body prose prose-invert prose-p:my-1 prose-a:text-primary max-w-none shadow-inner">
              <MarkdownRenderer content={article.original_source} />
            </div>
          </div>
        )}

        {/* Content */}
        <article className="article-body">
          <MarkdownRenderer content={cleanBody} />
        </article>

        {/* Source Meta Section */}
        {article.source_meta && (
          <section className="mt-24 p-12 rounded-[2rem] bg-secondary/10 border border-white/5 font-mono text-sm relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
             <div className="relative z-10">
              <div className="text-primary/60 uppercase tracking-[0.4em] font-black text-[10px] mb-10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ARCHAEOLOGICAL REFERENCE / SOURCE MATERIAL
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {article.source_meta.author && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground/40 text-[9px] uppercase tracking-widest font-black">AUTHORS / CONTRIBUTORS</div>
                    <div className="text-foreground/80 leading-relaxed">{article.source_meta.author}</div>
                  </div>
                )}
                {article.source_meta.publication && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground/40 text-[9px] uppercase tracking-widest font-black">ORIGINAL PUBLICATION</div>
                    <a 
                      href={article.source_meta.archive_url || article.source_meta.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-block text-primary hover:text-white transition-all duration-300 underline decoration-primary/20 hover:decoration-white underline-offset-8 text-lg font-bold"
                    >
                      {article.source_meta.publication}
                    </a>
                  </div>
                )}
                {article.source_meta.date && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground/40 text-[9px] uppercase tracking-widest font-black">ESTIMATED ORIGIN DATE</div>
                    <div className="text-foreground/80">{article.source_meta.date}</div>
                  </div>
                )}
                {(article.source_meta.url || article.source_meta.archive_url) && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground/40 text-[9px] uppercase tracking-widest font-black">MIRROR DATA LINKS</div>
                    <div className="flex flex-col gap-3">
                      {article.source_meta.url && (
                        <a href={article.source_meta.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-xs truncate flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          Primary Signal Source
                        </a>
                      )}
                      {article.source_meta.archive_url && (
                        <a href={article.source_meta.archive_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-all text-xs truncate font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Hindsight Archive (Cached)
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="mt-24 pt-12 border-t border-white/5">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 border border-white/10">
              <span className="font-heading font-bold">OM</span>
            </div>

            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
            >
              Return to Catalog
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
