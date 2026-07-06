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

const monthMap = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

const a1 = articles.find(a => a.title.includes('scarce'));
const a2 = articles.find(a => a.title.includes('Epistemic Divorce'));

console.log('What will be scarce?:');
console.log('  Year:', getYear(a1));
console.log('  Month:', a1.month, '->', monthMap[a1.month] || 0);
console.log('  Order:', a1.order);

console.log('Epistemic Divorce:');
console.log('  Year:', getYear(a2));
console.log('  Month:', a2.month, '->', monthMap[a2.month] || 0);
console.log('  Order:', a2.order);

// Let's sort them using the exact same logic
const testArray = [a1, a2];
testArray.sort((a, b) => {
    const yearA = getYear(a), yearB = getYear(b);
    if (yearA !== yearB) return yearA - yearB;
    const monthA = monthMap[a.month] || 0, monthB = monthMap[b.month] || 0;
    if (monthA !== monthB) return monthA - monthB;
    if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
    return a.title.localeCompare(b.title);
});

console.log('Sorted order of test array:');
testArray.forEach(a => console.log(`- ${a.title}`));
