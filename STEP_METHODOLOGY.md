# STEP Classification Methodology
## Obsidian Mirror Archive — Category Scoring System

**Version:** 1.0  
**Date:** 2026-03-16  
**Method Name:** Secondary-Balanced Scoring (sqrt-dampened)

---

## Overview

Every Obsidian Mirror article is assigned a **primary** STEP category and one or more **secondary** categories using a weighted keyword scoring system with a distribution-balancing correction.

The four categories are:
| Code | Category | Domain |
|------|----------|--------|
| **S** | Social | Demographics, culture, identity, relationships, psychology, education, religion |
| **T** | Technological | AI models, biotech, digital infrastructure, cyber, space, energy tech |
| **E** | Economic | Trade, finance, energy economics, resources, production, economic systems |
| **P** | Political | Governance, geopolitics, institutions, military, information governance, sovereignty |

---

## AI Topic Routing

AI is a cross-cutting theme. The classification system routes AI topics based on their *impact domain*:

| AI Context | Routes To | Example |
|---|---|---|
| AI impact on relationships, companionship, identity | **Social** | AI companions replacing human intimacy |
| AI resource demands, energy consumption, compute costs | **Economic** | Data center power grid strain |
| AI model architecture, theory, engineering | **Technological** | LLM alignment, neural network design |
| AI impact on communication, governance, sovereignty | **Political** | AI-driven censorship, deepfake governance |

---

## Scoring Algorithm

### Phase 1: Raw Keyword Scoring

Each article's full text (title + body) is scanned against four keyword dictionaries. Each keyword has a **weight** (1–6), with longer/more-specific phrases receiving higher weights.

```
raw_score[category] = Σ (weight × min(occurrences, 5))
```

Occurrences are capped at 5 to prevent a single repeated word from dominating.

### Phase 2: Balance Factor Computation

Raw scoring naturally skews toward Political (~60%) because the Obsidian Mirror's vocabulary is saturated with governance/sovereignty language. To correct this:

1. Run Phase 1 on all articles.
2. Compute the **secondary distribution** — how often each category appears as a *secondary* tag. This distribution is naturally more balanced because it captures thematic undertones, not just dominant vocabulary.
3. Compute a **raw ratio** for each category:

```
raw_ratio[cat] = (secondary_count[cat] / total_secondary) / (primary_count[cat] / total_primary)
```

4. Apply **sqrt-dampening** to prevent overcorrection:

```
balance_factor[cat] = √(raw_ratio[cat])
```

The sqrt moves the distribution **halfway** (on a log scale) between the skewed raw-primary and the balanced secondary target.

### Current Balance Factors (v1.0)

| Category | Raw Ratio | Dampened Factor |
|---|---|---|
| Social | 1.136 | **1.0658** |
| Technological | 4.082 | **2.0205** |
| Economic | 2.209 | **1.4862** |
| Political | 0.453 | **0.6732** |

### Phase 3: Balanced Classification

For each article:

```
balanced_score[cat] = raw_score[cat] × balance_factor[cat]
```

- **Primary** = category with the highest balanced score
- **Secondary** = all categories scoring ≥ 30% of the primary score (minimum threshold: 10 points). If none qualify, the next-highest category is used.

---

## Resulting Distribution (235 articles)

| Category | Count | % |
|---|---|---|
| **Social** | 67 | 28.5% |
| **Technological** | 48 | 20.4% |
| **Economic** | 55 | 23.4% |
| **Political** | 65 | 27.7% |

---

## Scoring a New Article

To classify a new article using this system:

1. Run the article text through the four keyword dictionaries to get `raw_score[]` for each category.
2. Multiply each raw score by the corresponding balance factor:
   - Social: × 1.0658
   - Technological: × 2.0205
   - Economic: × 1.4862
   - Political: × 0.6732
3. Primary = highest balanced score.
4. Secondary = all other categories scoring ≥ 30% of primary (minimum 10 points).

### Quick Reference Formula

```
balanced_S = raw_S × 1.0658
balanced_T = raw_T × 2.0205
balanced_E = raw_E × 1.4862
balanced_P = raw_P × 0.6732

primary = argmax(balanced_S, balanced_T, balanced_E, balanced_P)
```

---

## Keyword Dictionaries

The full keyword dictionaries with weights are maintained in `step_classify.py`. Key design principles:

- **Specificity = higher weight**: "great fragmentation" (6) > "fragmentation" (2)
- **Named concepts get dedicated entries**: "sovereign stack" (5), "sterile plague" (5)
- **Partial matching via substrings**: "conservati" matches "conservative", "conservation"
- **Occurrence cap**: max 5 hits per keyword to prevent vocabulary saturation

---

## Recalibration

If the corpus grows significantly or thematic balance shifts, recalibrate by:

1. Re-running Phase 1 on the full corpus
2. Recomputing the secondary distribution
3. Deriving new balance factors using the same sqrt-dampening formula
4. The keyword dictionaries themselves may also need updates to reflect new recurring themes

The script `step_classify.py` handles all of this automatically.

---

## Files

| File | Purpose |
|---|---|
| `step_classify.py` | Classification engine — run to (re)classify all articles |
| `STEP_METHODOLOGY.md` | This document — scoring methodology reference |
| `step_classification_log.txt` | Output log showing every article's classification |
| `lib/data_new.ts` | Generated data file with STEP assignments |
