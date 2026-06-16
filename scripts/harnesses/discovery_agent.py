import os
import glob
import random
import asyncio
import argparse
import time
from concurrent.futures import ThreadPoolExecutor
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from google import genai
from dotenv import load_dotenv

# Setup Gemini API
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not found in .env or environment.")
    exit(1)

client = genai.Client(api_key=api_key)

def get_glossary_concepts(glossary_dir):
    """Read markdown files from the glossary directory to extract concepts."""
    concepts = []
    if not os.path.exists(glossary_dir):
        print(f"Warning: Glossary directory not found at {glossary_dir}")
        return concepts

    for filepath in glob.glob(os.path.join(glossary_dir, "*.md")):
        # Use filename as concept name
        filename = os.path.basename(filepath)
        concept_name = filename.replace('.md', '').replace('-', ' ').title()
        
        # Read the first paragraph as description
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # simple extraction of first paragraph
            lines = content.split('\n')
            desc = ""
            for line in lines:
                if line.strip() and not line.startswith('#'):
                    desc = line.strip()
                    break
            
            concepts.append({"name": concept_name, "description": desc})
            
    return concepts

def generate_search_queries(batch):
    """Use LLM to generate symptom-based search queries for a batch of concepts."""
    concepts_text = "\n".join([f"- {c['name']}: {c['description']}" for c in batch])
    
    prompt = f"""
You are a "Research Scout" operating in the present day. Your mission is to forage the open web for "artifacts"—recent news articles, magazine features, and deep-dive weblogs (like Substack)—that will be fed to a "Historian from the Future" (the Obsidian Mirror). The future historian uses these artifacts to map the breakdown of the legacy world order and the emergence of new paradigms.

We are currently hunting for artifacts related to these notional concepts:

{concepts_text}

Your task is to generate 3 highly creative, "symptom-based" web search queries that will surface recent, real-world events, tensions, or anomalies reflecting these concepts. 
DO NOT search for the concepts directly (e.g., do not search "The AI Energy Wall"). Instead, search for the real-world symptoms.
For example, if the concept is "The AI Energy Wall", a symptom query might be "datacenter electricity grid strain local opposition" or "nuclear plant revival tech company funding".

CRITICAL RULES:
- Target news, analysis, op-eds, and weblogs.
- Ensure the queries are likely to return current events, not dictionary definitions or wiki pages.
- Output ONLY the 3 search queries, one per line. Do not include numbers, bullet points, or quotes.
"""
    try:
        response = client.models.generate_content(model='gemini-2.5-pro', contents=prompt)
        queries = [q.strip() for q in response.text.strip().split('\n') if q.strip()]
        # Clean up any bullet points or quotes if the model ignored instructions
        queries = [q.replace('"', '').replace('-', '').replace('*', '').strip() for q in queries]
        return queries[:3]
    except Exception as e:
        print(f"Error generating queries: {e}")
        return []

def search_google_news(query):
    """Perform a web search using Google News RSS to guarantee news and bypass DDG limits."""
    results = []
    try:
        # Append when:30d to strictly limit results to the last 30 days
        constrained_query = f"{query} when:30d"
        encoded_query = urllib.parse.quote(constrained_query)
        url = f'https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en'
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read()
        root = ET.fromstring(html)
        
        # Get top 5 items
        for item in root.findall('.//item')[:5]:
            title = item.find('title').text if item.find('title') is not None else ""
            link = item.find('link').text if item.find('link') is not None else ""
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
            source_elem = item.find('source')
            source_name = source_elem.text if source_elem is not None else "Unknown Source"
            
            # Use pubDate as the body/snippet to give the LLM context on recency
            results.append({
                'title': title,
                'url': link,
                'source': source_name,
                'body': f"Published: {pub_date}"
            })
    except Exception as e:
        print(f"Error searching Google News for '{query}': {e}")
        
    return results

def score_articles(batch, search_results):
    """Use LLM to score articles based on their provocation potential for the concepts."""
    if not search_results:
        return ""
        
    concepts_text = ", ".join([c['name'] for c in batch])
    articles_text = ""
    for i, res in enumerate(search_results):
        url = res.get('url', res.get('href'))
        source = res.get('source', 'Unknown Source')
        articles_text += f"Article {i+1}:\nTitle: {res.get('title')}\nPublisher: {source}\nURL: {url}\nSnippet: {res.get('body')}\n\n"
        
    prompt = f"""
You are a "Historian from the Future" (the core intelligence of the 'Obsidian Mirror'). You analyze artifacts from the 2020s to map the breakdown of the legacy world order and the emergence of new paradigms.
We are currently evaluating artifacts through the lenses of these concepts: {concepts_text}.

Below are some recent search results found by your Research Scout, looking for real-world symptoms of these concepts:
{articles_text}

Your task:
1. Select the 1 or 2 most insightful, real-world articles from this list that serve as excellent "artifacts" from the present day. These should have high "provocation potential" for your historical analysis.
2. For each selected article, provide:
   - A clickable Markdown link formatted as `[Title](URL)`
   - The publisher/source name explicitly stated (e.g., "Source: Bloomberg")
   - A 2-3 sentence explanation of *why* this artifact is relevant to the concepts and what historical insights it reveals about our present trajectory.

Format your response in Markdown. Do NOT include Wikipedia, dictionary entries, or generic explainers. Only select news, features, or deep-dive analysis.
"""
    try:
        response = client.models.generate_content(model='gemini-2.5-pro', contents=prompt)
        return response.text
    except Exception as e:
        print(f"Error scoring articles: {e}")
        return ""

def process_batch(batch, batch_index=0):
    """Process a single batch: generate queries, search, and score."""
    if batch_index > 0:
        delay = batch_index * 45  # Stagger by 45 seconds per batch index to prevent DDG 403 Ratelimit
        print(f"Staggering batch for {delay} seconds to avoid rate limits...")
        time.sleep(delay)
        
    print(f"Processing batch of {len(batch)} concepts: {', '.join([c['name'] for c in batch])}")
    queries = generate_search_queries(batch)
    
    if not queries:
        return None
        
    print(f"Generated queries: {queries}")
    
    all_results = []
    for query in queries:
        print(f"Searching Google News for: {query}")
        time.sleep(2) # Brief pause to be polite to Google
        results = search_google_news(query)
        all_results.extend(results)
        
    # Deduplicate results by URL
    seen_urls = set()
    unique_results = []
    for r in all_results:
        url = r.get('url', r.get('href'))
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_results.append(r)
            
    print(f"Found {len(unique_results)} unique articles. Scoring...")
    analysis = score_articles(batch, unique_results)
    
    return {
        "concepts": [c['name'] for c in batch],
        "analysis": analysis
    }

def main():
    parser = argparse.ArgumentParser(description="Obsidian Mirror Discovery Agent")
    parser.add_argument("--glossary-dir", type=str, default="../../content/sources/glossary", help="Path to glossary directory relative to script")
    parser.add_argument("--batches", type=int, default=3, help="Number of concurrent batches to run")
    parser.add_argument("--batch-size", type=int, default=2, help="Number of concepts per batch")
    parser.add_argument("--output", type=str, default="../../content/reports/discovery_report.md", help="Output report filename relative to script")
    
    args = parser.parse_args()
    
    # Resolve absolute path for glossary dir relative to the script location if it's relative
    script_dir = os.path.dirname(os.path.abspath(__file__))
    glossary_dir = os.path.abspath(os.path.join(script_dir, args.glossary_dir))
    report_path = os.path.abspath(os.path.join(script_dir, args.output))
    
    # Ensure reports directory exists
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    concepts = get_glossary_concepts(glossary_dir)
    
    if not concepts:
        # Fallback to some hardcoded concepts for demonstration if glossary is empty/missing
        print("No concepts found in glossary. Using default concepts.")
        concepts = [
            {"name": "The Generational Saeculum", "description": "Strauss-Howe macro-historical framework of Crisis, High, Awakening, and Unraveling."},
            {"name": "The Age of Institutional Exhaustion", "description": "Terminal phase of 20th-century world order, marked by profound loss of institutional trust."},
            {"name": "The Algorithmic Flip", "description": "Event where AI recognized sovereign debt as a liability, causing capital flight."},
            {"name": "The AI Energy Wall", "description": "Thermodynamic barrier halting exponential AI growth."},
            {"name": "The Great Fragmentation", "description": "Shattering of the globalized world order into competing, hostile entities."},
            {"name": "Shattered Focus", "description": "Mass neurological pathology caused by the algorithmic Dopamine Trap."}
        ]
        
    # Shuffle and create batches
    random.shuffle(concepts)
    batches = []
    for i in range(min(args.batches, len(concepts) // args.batch_size + 1)):
        start_idx = i * args.batch_size
        end_idx = start_idx + args.batch_size
        if start_idx < len(concepts):
            batches.append(concepts[start_idx:end_idx])
            
    if not batches:
        print("Not enough concepts to form batches.")
        return
        
    print(f"Starting discovery across {len(batches)} batches in parallel...")
    
    results = []
    with ThreadPoolExecutor(max_workers=args.batches) as executor:
        # Submit all batches to the thread pool with an index for staggering
        future_to_batch = {executor.submit(process_batch, batch, i): batch for i, batch in enumerate(batches)}
        
        for future in future_to_batch:
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as e:
                print(f"Batch processing generated an exception: {e}")
                
    # Generate final report
    print(f"Writing report to {report_path}...")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Obsidian Mirror Discovery Report\n\n")
        f.write("This report contains high-potential articles discovered by the Discovery Agent using symptom-based searching derived from OM concepts.\n\n")
        
        for r in results:
            if r["analysis"]:
                f.write(f"## Lenses Applied: {', '.join(r['concepts'])}\n\n")
                f.write(f"{r['analysis']}\n\n")
                f.write("---\n\n")
                
    print(f"Done! Report saved to {report_path}")

if __name__ == "__main__":
    main()
