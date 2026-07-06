async function main() {
  const imageUrl = 'https://obsidianmirror.vercel.app/_next/image?url=%2Fimages%2Fthe-geometry-of-the-epistemic-divorce.png&w=640&q=75';
  console.log('Fetching optimized image:', imageUrl);
  const res = await fetch(imageUrl, {
    headers: {
      'accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
    }
  });
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Length:', res.headers.get('content-length'));
  console.log('X-Vercel-Cache:', res.headers.get('x-vercel-cache'));
}

main().catch(console.error);
