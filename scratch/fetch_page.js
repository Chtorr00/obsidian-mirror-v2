import fs from 'fs';

async function main() {
  const url = 'https://obsidianmirror.vercel.app/archive/the-geometry-of-the-epistemic-divorce';
  console.log('Fetching', url);
  const res = await fetch(url);
  const text = await res.text();
  fs.writeFileSync('scratch/fetched_epistemic.html', text);
  console.log('Done!');
}

main().catch(console.error);
