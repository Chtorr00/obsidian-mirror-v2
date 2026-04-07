
'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STEPMatrix } from '@/components/sections/STEPMatrix';
import { SearchBar } from '@/components/sections/SearchBar';
import { ArticleCard } from '@/components/ui/ArticleCard';
import { SYNO_DATA } from '@/lib/data';
import { cn } from "@/lib/utils";
import { STEPCategory, Article, GlossaryEntry } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hexagon, Clock, SortAsc, BookOpen, Search, Filter, Calendar, ChevronRight, Quote } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useRef, useEffect } from 'react';

function ArchiveDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  
  // REAL DATA FROM DATA STORE
  const articles = useMemo(() => SYNO_DATA.articles as unknown as Article[], []);
  const glossary = useMemo(() => (SYNO_DATA as any).glossary as GlossaryEntry[], []);

  // Calculate term frequency for the 'Freq' sort
  const termFrequencies = useMemo(() => {
    const freqs: Record<string, number> = {};
    glossary.forEach(g => freqs[g.term] = 0);
    articles.forEach(a => {
      a.glossary_refs?.forEach(ref => {
        if (freqs[ref] !== undefined) freqs[ref]++;
      });
    });
    return freqs;
  }, [articles, glossary]);

  type LensMode = 'STEP' | 'GLOSSARY' | 'TIMELINE' | 'SEARCH';
  const [activeLens, setActiveLens] = useState<LensMode | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<STEPCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [glossarySort, setGlossarySort] = useState<'az' | 'freq'>('az');
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<GlossaryEntry | null>(null);
  const [selectedTimelineTerm, setSelectedTimelineTerm] = useState<GlossaryEntry | null>(null);
  const [glossaryViewMode, setGlossaryViewMode] = useState<'articles' | 'context'>('articles');

  const scrollToTop = () => {
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle navigation from URL search params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') as STEPCategory;
    const glossaryFromUrl = searchParams.get('glossary');
    const searchFromUrl = searchParams.get('search');
    const viewFromUrl = searchParams.get('view') as 'articles' | 'context';

    if (categoryFromUrl && ['Social', 'Technological', 'Economic', 'Political'].includes(categoryFromUrl)) {
      setActiveLens('STEP');
      setActiveCategory(categoryFromUrl);
      setSelectedGlossaryTerm(null);
      setSelectedTimelineTerm(null);
      scrollToTop();
    } else if (glossaryFromUrl) {
      setActiveLens('GLOSSARY');
      const term = glossary.find(g => g.term.toLowerCase() === glossaryFromUrl.toLowerCase());
      if (term) setSelectedGlossaryTerm(term);
      if (viewFromUrl) setGlossaryViewMode(viewFromUrl);
      scrollToTop();
    } else if (searchFromUrl) {
      setActiveLens('SEARCH');
      setSearchQuery(searchFromUrl);
      scrollToTop();
    }
  }, [searchParams, glossary]);

  const filteredArticles = useMemo(() => {
    let results = articles.filter((article) => {
      const matchesCategory = !activeCategory || article.primary === activeCategory;
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.preview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGlossary = !selectedGlossaryTerm || (article.glossary_refs && article.glossary_refs.includes(selectedGlossaryTerm.term));
      const matchesTimeline = !selectedTimelineTerm || (article.glossary_refs && article.glossary_refs.includes(selectedTimelineTerm.term));

      return matchesCategory && matchesSearch && matchesGlossary && matchesTimeline;
    });

    results = [...results].sort((a, b) => (b.order || 0) - (a.order || 0));

    return results;
  }, [activeCategory, searchQuery, selectedGlossaryTerm, selectedTimelineTerm, articles]);

  const getContextSnippet = (body: string, termText: string) => {
    const termRegex = new RegExp(`\\[\\[${termText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'i');
    const match = body.match(termRegex);
    if (!match || match.index === undefined) return '';

    const start = Math.max(0, match.index - 250);
    const end = Math.min(body.length, match.index + match[0].length + 250);
    let snippet = body.slice(start, end);
    
    // Clean up markdown
    snippet = snippet.replace(/#+\s/g, '').replace(/\!\[.*\]\(.*\)/g, '');
    
    // Bold the term (no link)
    snippet = snippet.replace(new RegExp(`\\[\\[(${termText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\]\\]`, 'gi'), '**$1**');
    
    return (start > 0 ? '...' : '') + snippet.trim() + (end < body.length ? '...' : '');
  };

  const handleCategorySelect = (category: STEPCategory) => {
    if (activeCategory === category) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
    }
  };

  const clearFilters = () => {
    setActiveLens(null);
    setActiveCategory(null);
    setSearchQuery('');
    setSelectedGlossaryTerm(null);
    setSelectedTimelineTerm(null);
    setGlossaryViewMode('articles');
    router.push('/');
  };

  return (
    <main className="h-[100dvh] bg-background text-foreground selection:bg-primary/20 overflow-hidden flex flex-col">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-social/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tech/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-political/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row overflow-hidden max-w-[1600px] mx-auto">
        {/* Left Column: Dashboard Controls */}
        <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 h-full overflow-y-auto custom-scrollbar px-6 lg:px-8 py-8 border-b lg:border-b-0 lg:border-r border-white/5 bg-background/40 backdrop-blur-xl z-20">
          <div className="flex flex-col gap-8 max-w-sm mx-auto lg:mx-0">
            {/* Header */}
            <header className="flex flex-col items-start text-left">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={clearFilters}
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                OBSIDIAN MIRROR
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm md:text-base text-muted-foreground font-body leading-relaxed mb-6 flex flex-col gap-1"
              >
                <span className="font-bold text-white/80">Projecting hindsight from 2100</span>
                <span>The black box flight recorder of a crashed civilization</span>
              </motion.div>
            </header>

            {/* LENS TABS */}
            <div className="flex bg-secondary/30 p-1 rounded-xl border border-white/5 font-mono text-[10px] tracking-widest uppercase">
              {(['TIMELINE', 'GLOSSARY', 'STEP', 'SEARCH'] as LensMode[]).map((lens) => (
                <button
                  key={lens}
                  onClick={() => {
                    setActiveLens(lens);
                    setActiveCategory(null);
                    setSearchQuery('');
                    setSelectedGlossaryTerm(null);
                    setSelectedTimelineTerm(null);
                    setGlossaryViewMode('articles');
                  }}
                  className={cn(
                    "flex-1 py-3 text-center rounded-lg transition-all",
                    activeLens === lens 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {lens}
                </button>
              ))}
            </div>

            {/* ------- LENS: SEARCH ------- */}
            {activeLens === 'SEARCH' && (
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full"
              >
                <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  <Search size={14} />
                  Text Search
                </div>
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                />
              </motion.section>
            )}

            {/* ------- LENS: STEP ------- */}
            {activeLens === 'STEP' && (
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    <Filter size={14} />
                    Scanning Categories
                  </h2>
                </div>
                <div className="w-full -mx-2">
                  <STEPMatrix 
                    activeCategory={activeCategory} 
                    onCategorySelect={handleCategorySelect} 
                  />
                </div>
              </motion.section>
            )}

            {/* ------- LENS: GLOSSARY ------- */}
            {activeLens === 'GLOSSARY' && (
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full flex-1 flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    <BookOpen size={14} />
                    Glossary Index
                  </h2>
                </div>
                <div className="flex gap-2 mb-4 text-xs font-mono">
                  <button 
                    onClick={() => {
                      setActiveLens('GLOSSARY');
                      setSelectedGlossaryTerm(null);
                      setGlossarySort('az');
                    }}
                    className={cn(
                      "flex-1 p-2 rounded transition-all flex items-center justify-center gap-2",
                      (glossarySort === 'az' && !selectedGlossaryTerm)
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/50 border-l-4 border-l-sky-400 font-bold" 
                        : "bg-secondary/20 border border-white/5 text-muted-foreground hover:bg-secondary/40"
                    )}
                  >
                    A-Z
                  </button>
                  <button 
                    onClick={() => {
                      setActiveLens('GLOSSARY');
                      setSelectedGlossaryTerm(null);
                      setGlossarySort('freq');
                    }}
                    className={cn(
                      "flex-1 p-2 rounded transition-all flex items-center justify-center gap-2",
                      (glossarySort === 'freq' && !selectedGlossaryTerm)
                        ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/50 border-l-4 border-l-fuchsia-400 font-bold" 
                        : "bg-secondary/20 border border-white/5 text-muted-foreground hover:bg-secondary/40"
                    )}
                  >
                    Freq
                  </button>
                </div>
              </motion.section>
            )}

            {/* ------- LENS: TIMELINE ------- */}
            {activeLens === 'TIMELINE' && (
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full"
              >
                <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  <Clock size={14} />
                  Historical Trajectory
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary leading-relaxed uppercase tracking-tighter shadow-inner">
                  Select a concept below to see its projection across the 21st century
                </div>
              </motion.section>
            )}

            {/* Filters and Stats */}
            <section className="w-full pb-8 mt-auto">
              <div className="flex flex-col gap-4">
                <div className="mb-2">
                  <a href="https://markjustman.substack.com/s/about" target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 w-full py-3 rounded-xl border bg-secondary/20 text-muted-foreground border-white/5 hover:bg-secondary/40 hover:text-foreground">
                    About this website
                  </a>
                </div>

                <div className="text-sm font-mono text-muted-foreground flex flex-col gap-4">
                  <div className="bg-secondary/20 p-4 rounded-xl border border-white/5">
                    Showing <span className="text-primary font-bold">{filteredArticles.length}</span> artifacts
                    {activeCategory && <span> in <span className="text-primary uppercase font-bold">{activeCategory}</span></span>}
                  </div>
                </div>
                
                <button 
                  onClick={clearFilters}
                  disabled={!(activeLens || activeCategory || searchQuery || selectedGlossaryTerm || selectedTimelineTerm)}
                  className={cn(
                    "text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 w-full py-3 mt-4 rounded-xl border",
                    (activeLens || activeCategory || searchQuery || selectedGlossaryTerm || selectedTimelineTerm) 
                      ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:bg-primary/30" 
                      : "bg-secondary/10 text-muted-foreground/30 border-white/5 cursor-not-allowed"
                  )}
                >
                  Reset All Filters
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Results Stream */}
        <div 
          ref={resultsScrollRef}
          className="flex-1 h-full overflow-y-auto custom-scrollbar px-6 lg:px-12 py-8 relative scroll-smooth"
        >
          
          {/* Default/Article View */}
          {(activeLens === null || activeLens === 'SEARCH' || activeLens === 'STEP' || (activeLens === 'GLOSSARY' && selectedGlossaryTerm) || (activeLens === 'TIMELINE' && selectedTimelineTerm)) && (
            <>
              {/* Top View Headers for Search and STEP */}
              {activeLens === 'SEARCH' && (
                <div className="mb-12 p-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 blend-overlay" />
                  <h3 className="relative z-10 text-xl font-heading font-bold text-primary-foreground">Search</h3>
                </div>
              )}
              {activeLens === 'STEP' && (
                <div className="mb-12 p-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 blend-overlay" />
                  <h3 className="relative z-10 text-xl font-heading font-bold text-primary-foreground">Scanning Categories</h3>
                </div>
              )}

              {/* If a glossary term is selected, show it at the top */}
              {activeLens === 'GLOSSARY' && selectedGlossaryTerm && (
                <div 
                  className={cn(
                    "mb-12 p-8 mt-8 rounded-3xl bg-secondary/80 border-2 relative overflow-hidden group backdrop-blur-md transition-all",
                    glossarySort === 'az' ? "border-sky-500/50 shadow-[0_0_80px_-20px_rgba(56,189,248,0.3)]" : "border-fuchsia-500/50 shadow-[0_0_80px_-20px_rgba(232,121,249,0.3)]"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2",
                    glossarySort === 'az' ? "bg-sky-500/20" : "bg-fuchsia-500/20"
                  )} />
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-8 border-b border-white/10">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setSelectedGlossaryTerm(null)} className="text-[10px] font-mono text-muted-foreground hover:text-white flex items-center gap-2 mb-2 transition-colors">
                          ← RETURN TO INDEX
                        </button>
                        <h2 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tighter uppercase italic">{selectedGlossaryTerm.term}</h2>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-white/10">
                        <button 
                          onClick={() => setGlossaryViewMode('articles')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-widest transition-all",
                            glossaryViewMode === 'articles' 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                              : "text-muted-foreground hover:text-white"
                          )}
                        >
                          ARTICLE VIEW
                        </button>
                        <button 
                          onClick={() => setGlossaryViewMode('context')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-widest transition-all",
                            glossaryViewMode === 'context' 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                              : "text-muted-foreground hover:text-white"
                          )}
                        >
                          CONTEXTUAL VIEW
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                      <div className="lg:col-span-3">
                        <p className="text-base text-muted-foreground font-body leading-relaxed max-w-4xl italic mb-6">
                          {selectedGlossaryTerm.description}
                        </p>
                      </div>
                      <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <h4 className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">STEP Breadth</h4>
                          <p className="text-xl font-heading font-black text-primary">
                            {new Set(articles.filter(a => a.glossary_refs?.includes(selectedGlossaryTerm.term)).map(a => a.primary)).size}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <h4 className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Total References</h4>
                          <p className="text-xl font-heading font-black text-primary">
                            {articles.filter(a => a.glossary_refs?.includes(selectedGlossaryTerm.term)).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If a timeline term is selected, show it at the top */}
              {activeLens === 'TIMELINE' && selectedTimelineTerm && (
                <div className="mb-12 p-8 rounded-3xl bg-secondary/80 border-2 border-primary/30 mt-8 relative overflow-hidden group shadow-[0_0_80px_-20px_rgba(var(--primary),0.3)] backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <button onClick={() => setSelectedTimelineTerm(null)} className="text-xs font-mono text-muted-foreground hover:text-white flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded border border-white/5 transition-colors">
                        ← BACK TO TIMELINE
                      </button>
                      <div className="inline-flex px-4 py-2 bg-primary/10 border border-primary/40 rounded-lg text-xs text-primary font-mono font-bold tracking-widest uppercase shadow-inner">
                        {selectedTimelineTerm.years}
                      </div>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white mb-4 tracking-tight drop-shadow-md">{selectedTimelineTerm.term}</h2>
                    <p className="text-sm md:text-base text-muted-foreground font-body leading-relaxed max-w-4xl">
                      {selectedTimelineTerm.description}
                    </p>
                  </div>
                </div>
              )}

              <section className="grid grid-cols-1 gap-6 pb-20">
                <AnimatePresence mode="popLayout">
                  {glossaryViewMode === 'articles' || !selectedGlossaryTerm ? (
                    filteredArticles.map((article, index) => (
                      <ArticleCard 
                        key={article.filename} 
                        article={article} 
                        index={index}
                        totalArticles={articles.length}
                        onClick={() => {
                          const slug = article.filename.replace('.md', '');
                          router.push(`/archive/${slug}`);
                        }}
                      />
                    ))
                  ) : (
                    filteredArticles.map((article, index) => (
                      <motion.div
                        key={article.filename + '-context'}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button 
                          onClick={() => {
                            const slug = article.filename.replace('.md', '');
                            router.push(`/archive/${slug}`);
                          }}
                          className="group w-full text-left p-8 rounded-2xl bg-secondary/10 border border-white/5 hover:border-white/20 transition-all hover:bg-secondary/20"
                        >
                          <div className="flex items-center gap-3 mb-4 text-xs font-mono text-primary uppercase tracking-widest font-bold">
                            <span>[{article.primary}]</span>
                            <div className="h-px flex-1 bg-white/5" />
                          </div>
                          <h3 className="text-2xl font-heading font-black text-white mb-4 group-hover:text-primary transition-colors uppercase italic">
                            {article.title}
                          </h3>
                          <div className="flex items-start gap-4">
                            <Quote size={20} className="text-primary/40 shrink-0 mt-1" />
                            <div className="text-muted-foreground text-base leading-relaxed italic line-clamp-6 font-body opacity-90 group-hover:opacity-100 transition-opacity">
                              <MarkdownRenderer 
                                content={getContextSnippet(article.body, selectedGlossaryTerm.term)} 
                                className="inline-block !p-0 !m-0 !text-base prose-p:!mb-0"
                              />
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </section>

              {/* Empty State */}
              {filteredArticles.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-32 text-center col-span-full border border-white/5 rounded-3xl bg-secondary/10 backdrop-blur-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-white/5">
                    <Hexagon className="text-muted-foreground/40" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">No Artifacts Found</h3>
                  <p className="text-muted-foreground font-body max-w-xs">
                    Your diagnostic parameters yielded no results. Try adjusting your search or lens.
                  </p>
                  <button 
                    onClick={clearFilters}
                    className="mt-6 px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
                  >
                    Reset Search
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Full Glossary Index State */}
          {activeLens === 'GLOSSARY' && !selectedGlossaryTerm && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full pb-20 flex flex-col gap-3"
            >
              <div className="mb-8 p-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 blend-overlay" />
                <h3 className="relative z-10 text-xl font-heading font-bold text-primary-foreground">Glossary of Concepts</h3>
              </div>

              {[...glossary]
                .sort((a, b) => {
                  if (glossarySort === 'az') return a.term.localeCompare(b.term);
                  return (termFrequencies[b.term] || 0) - (termFrequencies[a.term] || 0);
                })
                .map((item) => (
                <button 
                  key={item.term} 
                  onClick={() => {
                    setSelectedGlossaryTerm(item);
                    scrollToTop();
                  }} 
                  className="text-left group flex items-center p-5 rounded-xl border border-white/5 bg-secondary/10 hover:bg-secondary/40 hover:border-white/20 transition-all cursor-pointer w-full shadow-sm"
                >
                  <div className="w-48 xl:w-64 shrink-0 pr-4">
                    <div className="font-heading font-bold text-base md:text-lg group-hover:text-primary transition-colors line-clamp-1">{item.term}</div>
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground font-body line-clamp-2 leading-relaxed">
                    {item.description}
                  </div>
                  {glossarySort === 'freq' && (
                    <div className="ml-4 px-2 py-1 rounded bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-mono border border-fuchsia-500/20">
                      {termFrequencies[item.term] || 0} REFS
                    </div>
                  )}
                </button>
              ))}
            </motion.section>
          )}

          {/* Timeline View Mockup */}
          {activeLens === 'TIMELINE' && !selectedTimelineTerm && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full min-h-[600px] pb-20"
            >
              <div className="mb-8 p-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 blend-overlay" />
                <h3 className="relative z-10 text-xl font-heading font-bold text-primary-foreground">Scenario Timeline</h3>
              </div>

              {/* Axis markers */}
              <div className="flex border-b border-white/20 text-xs font-mono text-muted-foreground pb-2 mb-6 ml-64 relative">
                <div className="flex-1 text-left">2025</div>
                <div className="flex-1 text-center border-l border-white/20 pl-2">2050</div>
                <div className="flex-1 text-center border-l border-white/20 pl-2">2075</div>
                <div className="text-right">2100</div>
              </div>

              {/* Data Rows */}
              <div className="flex flex-col gap-6">
                {glossary
                  .filter(g => g.years.includes('-')) // Only show those with ranges
                  .sort((a, b) => {
                    const yearA = parseInt(a.years.split('-')[0].trim());
                    const yearB = parseInt(b.years.split('-')[0].trim());
                    return yearA - yearB;
                  })
                  .map((item) => {
                    const startYear = parseInt(item.years.split('-')[0].trim()) || 2025;
                    const endYearRaw = item.years.split('-')[1].trim();
                    const endYear = endYearRaw === 'Present' ? 2100 : (parseInt(endYearRaw) || 2100);
                    
                    // Placement math
                    const leftOffset = ((startYear - 2025) / (2100 - 2025)) * 100;
                    const widthPercentage = ((endYear - startYear) / (2100 - 2025)) * 100;
                    
                    return (
                      <div key={item.term} className="relative flex items-center group">
                        <button 
                          onClick={() => {
                            setSelectedTimelineTerm(item);
                            scrollToTop();
                          }}
                          className="w-64 shrink-0 pr-4 text-base md:text-lg font-heading font-bold text-muted-foreground group-hover:text-foreground hover:text-primary transition-colors text-left truncate cursor-pointer"
                        >
                          {item.term}
                        </button>
                        
                        <div className="flex-1 relative h-10 bg-secondary/5 rounded-md border border-white/5 overflow-hidden">
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          
                          <button 
                            onClick={() => {
                              setSelectedTimelineTerm(item);
                              scrollToTop();
                            }}
                            className="absolute h-full top-0 bg-primary/20 border border-primary/40 rounded-md flex items-center px-4 overflow-hidden hover:bg-primary/40 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all cursor-pointer text-left"
                            style={{ left: `${Math.max(0, leftOffset)}%`, width: `${Math.max(2, widthPercentage)}%` }}
                          >
                            <span className="text-xs font-mono font-bold text-primary truncate">
                              {item.years}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.section>
          )}

        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Initializing Archive...</div>
        </div>
      </div>
    }>
      <ArchiveDashboard />
    </Suspense>
  );
}
