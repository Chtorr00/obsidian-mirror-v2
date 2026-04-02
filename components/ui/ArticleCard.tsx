
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calendar, Tag, Hexagon } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  index: number;
  totalArticles?: number;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, index, totalArticles }) => {
  const colorMap: Record<string, string> = {
    'Social': 'social',
    'Technological': 'tech',
    'Economic': 'economic',
    'Political': 'political'
  };
  const categoryColor = `var(--${colorMap[article.primary] || article.primary.toLowerCase()})`;
  
  const orderValue = article.order || index + 1;
  const totalValue = totalArticles || 0;
  const maxOrder = Math.max(totalValue, orderValue);
  const briefSummary = `Brief ${orderValue} of ${maxOrder}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer relative bg-secondary/20 backdrop-blur-sm border border-white/5 rounded-xl p-0 hover:bg-secondary/40 hover:border-white/20 transition-all overflow-hidden flex flex-col md:flex-row"
    >
      {/* Category accent line (Left edge now instead of top) */}
      <div 
        className="absolute top-0 left-0 w-1 h-full z-10"
        style={{ backgroundColor: `hsl(${categoryColor})` }}
      />

      {/* Image Preview / Placeholder - Left Side */}
      <div className="relative w-full md:w-48 lg:w-64 shrink-0 h-48 md:h-auto bg-secondary/30 overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
        {article.image ? (
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Hexagon size={48} className="text-primary animate-pulse" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-secondary/80 to-transparent" />
      </div>

      {/* Content Content - Right Side */}
      <div className="p-6 flex flex-col flex-1 pl-6 md:pl-8">
        <h3 className="text-lg md:text-xl font-heading font-bold mb-4 group-hover:text-primary transition-colors line-clamp-3 leading-tight">
          {article.title}
        </h3>

        {article.source_meta && (
          <div className="flex flex-col mt-auto pb-1">
            {article.source_meta.title && (
              <span className="text-xs italic text-muted-foreground/90 line-clamp-2 mb-2">
                {article.source_meta.title}
              </span>
            )}
            {(() => {
                const pubRaw = article.source_meta.publication;
                let pub = pubRaw;
                if (pubRaw && pubRaw.includes(',')) {
                  const idx = pubRaw.indexOf(',');
                  pub = pubRaw.substring(0, idx).trim();
                }
                return (
                  <div className="flex flex-col gap-1 mt-1">
                    {article.source_meta.author && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest line-clamp-1">
                        {article.source_meta.author}
                      </span>
                    )}
                    {pub && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest line-clamp-1">
                        {pub}
                      </span>
                    )}
                  </div>
                );
            })()}
          </div>
        )}
      </div>
      
      {/* Background glow on hover */}
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{ backgroundColor: `hsl(${categoryColor})` }}
      />
    </motion.div>
  );
};
