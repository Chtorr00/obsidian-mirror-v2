import type { Metadata } from 'next';
import { Exo, Outfit, Roboto_Mono } from 'next/font/google';
import './globals.css';

const exo = Exo({ 
  subsets: ['latin'], 
  weight: ['300', '400', '700', '800'],
  variable: '--font-exo' 
});

const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-outfit' 
});

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'], 
  variable: '--font-roboto-mono' 
});

export const metadata: Metadata = {
  title: 'Obsidian Mirror Archive',
  description: 'Projecting Hindsight | Archaeological Diagnostics of the Collapse',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${exo.variable} ${outfit.variable} ${robotoMono.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
