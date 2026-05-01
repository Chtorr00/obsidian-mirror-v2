
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Cpu, TrendingUp, Landmark, Leaf } from 'lucide-react';
import { STEPCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface STEPMatrixProps {
  activeCategory: STEPCategory | null;
  onCategorySelect: (category: STEPCategory) => void;
}

const categories: { id: STEPCategory; icon: any; color: string; description: string }[] = [
  {
    id: 'Social',
    icon: Users,
    color: 'var(--social)',
    description: 'Demographics, culture, and social movements',
  },
  {
    id: 'Technological',
    icon: Cpu,
    color: 'var(--tech)',
    description: 'Innovation, R&D, and digital transformation',
  },
  {
    id: 'Economic',
    icon: TrendingUp,
    color: 'var(--economic)',
    description: 'Markets, trade, and financial systems',
  },
  {
    id: 'Political',
    icon: Landmark,
    color: 'var(--political)',
    description: 'Governance, policy, and geopolitics',
  },
  {
    id: 'Environmental',
    icon: Leaf,
    color: 'var(--environmental)',
    description: 'Ecology, climate, and planetary boundaries',
  },
];

export const STEPMatrix: React.FC<STEPMatrixProps> = ({ activeCategory, onCategorySelect }) => {
  return (
    <div className="flex flex-col gap-2 w-full pt-2">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategorySelect(cat.id)}
          className={cn(
            "relative flex flex-row items-center justify-start gap-4 p-3 rounded-xl transition-all duration-300 w-full text-left",
            "bg-secondary/40 backdrop-blur-md border border-white/5",
            "hover:border-white/20 hover:bg-secondary/60",
            activeCategory === cat.id && "ring-1 ring-white/30 bg-secondary/80 border-white/40 shadow-inner"
          )}
          style={{
            boxShadow: activeCategory === cat.id 
              ? `0 0 30px -10px hsla(${cat.color}, 0.2)` 
              : 'none'
          }}
        >
          <div 
            className="p-2 rounded-lg transition-transform duration-500 group-hover:rotate-12 shrink-0"
            style={{ backgroundColor: `hsla(${cat.color}, 0.1)`, color: `hsl(${cat.color})` }}
          >
            <cat.icon size={16} />
          </div>
          <div className="flex flex-col">
            <h3 className="font-heading text-base font-bold tracking-wider uppercase">
              {cat.id}
            </h3>
          </div>

          {activeCategory === cat.id && (
            <motion.div
              layoutId="active-indicator"
              className="absolute inset-0 rounded-xl border-l-4"
              style={{ borderColor: `hsl(${cat.color})`, borderLeftColor: `hsl(${cat.color})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
