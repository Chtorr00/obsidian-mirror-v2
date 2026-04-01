
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
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    let result = content;
    
    // 1. Convert [[WikiLinks]] to standard markdown links
    result = result.replace(/\[\[(.*?)\]\]/g, (match, term) => {
      const slug = term.trim().toLowerCase().replace(/\s+/g, '-');
      return `[${term}](/glossary/${slug})`;
    });

    // 2. Bold Acts and ensure they are isolated
    // Matches Act 1: Text... and bolds until first period
    result = result.replace(/^(Act [0-9IVX]+:.*?\.)(\s|$)/gm, '\n\n**$1**\n\n$2');

    // 3. Ensure double newlines for paragraph gaps
    // Replace single newline with double newline if not already preceded/followed by one
    // Also avoid breaking within list items or blockquotes
    result = result.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');

    return result;
  }, [content]);

  return (
    <div className={cn("prose prose-invert max-w-none", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-4xl font-heading font-black mb-10 tracking-tighter" {...props} />,
          h2: ({ ...props }) => <h2 className="text-2xl font-heading font-bold mt-12 mb-6 tracking-tight border-b border-white/10 pb-2" {...props} />,
          p: ({ ...props }) => <p className="text-muted-foreground font-body leading-relaxed mb-10 text-lg">{props.children}</p>,
          ul: ({ ...props }) => <ul className="list-disc pl-6 mb-8 text-muted-foreground" {...props} />,
          li: ({ ...props }) => <li className="mb-4" {...props} />,
          strong: ({ ...props }) => <strong className="text-white font-bold" {...props} />,
          em: ({ ...props }) => <em className="italic text-foreground/90" {...props} />,
          a: ({ ...props }: any) => {
            const isGlossary = props.href?.startsWith('/glossary');
            if (isGlossary) {
              return (
                <Link 
                  href={props.href}
                  className="text-primary hover:underline decoration-primary/30 underline-offset-4 font-bold transition-all hover:text-primary/80"
                >
                  {props.children}
                </Link>
              );
            }
            return (
              <a 
                href={props.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary underline hover:text-primary/80"
              >
                {props.children}
              </a>
            );
          },
          code: ({ inline, ...props }: any) => (
            <code 
              className={cn(
                "bg-secondary/50 px-1.5 py-0.5 rounded font-mono text-sm",
                inline ? "text-primary" : "block p-6 my-8 overflow-x-auto border border-white/5 bg-black/30"
              )} 
              {...props} 
            />
          ),
          img: ({ ...props }) => (
            <span className="block my-16 relative group">
              <img 
                className="rounded-2xl border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.01] w-full" 
                {...props} 
                alt={props.alt || "Article Image"}
              />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
            </span>
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-primary/30 pl-8 italic my-12 text-muted-foreground/90 bg-primary/5 py-8 rounded-r-xl" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
