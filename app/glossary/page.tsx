
'use client';

import { getGlossaryTerms } from '@/lib/glossary';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function GlossaryPage() {
  const terms = getGlossaryTerms();
  const [search, setSearch] = useState('');

  const filteredTerms = useMemo(() => {
    return terms.filter(t => 
      t.term.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, terms]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-6 text-primary font-mono text-sm tracking-widest">
          <BookOpen size={18} />
          <span>TERMINOLOGY DATABASE</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tighter mb-8 italic uppercase">
          Glossary
        </h1>
        <p className="max-w-2xl text-muted-foreground text-lg leading-relaxed">
          A comprehensive database of specialized terms, concepts, and entities identified across the archival artifacts.
          Each term is cross-referenced with related research papers and situational reports.
        </p>
      </header>

      <div className="mb-12 relative">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground/50" />
        </div>
        <input 
          type="text"
          placeholder="SEARCH TERMS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-secondary/20 border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-white font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((term, index) => (
          <motion.div
            key={term.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Link 
              href={`/glossary/${term.slug}`}
              className="group block p-8 rounded-2xl bg-secondary/10 border border-white/5 hover:border-primary/30 transition-all duration-500 hover:bg-secondary/20 h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono text-muted-foreground tracking-[0.2em] uppercase">
                  {term.backlinks.length} REFERENCES
                </span>
                <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                {term.term}
              </h3>
              <div className="mt-4 flex gap-1">
                {term.backlinks.slice(0, 3).map((article, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-primary/20 group-hover:bg-primary/50 transition-colors" />
                ))}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
          <p className="text-muted-foreground font-mono italic">NO MATCHING TERMS FOUND IN CORE DATABASE</p>
        </div>
      )}
    </div>
  );
}
