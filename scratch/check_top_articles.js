import { SYNO_DATA } from '../lib/data.ts';

const articles = SYNO_DATA.articles;

const getYear = (art) => {
    if (art.publish_date) {
        const dateObj = new Date(art.publish_date);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.getUTCFullYear();
        }
    }
    const match = (art.source_meta?.date || "").match(/\d{4}/);
    if (match) return parseInt(match[0]);
    return ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].includes(art.month) ? 2026 : 2025;
};

const topArticles = articles.filter(a => a.order > 345);
console.log(`Found ${topArticles.length} articles with order > 345:`);

topArticles.forEach(a => {
  console.log(`- Title: ${a.title}`);
  console.log(`  Filename: ${a.filename}`);
  console.log(`  Order: ${a.order}`);
  console.log(`  Month: "${a.month}"`);
  console.log(`  Source Date: "${a.source_meta?.date}"`);
  console.log(`  Source Publication: "${a.source_meta?.publication}"`);
  console.log(`  Calculated Year: ${getYear(a)}`);
  console.log(`  Publish Date: "${a.publish_date}"`);
  console.log(`  Image: "${a.image}"`);
  console.log('-------------------------------------------');
});
