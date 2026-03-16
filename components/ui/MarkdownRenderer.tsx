
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const renderWithWikiLinks = (text: string) => {
    if (typeof text !== 'string') return text;
    
    const parts = text.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const term = part.slice(2, -2);
        const slug = term.toLowerCase().replace(/\s+/g, '-');
        return (
          <Link 
            key={i} 
            href={`/glossary/${slug}`}
            className="text-primary hover:underline decoration-primary/30 underline-offset-4 font-bold"
          >
            {term}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn("prose prose-invert max-w-none", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-4xl font-heading font-black mb-8 tracking-tighter" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-heading font-bold mt-12 mb-4 tracking-tight border-b border-white/10 pb-2" {...props} />,
          p: ({ node, ...props }: any) => {
            const children = React.Children.map(props.children, (child) => {
              if (typeof child === 'string') {
                // Check for "Act I:", "Act II:", etc. and wrap in strong
                const actMatch = child.match(/^(Act [IVX]+:)(.*)/);
                if (actMatch) {
                  return (
                    <>
                      <strong className="text-white font-black tracking-widest uppercase text-sm block mt-8 mb-2">
                        {actMatch[1]}
                      </strong>
                      {renderWithWikiLinks(actMatch[2])}
                    </>
                  );
                }
                return renderWithWikiLinks(child);
              }
              return child;
            });
            return <p className="text-muted-foreground font-body leading-relaxed mb-8">{children}</p>;
          },
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 text-muted-foreground" {...props} />,
          li: ({ node, ...props }) => <li className="mb-2" {...props} />,
          strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
          code: ({ node, inline, ...props }: any) => (
            <code 
              className={cn(
                "bg-secondary/50 px-1.5 py-0.5 rounded font-mono text-sm",
                inline ? "text-primary" : "block p-4 my-6 overflow-x-auto border border-white/5"
              )} 
              {...props} 
            />
          ),
          img: ({ node, ...props }) => (
            <span className="block my-12 relative group">
              <img 
                className="rounded-2xl border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]" 
                {...props} 
                alt={props.alt || "Article Image"}
              />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
            </span>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary/30 pl-6 italic my-8 text-muted-foreground/80 bg-secondary/10 py-4 rounded-r-lg" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
