"""
STEP Classification Script for Obsidian Mirror v2
═══════════════════════════════════════════════════

Method: "Secondary-Balanced Scoring" (Dampened)

Phase 1: Score each article with raw keyword weights across S/T/E/P.
Phase 2: Compute balance factors from Phase-1 secondary distribution.
         Apply sqrt-dampening to prevent overcorrection.
Phase 3: Re-score using (raw_score × dampened_balance_factor) per category.
Phase 4: Assign primary = highest balanced score, secondary = all others
         above 30% of primary (or at least the next-highest).

The sqrt-dampening produces a distribution that trends TOWARD the balanced
secondary distribution without slamming all the way there.
"""

import json
import re
import math
from collections import Counter

# ── Load data ──────────────────────────────────────────────────────────────
with open("lib/data_new.ts", encoding="utf-8") as f:
    raw = f.read()

json_str = raw.replace("export const SYNO_DATA = ", "").rstrip(";\n\r")
data = json.loads(json_str)
articles = data["articles"]

# ── Fix the missing image ─────────────────────────────────────────────────
for art in articles:
    if art["title"] == "The Perfect Friend, The Perfect Poison":
        art["image"] = "/images/August31DigitalSiren.jpeg"
        break

# ═══════════════════════════════════════════════════════════════════════════
# KEYWORD DICTIONARIES
# ═══════════════════════════════════════════════════════════════════════════

SOCIAL_KEYWORDS = {
    "fertility": 3, "birth rate": 4, "demographic": 3, "population": 2,
    "crisis of posterity": 5, "reproduction": 3, "pronatali": 3,
    "natalism": 3, "breeding": 2, "children": 1, "family": 2,
    "multigenerational": 4, "marriage": 3, "dating": 4, "mating": 3,
    "courtship": 3, "romantic": 2, "intimacy": 3, "relationship": 2,
    "incel": 4, "surplus men": 4, "unloved": 3, "loneliness": 3,
    "culture war": 4, "identity": 2, "monoculture": 4, "tribal": 2,
    "neotribe": 5, "community": 2, "belonging": 3, "meaning": 2,
    "crisis of meaning": 5, "invisibility crisis": 5, "invisible": 2,
    "purpose": 2, "alienation": 3, "atomiz": 3, "disconnection": 3,
    "psychosis": 4, "mental health": 3, "addiction": 3, "dopamine": 3,
    "brainrot": 4, "shattered focus": 5, "cognitive decline": 4,
    "attention span": 3, "anxiety": 2, "depression": 2,
    "sterile plague": 5, "ai companion": 4, "synthetic companion": 4,
    "education": 2, "university": 2, "academic": 2, "school": 1,
    "accommodation": 2, "disability": 2, "meritocracy": 3,
    "de-accreditation": 4, "great de-accreditation": 5,
    "religion": 2, "spiritual": 2, "sacred": 2, "liturgy": 3,
    "faith": 2, "church": 2, "theological": 2, "worship": 2,
    "priesthood": 2, "re-enchantment": 3,
    "race": 2, "ethnic": 2, "eugenics": 3, "genetic": 2,
    "biological determinism": 4, "blank slate": 4, "phylum": 4,
    "human phyla": 5, "speciation": 4, "bioconservative": 3,
    "immigration": 2, "migrant": 2, "refugee": 2, "assimilation": 3,
    "balkanisation": 4, "sectarian": 3, "manosphere": 3,
    "youtube": 2, "podcast": 2, "entertainment": 2, "content creator": 2,
    "streaming": 2, "pop culture": 3, "tiktok": 2,
}

TECHNOLOGICAL_KEYWORDS = {
    "artificial intelligence": 3, "machine learning": 3,
    "large language model": 5, "llm": 4, "neural network": 4,
    "transformer": 3, "ai model": 4, "training data": 4,
    "hallucination": 4, "alignment": 3, "superintelligence": 5,
    "agi": 5, "artificial general intelligence": 5,
    "ai safety": 4, "ai containment": 5, "containment field": 5,
    "prompt": 2, "fine-tuning": 3, "inference": 3,
    "compute": 3, "parameter": 2, "benchmark": 2,
    "autonomous agent": 4, "ai agent": 4, "agentic": 3,
    "crispr": 5, "gene editing": 5, "synthetic biology": 4,
    "embryo selection": 4, "ivf": 3, "genome": 3, "genomic": 3,
    "biotech": 4, "biotechnology": 4,
    "rocket": 3, "space": 2, "launch": 2, "orbit": 2,
    "satellite": 2, "asteroid mining": 4,
    "blockchain": 3, "bitcoin": 3, "proof-of-work": 4,
    "smart contract": 4, "defi": 3, "decentralized finance": 4,
    "cryptograph": 3, "encryption": 3,
    "digital twin": 4, "sensor network": 3,
    "cybersecurity": 3, "zero-trust": 4, "palantir": 4,
    "surveillance": 2, "biometric": 3, "facial recognition": 3,
    "drone": 3, "autonomous weapon": 4,
    "nuclear": 2, "fusion": 3, "geothermal": 3,
    "modular reactor": 4, "thorium": 3,
    "software": 2, "algorithm": 2, "platform": 1,
    "digital public infrastructure": 4, "dpi": 3,
    "splinternet": 4, "internet": 1,
}

ECONOMIC_KEYWORDS = {
    "energy": 2, "ai energy wall": 6, "energy wall": 5,
    "energy scarcity": 4, "power grid": 3, "electricity": 2,
    "energy demand": 3, "thermodynamic": 3,
    "compute bottleneck": 5, "great compute bottleneck": 6,
    "tariff": 4, "trade war": 4, "trade": 2, "protectionism": 3,
    "globalization": 3, "deglobalization": 4, "supply chain": 4,
    "great shortening": 5, "reshoring": 3, "autarky": 3,
    "sanctions": 2,
    "dollar": 2, "currency": 2, "inflation": 3, "debt": 2,
    "treasury": 2, "bond market": 3, "financial": 2,
    "involuntary jubilee": 5, "algorithmic flip": 5,
    "banking": 2, "central bank": 3, "monetary": 2,
    "capitalism": 2, "closed-loop economy": 5, "triage economy": 5,
    "purpose economy": 5, "degrowth": 3, "ubr": 3,
    "universal basic": 4, "ubi": 3, "leisure dividend": 4,
    "real estate": 3, "housing": 2, "property": 2,
    "mining": 2, "mineral": 2, "rare earth": 3,
    "semiconductor": 3, "chip": 2, "manufacturing": 2,
    "industrial": 2, "agriculture": 2, "food": 2,
    "famine": 3, "great hunger": 5, "fortress farm": 5,
    "economic collapse": 4, "bankruptcy": 3, "poverty": 2,
    "inequality": 2, "wealth": 1, "austerity": 2,
    "fire economy": 5, "resource scramble": 4,
    "medicaid fraud": 4,
}

POLITICAL_KEYWORDS = {
    "sovereign": 2, "sovereignty": 3, "sovereign stack": 5,
    "nation-state": 3, "westphalian": 4, "governance": 2,
    "government": 1, "federal": 2, "state": 1,
    "democracy": 2, "authoritarian": 2, "autocracy": 2,
    "regime": 2, "constitution": 2, "republic": 2,
    "geopolit": 3, "china": 2, "russia": 2, "europe": 1,
    "nato": 2, "eu": 1, "india": 1, "multipolar": 3,
    "unipolar": 3, "great power": 3, "cold war": 2,
    "civilizational state": 4,
    "great fragmentation": 6, "great dissolution": 5,
    "collapse": 2, "secession": 3, "balkaniz": 3,
    "fragmentation": 2, "disintegration": 2,
    "great culling": 5, "assassination": 3, "civil war": 3,
    "military": 2, "warfare": 3, "5gw": 5,
    "fifth-generation warfare": 5, "war": 1,
    "mercenary": 3, "militia": 3, "conflict": 2,
    "institutional": 2, "institution": 2, "bureaucracy": 2,
    "regulation": 2, "law": 1, "legal": 1, "court": 1,
    "institutional exhaustion": 5, "age of institutional": 4,
    "spiritual lawfare": 5,
    "propaganda": 3, "disinformation": 3, "censorship": 3,
    "information warfare": 4, "great contamination": 5,
    "bounded truth": 5, "epistemic": 3,
    "great epistemic divorce": 5, "epistemic divorce": 4,
    "communication utility": 4,
    "ai governance": 5, "ai regulation": 4, "ai policy": 4,
    "polemics": 4, "watchful peace": 4,
    "parasovereign": 5, "neocameralist": 3,
    "populism": 3, "nationalist": 2, "conservati": 1,
    "progressive": 1, "election": 2, "vote": 1,
    "trump": 2, "musk": 2, "political party": 2,
    "patchwork": 3, "network state": 4,
    "physics of sovereignty": 5, "great re-grouping": 4,
    "great physical sorting": 5,
}

ALL_CATEGORIES = {
    "Social": SOCIAL_KEYWORDS,
    "Technological": TECHNOLOGICAL_KEYWORDS,
    "Economic": ECONOMIC_KEYWORDS,
    "Political": POLITICAL_KEYWORDS,
}


# ═══════════════════════════════════════════════════════════════════════════
# SCORING
# ═══════════════════════════════════════════════════════════════════════════

def compute_raw_scores(article):
    """Return raw STEP scores for an article."""
    text = (article["title"] + " " + article.get("body", "")).lower()
    scores = {}
    for category, keywords in ALL_CATEGORIES.items():
        score = 0
        for keyword, weight in keywords.items():
            count = len(re.findall(re.escape(keyword.lower()), text))
            if count > 0:
                score += weight * min(count, 5)
        scores[category] = score
    return scores


def assign_categories(scores):
    """Given {category: score}, return (primary, [secondary])."""
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = ranked[0][0]
    primary_score = ranked[0][1]
    threshold = max(primary_score * 0.30, 10)
    secondary = [cat for cat, sc in ranked[1:] if sc >= threshold]
    if not secondary and len(ranked) > 1:
        secondary = [ranked[1][0]]
    return primary, secondary


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Raw scoring to measure natural distribution
# ═══════════════════════════════════════════════════════════════════════════
print("PHASE 1: Raw scoring...")

raw_primary_counts = Counter()
raw_secondary_counts = Counter()
article_raw = []

for art in articles:
    scores = compute_raw_scores(art)
    primary, secondary = assign_categories(scores)
    raw_primary_counts[primary] += 1
    for s in secondary:
        raw_secondary_counts[s] += 1
    article_raw.append(scores)

print("  Raw primary:   ", dict(raw_primary_counts))
print("  Raw secondary: ", dict(raw_secondary_counts))


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Dampened balance factors
# ═══════════════════════════════════════════════════════════════════════════
#
# raw_ratio = secondary_proportion / primary_proportion
# dampened  = sqrt(raw_ratio)
#
# sqrt moves distribution halfway (on a log scale) between raw-primary
# and the secondary target — a moderate, principled correction.

print("\nPHASE 2: Dampened balance factors...")

total_p = sum(raw_primary_counts.values())
total_s = sum(raw_secondary_counts.values())

balance_factors = {}
for cat in ["Social", "Technological", "Economic", "Political"]:
    p_prop = raw_primary_counts.get(cat, 1) / total_p
    s_prop = raw_secondary_counts.get(cat, 1) / total_s
    raw_ratio = s_prop / p_prop
    dampened = math.sqrt(raw_ratio)
    balance_factors[cat] = dampened
    print(f"  {cat:>14}: raw_ratio={raw_ratio:.3f}  dampened={dampened:.3f}")


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: Balanced classification
# ═══════════════════════════════════════════════════════════════════════════
print("\nPHASE 3: Balanced classification...")

bal_primary_counts = Counter()
bal_secondary_counts = Counter()
log_entries = []

for i, art in enumerate(articles):
    raw = article_raw[i]
    balanced = {cat: raw[cat] * balance_factors[cat] for cat in raw}
    primary, secondary = assign_categories(balanced)

    art["primary"] = primary
    art["secondary"] = secondary

    bal_primary_counts[primary] += 1
    for s in secondary:
        bal_secondary_counts[s] += 1

    log_entries.append({
        "month": art["month"],
        "title": art["title"],
        "primary": primary,
        "secondary": secondary,
        "raw": raw,
        "balanced": balanced,
    })


# ═══════════════════════════════════════════════════════════════════════════
# RESULTS
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("FINAL BALANCED DISTRIBUTION")
print("=" * 70)

for cat in ["Social", "Technological", "Economic", "Political"]:
    count = bal_primary_counts.get(cat, 0)
    pct = count / len(articles) * 100
    bar = "█" * int(pct)
    print(f"  {cat:>14}: {count:>3} ({pct:5.1f}%) {bar}")

print(f"\nSecondary appearances:")
for cat in ["Social", "Technological", "Economic", "Political"]:
    print(f"  {cat:>14}: {bal_secondary_counts.get(cat, 0):>3}")

print(f"\n  Total articles: {len(articles)}")
print(f"  All with images: {sum(1 for a in articles if a.get('image'))}")


# ── Write updated data ─────────────────────────────────────────────────────
output_json = json.dumps({"articles": articles}, indent=2, ensure_ascii=False)
output_ts = f"export const SYNO_DATA = {output_json};\n"

with open("lib/data_new.ts", "w", encoding="utf-8") as f:
    f.write(output_ts)

print(f"\nWrote lib/data_new.ts ({len(output_ts):,} bytes)")


# ── Write classification log ───────────────────────────────────────────────
with open("step_classification_log.txt", "w", encoding="utf-8") as f:
    f.write("OBSIDIAN MIRROR v2 — STEP CLASSIFICATION LOG\n")
    f.write("Method: Secondary-Balanced Scoring (sqrt-dampened)\n")
    f.write("=" * 100 + "\n\n")

    f.write("BALANCE FACTORS (sqrt-dampened):\n")
    for cat in ["Social", "Technological", "Economic", "Political"]:
        f.write(f"  {cat:>14}: {balance_factors[cat]:.4f}\n")
    f.write("\n")

    f.write("RAW PRIMARY DISTRIBUTION:\n")
    for cat in ["Social", "Technological", "Economic", "Political"]:
        f.write(f"  {cat:>14}: {raw_primary_counts.get(cat, 0):>3}\n")
    f.write("\nRAW SECONDARY DISTRIBUTION:\n")
    for cat in ["Social", "Technological", "Economic", "Political"]:
        f.write(f"  {cat:>14}: {raw_secondary_counts.get(cat, 0):>3}\n")

    f.write("\n" + "-" * 100 + "\n")
    f.write(f"{'Month':>10}  {'Primary':>14}  {'Secondary':<45}  {'Title'}\n")
    f.write("-" * 100 + "\n")

    for e in log_entries:
        sec = ", ".join(e["secondary"])
        f.write(f"{e['month']:>10}  {e['primary']:>14}  {sec:<45}  {e['title']}\n")

    f.write("\n" + "=" * 100 + "\n")
    f.write("FINAL PRIMARY DISTRIBUTION (Balanced):\n")
    for cat in ["Social", "Technological", "Economic", "Political"]:
        count = bal_primary_counts.get(cat, 0)
        pct = count / len(articles) * 100
        f.write(f"  {cat:>14}: {count:>3} ({pct:5.1f}%)\n")

    f.write(f"\nSECONDARY APPEARANCES (Balanced):\n")
    for cat in ["Social", "Technological", "Economic", "Political"]:
        f.write(f"  {cat:>14}: {bal_secondary_counts.get(cat, 0):>3}\n")

    f.write(f"\n  Total articles: {len(articles)}\n")
    f.write(f"  All with images: {sum(1 for a in articles if a.get('image'))}\n")

print("Wrote step_classification_log.txt")
