
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

  const categoryColor = `var(--${article.primary.toLowerCase()})`;
  const dateStr = new Date(article.mtime * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Clean the body: remove the duplicate H1 and hero image if they exist at the start
  const cleanBody = article.body
    .replace(/^# .*\r?\n(\r?\n)*/, '') // Remove leading H1 and following blank lines
    .replace(/^!\[.*?\]\(.*?\)(\r?\n)*/, '') // Remove leading image and following blank lines
    .trim();

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
            <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
              <Bookmark size={18} />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-20 max-w-4xl">
        {/* Article Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div 
              className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.2em] border border-current"
              style={{ color: `hsl(${categoryColor})` }}
            >
              {article.primary}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Calendar size={14} />
              {dateStr}
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tighter mb-8 leading-[1.1]">
            {article.title}
          </h1>

          <div className="flex flex-wrap gap-3">
            {article.secondary.map((cat) => (
              <span 
                key={cat} 
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1 bg-white/5 rounded border border-white/10"
              >
                {cat}
              </span>
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
        <article className="prose-p:mb-10">
          <MarkdownRenderer content={cleanBody} />
        </article>

        <footer className="mt-24 pt-12 border-t border-white/5">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 border border-white/10">
              <span className="font-heading font-bold">OM</span>
            </div>
            <p className="text-sm text-muted-foreground font-body max-w-sm mb-8">
              You are reading an archaeological diagnostic retrieved from the Obsidian Mirror Archive. 
              The Hindsight Filter has been applied to this artifact.
            </p>
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
