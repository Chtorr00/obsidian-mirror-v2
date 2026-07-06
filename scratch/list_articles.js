import { SYNO_DATA } from '../lib/data.ts';

const articles = SYNO_DATA.articles;

console.log('All articles with publish_date in June 2026:');
const junePublished = articles.filter(a => a.publish_date && a.publish_date.includes('2026-06'));
junePublished.forEach(a => {
  console.log(`- Title: ${a.title} | Order: ${a.order} | Month: "${a.month}" | Publish Date: ${a.publish_date}`);
});
