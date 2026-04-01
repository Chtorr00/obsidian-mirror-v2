
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
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Hexagon size={10} />
            {briefSummary}
          </div>
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-current"
            style={{ color: `hsl(${categoryColor})` }}
          >
            <Tag size={10} />
            {article.primary}
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 font-body leading-relaxed flex-1">
          {article.preview}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex gap-2">
            {article.secondary?.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-widest text-muted-foreground/60 border border-white/10 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
            VIEW ARCHIVE →
          </span>
        </div>
      </div>
      
      {/* Background glow on hover */}
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{ backgroundColor: `hsl(${categoryColor})` }}
      />
    </motion.div>
  );
};
