import fs from 'fs';

async function main() {
  const url = 'https://obsidianmirror.vercel.app/';
  console.log('Fetching', url);
  const res = await fetch(url);
  const html = await res.text();
  
  // Extract all script tags src attributes
  const regex = /<script src="(\/_next\/static\/chunks\/[^"]+)"/g;
  let match;
  const scriptUrls = [];
  while ((match = regex.exec(html)) !== null) {
    scriptUrls.push('https://obsidianmirror.vercel.app' + match[1]);
  }
  
  console.log('Found script chunks:', scriptUrls);
  
  const searchTerms = [
    'The Geometry of the Epistemic Divorce',
    'The Winning Heresy',
    'The Autopsy of the Commons',
    'The Biomass Calculus'
  ];
  
  // We will download each script and search it
  for (const scriptUrl of scriptUrls) {
    console.log(`Fetching script: ${scriptUrl}`);
    try {
      const scriptRes = await fetch(scriptUrl);
      const scriptText = await scriptRes.text();
      for (const term of searchTerms) {
        if (scriptText.includes(term)) {
          console.log(`  -> Found "${term}" in ${scriptUrl.split('/').pop()}`);
        }
      }
    } catch (e) {
      console.error(`Error fetching script ${scriptUrl}:`, e.message);
    }
  }
}

main().catch(console.error);
