
'use client';

import { useParams, useRouter } from 'next/navigation';
import { getTermBySlug } from '@/lib/glossary';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Quote } from 'lucide-react';
import Link from 'next/link';
import { SYNO_DATA } from '@/lib/data';
import { Article } from '@/lib/types';

export default function TermPage() {
  const { slug } = useParams();
  const router = useRouter();
  const term = getTermBySlug(slug as string);

  if (!term) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-4xl font-heading font-black text-white mb-4">UNK</h1>
        <p className="text-muted-foreground font-mono uppercase">Unknown Concept Identified</p>
        <button 
          onClick={() => router.push('/glossary')}
          className="mt-8 text-primary font-mono hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} /> RETURN TO GLOSSARY
        </button>
      </div>
    );
  }

  const getContextSnippet = (body: string, termText: string) => {
    const termRegex = new RegExp(`\\[\\[${termText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'i');
    const match = body.match(termRegex);
    if (!match || match.index === undefined) return '';

    const start = Math.max(0, match.index - 150);
    const end = Math.min(body.length, match.index + match[0].length + 150);
    let snippet = body.slice(start, end);
    
    // Clean up markdown
    snippet = snippet.replace(/#+\s/g, '').replace(/\!\[.*\]\(.*\)/g, '');
    
    return (start > 0 ? '...' : '') + snippet.trim() + (end < body.length ? '...' : '');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-24">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/glossary')}
        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm mb-12"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        RETURN TO GLOSSARY
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <BookOpen size={24} />
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tighter mb-4 uppercase italic">
              {term.term}
            </h1>
            <div className="h-1 w-24 bg-primary/30 rounded-full" />
          </motion.header>

          <section className="mb-16">
            <h2 className="text-sm font-mono text-muted-foreground tracking-[0.3em] uppercase mb-8 border-b border-white/5 pb-4">
              Contextual Occurrences
            </h2>
            <div className="space-y-6">
              {term.backlinks.map((article, index) => (
                <motion.div
                  key={article.filename}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    href={`/archive/${article.filename.replace('.md', '')}`}
                    className="group block p-8 rounded-2xl bg-secondary/10 border border-white/5 hover:border-white/20 transition-all hover:bg-secondary/20"
                  >
                    <div className="flex items-center gap-3 mb-4 text-xs font-mono text-primary uppercase tracking-widest">
                      <span className="opacity-50">[{article.primary}]</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-4 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-start gap-4">
                      <Quote size={16} className="text-primary/40 shrink-0 mt-1" />
                      <p className="text-muted-foreground text-sm leading-relaxed italic line-clamp-6">
                        {getContextSnippet(article.body, term.term)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <div className="p-8 rounded-3xl bg-secondary/5 border border-white/5">
              <h3 className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-4">Backlink Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-xs text-muted-foreground/50">Total References</span>
                  <span className="text-2xl font-heading font-black text-primary">{term.backlinks.length}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-xs text-muted-foreground/50">Unique Sources</span>
                  <span className="text-2xl font-heading font-black text-primary">{new Set(term.backlinks.map(a => a.primary)).size}</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
              <h3 className="text-[10px] font-mono text-primary tracking-widest uppercase mb-4 italic">Analytical Note</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-body">
                This concept is intrinsically linked across multiple archival layers. The frequent recurrence suggests a structural pillar within the observed timeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
