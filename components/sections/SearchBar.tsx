
'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onClear }) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-7 text-muted-foreground pointer-events-none">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search the archive..."
          className="w-full bg-secondary/30 backdrop-blur-xl border border-white/10 rounded-full py-3 pl-14 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-muted-foreground/50 font-body"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClear}
              className="absolute right-7 p-1 hover:bg-white/10 rounded-full transition-colors text-muted-foreground"
            >
              <X size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Decorative glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-social/20 via-tech/20 to-political/20 rounded-full blur-xl opacity-20 -z-10 group-focus-within:opacity-40 transition-opacity" />
    </div>
  );
};
