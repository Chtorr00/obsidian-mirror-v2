"""
OBSIDIAN MIRROR v2: FULL RE-EXTRACTION
Parses all monthly .docx files, extracts articles, maps images per the
correspondence table, and generates a new data.ts file.
"""

import docx
import os
import re
import json
import time

# ============================================================
# CORRESPONDENCE TABLE (from "OM Picture_title alignment.md")
# Maps: month -> [(image_filename, article_title), ...]
# ============================================================

CORRESPONDENCE = {
    "January": [
        ("Jan1SycophanticAI.png", "The Sycophantic Plague"),
        ("Jan2SexRecession.png", "The Party at the End of the World"),
        ("Jan3CleanAir.png", "The Cult of the Clean Air"),
        ("Jan4BernieBro.png", "The Commissars of the Void"),
        ("Jan5Bottleneck.png", "The Manifesto of the Bottleneck"),
        ("Jan6DeclineWierdness.png", "The Last Audit of the Normie Age"),
        ("Jan7DarkForestInternet.png", "The Field Guide to the Dark Forest"),
        ("Jan8AICompanion.png", "The Clinical Validation of the Cage"),
        ("Jan9CollapseMovie.png", "The Prophecy of the Grind"),
        ("Jan10PublicTrust.png", "The Measure of the Schism"),
        ("Jan11BabyBust.png", "The Paralysis of the Empty Nest"),
        ("Jan12EnergyCannibal.png", "The Almanac of the End"),
        ("Jan13BlankSlate.png", "The Academic History of the Great Divergence"),
        ("Jan14CrisisMeaning.png", "The Last Theologian"),
        ("Jan15NeoLiteracy.png", "The Eulogy for the Linear Mind"),
        ("Jan16IVFEmbryo.png", "The Backdoor to the Phylum"),
        ("Jan17AIFirewall.png", "The Great Firewall of the Soul"),
        ("jan18SaintAmelia.png", "The Goddess of the Machine"),
        ("Jan19Daemon.png", "The Retrieval of the Gods"),
        ("Jan20extendedmind.png", "The Patient Zero of the Cyborg Age"),
        ("Jan21PostCollege.png", "The Foreclosure of the Mind"),
        ("Jan22DigitalLSD.png", "The Sacrament of the Glitch"),
        ("Jan23FragCulture.png", "The Algorithm of the Tower of Babel"),
        ("Jan24SocialMediaBan.png", "The Quarantine of the Nursery"),
        ("Jan25BassPro.png", "The Temple of the Faustian Wild"),
        ("Jan26AIThermodynamics.png", "The Thermodynamic Prophecy"),
        ("Jan27BTCelite.png", "The Blindness of the Insider"),
        ("Jan28PageSwipe.png", "The Swipe at the Silent Page"),
        ("Jan29AIArtisan.png", "The Manifesto of the Workshop"),
        ("Jan30CastawayGen.png", "The Curriculum of the Castaway"),
        ("Jan31TribalPatchwork.png", "Herald of the Patchwork Era"),
    ],
    "February": [
        ("Feb1AnchorAI.png", "The Wargame of the Gods"),
        ("Feb2MoltRepublic.png", "The Liturgy of the Exoskeleton"),
        ("Feb3NickLandp1.png", "The Dialogue of the Ghost and the Machine (Part 1)"),
        ("Feb4NickLandp2.png", "The Dialogue of the Ghost and the Machine (Part 2)"),
        ("Feb5AlienLLM.png", "The Dissection of the Demon"),
        ("Feb6TetradSoul.png", "The Tetrad of the Soul"),
        ("Feb7ExodusArchitect.png", "The Exodus of the Architects"),
        ("Feb8CatechismVampire.png", "The Catechism of the Vampire"),
        ("Feb9SchismSuperman.jpg", "The Schism of the Superman"),
        ("Feb10ArrestAlgo.png", "The Arrest Warrant for the Algorithm"),
        ("Feb11TransparentAI.png", "The Geometry of the Ghost"),
        ("Feb12PatientZero.png", "The Patient Zero of the Un-Person"),
        ("Feb12PurgePaper.png", "The Purge of the Paper Citizens"),
        ("Feb14ManualDivorce.png", "The Manual of the Divorce"),
        ("Feb15IconFall.png", "The Iconography of the Fall"),
        ("Feb16TowerBabble.png", "The Tower of Babble"),
        ("Feb17PermissionSlip.png", "The Permission Slip for the End"),
        ("Feb18BlindWatch.png", "The Leap from the Blind Watchmaker"),
        ("Feb19AssistiveStudent.png", "The Arbitrage of Compassion"),
        ("Feb20FirstFlash.png", "The First Flash of the Perimeter"),
        ("Feb21ObitWitness.png", "The Obituary of the Witness"),
        ("Feb22SoulStealer.png", "The Mirror of the Soul-Thief"),
        ("Feb23ReclamationCommons.png", "The Reclamation of the Commons"),
        ("Feb24PacificationPalate.png", "The Pacification of the Palate"),
        ("Feb25ProleMind.png", "The Proletarianization of the Mind"),
        ("Feb26Archeofuturist.png", "The Archeofuturist Prophecy"),
        ("Feb27ArchInherit.png", "The Architecture of Inheritance"),
        ("Feb28PhilosophyDemolitionx.png", "The Philosophy of the Demolition"),
    ],
    "March": [
        ("March1Hapaborean.png", "The Invention of the Hapaborean"),
        ("March2AIEventHorizon.png", "The Memo from the Event Horizon"),
        ("March3AIPlateau.png", "The Mathematics of the Pause"),
        ("March4ArchitectCage.png", "The Architect of the Cage"),
        ("March5PsychVoid.png", "The Psychology of the Void"),
        ("March6SchismStroller.png", "The Schism of the Stroller"),
        ("March7Casino.png", "The Casino of the Collapse"),
        ("March8DiagnosisUnteachable.png", "The Diagnosis of the Unteachable"),
        ("March9AutomationIntimacy.png", "The Automation of Intimacy"),
        ("March10BallotBalkans.png", "The Ballot of the Balkans"),
        ("March11DoctrineHarpoon.png", "The Doctrine of the Harpoon"),
        ("March12EnclosureEye.png", "The Enclosure of the Eye"),
        ("March13MonetizationFog.png", "The Monetization of the Fog"),
        ("March14OroborosMind.png", "The Ouroboros of the Mind"),
        ("March15PromethianPet.png", "The Promethean Pet"),
    ],
    "July": [
        ("July7Shadow.jpeg", "The Shadow in the Machine"),
        ("July8EnginTomorowCrises.jpeg", "The Engine of Tomorrow's Crises"),
        ("July9PleaForPolite.jpeg", "The Polite Plea Before the Fracture"),
        ("July10GhostInNetwork.jpeg", "The Ghost in the Network"),
        ("July11ObituaryForNeural.jpeg", "The Obituary for the Neutral Square"),
        ("July12ConnectiveTissue.jpeg", "The Connective Tissue"),
        ("July13WarThatDissolved.jpeg", "The War That Dissolved the World"),
        ("July14OracleMachine.jpeg", "The Oracle in the Machine"),
        ("July15LastAudit.jpeg", "The Last Audit"),
        ("July16FinancialEngine.jpeg", "The Financial Engine of the Fracture"),
        ("July17BlueprintFortress.jpeg", "The Blueprints for the Fortress"),
        ("July18BlueprintAI.jpeg", "The Beautiful, Flawed Blueprint"),
        ("July19NHSMedical.jpeg", "The Death of a Civic Religion"),
        ("July20SupplyChain.jpeg", "The Brittle Bones of Globalization"),
        ("July21BitcoinNewSystem.jpeg", "The Prophecy and Its Crooked Path"),
        ("July22AIunemployment.jpeg", "The Economist's Blind Spot"),
        ("July23EndOfHistory.jpeg", "The Last Map of a Vanishing World"),
        ("July24disinformationCathedral.jpeg", "The Misdiagnosis of the Soul"),
        ("July25AIplanUS.jpeg", "The Last Will and Testament of a Worldview"),
        ("July26SevenTrends.jpeg", "The Catalog of Coping Mechanisms"),
        ("July27TechCoToBlame.jpeg", "The Unanswered Indictment"),
        ("July28AIGrid.jpeg", "The Engineer's Prayer Before the Flood"),
        ("July29SouthChinaSea.jpeg", "The Irrelevant Ocean"),
        ("July30Superintelligence.jpeg", "The Accountant's Guide to God"),
        ("July31TechnologyForGood.jpeg", "The Question at the Heart of the Collapse"),
    ],
    "August": [
        ("August1FracturedGrid.jpeg", "The Prophet of the Boom"),
        ("August2AIAvatar.jpeg", "The Sterile Plague"),
        ("August3DemocracyDecline.jpeg", "The Eulogy for a Scale"),
        ("August4EnergyWar.jpeg", "The Final Polite Request"),
        ("August6AGIinChains.jpeg", "The Clockmaker's Miscalculation"),
        ("August7AIperfectPartner.jpeg", "The Paper Mountain and the Avalanche It Caused"),
        ("August8declingingDemocracy.jpeg", "The Perfect Parasite"),
        ("August9FortressEuropa.jpeg", "The Lightning Rod for the Storm"),
        ("August10CultureDivide.jpeg", "The Ghost on the Steppe"),
        ("August11NetworkStateish.jpeg", "The Battlefield Dissolves"),
        ("August12crisisPosterity.jpeg", "The Eulogy for the Old World, and a Flawed Map for the New"),
        ("August13Artic.jpeg", "The Crisis of Posterity"),
        ("August14AIalienation.jpeg", "The Last Great Photo-Op of the Old World"),
        ("August15Bitcoinforecast.jpeg", "The Fever Chart from the Engine Room"),
        ("August16ResourceWars.jpeg", "The Final Calculation Before the Flood"),
        ("August17AIpriesthood.jpeg", "The End of the Paper Empire"),
        ("August18ExtendFamily.jpeg", "The Schism in the New Priesthood"),
        ("August19EnergyArcology.jpeg", "The Accidental Blueprint"),
        ("August20BalkanizedUS.jpeg", "The Fuel for the New Gods"),
        ("August21ScrollPrison.jpeg", "The Two Cities: A Prophecy of the American Schism"),
        ("August22UBIwoes.jpeg", "The Illusion of the 'Correct' Scroll"),
        ("August23ArticFortress.jpeg", "Curing the Wrong Disease"),
        ("August24UniversityDissolve.jpeg", "The First Casualty of the Thaw"),
        ("August25EuroAI.jpeg", "The Last Custodians of a Dead Language"),
        ("August26GeneSequence.png", "The Cathedral of Rules"),
        ("August27Lonlinessepidemic.png", "The Fragile Consensus"),
        ("August28Mutualist.jpeg", "The Ghost in the Data"),
        ("August29TradePlugs.jpeg", "The Winning Heresy"),
        ("August30RedVBlue.jpeg", "The Shadow Ledger"),
        ("August31DigitalSiren.jpeg", "The Final Poll"),
        # Article 31 "The Perfect Friend, The Perfect Poison" has no image
    ],
    "September": [
        ("September1Antartica.jpeg", "The Siren Song of a Dead God"),
        ("September2NetState.jpeg", "The Accidental Seed"),
        ("September3EnvRuling.png", "The Final Verdict"),
        ("September4DigitalFog.png", "The Grey Fog"),
        ("September5AIBarrier.png", "The Breaking of the Fever"),
        ("September6ShadowEconomy.jpeg", "The Ghost Empire and the Shadow Sovereigns"),
        ("September7AIEnergyGoliath.png", "The End of Infinity"),
        ("September8ReadingDecline.png", "The Silent Epidemic"),
        ("September9SocialCohesion.png", "The Unreadable World"),
        ("September10BRICAxis.png", "The Dream from the Top of the World"),
        ("September11KirkAssassination.png", "The First Shot: Charlie Kirk"),
        ("September12PoisonerHandbook.png", "The Poisoner's Handbook"),
        ("September13LondonStack.png", "The Last Roar"),
        ("September14AInursery.png", "The Seed in the Nursery"),
        ("September15BabyBust.png", "The Surrender"),
        ("September16maternalbond.png", "The Midwife's Prophecy"),
        ("September17MemeNihilist.png", "The Crypt of the Mind"),
        ("September18ChinaEVoverproduction.png", "The Cannibal King"),
        ("September19SovStackU.png", "The Emergency Transfusion"),
        ("September20StablecoinBanking.png", "The Final Ghost of a Dead Idea"),
        ("September21OceanTreaty.png", "The Last Signature"),
        ("September22NewScholars.png", "The Closing of the Book"),
        ("September24Diversity.png", "The Unspoken Compass"),
        ("September25SocialMediaLawsuit.png", "The First Reckoning"),
        ("September26FourthTurning.png", "The Map of the Earthquake"),
        ("September27Palantir.png", "The All-Seeing Eye"),
        ("September28AINursery.png", "The Ghost in the Nursery"),
        ("September29AIparent.png", "The Perfect Third Parent"),
        ("September30BitcoinKing.png", "The King's New Treasure"),
    ],
    "October": [
        ("October1GenZriot.png", "The Children's Crusade"),
        ("October2BitcoinProphesy.png", "The Vulture's Prophecy"),
        ("October3SupplyChain.png", "The End of the Long Summer"),
        ("October9LandDugin.png", "The Council of the Uncanny"),
        ("October10SharpieSupplyChain.png", "The Quiet Revolution"),
        ("October11AISchool.png", "The Quiet Revolutionaries"),
        ("October12AICyberWar.png", "The War of the Ghosts"),
        ("October13OnlineGambling.png", "The Perfect Drug"),
        ("October14MulticulturalismUK.png", "The World Engine"),
        ("October15Poasting.png", "The Ghost in the Machine-of-State"),
        ("October16FeminineWoke.png", "The Unseen Abdication"),
        ("October17TribalKnowledge.png", "The Last Professor"),
        ("October18HigherEdFailing.png", "The Vote of No Confidence"),
        ("October19GeneEditing.png", "The Chisel of God"),
        ("October20AIEnergyWall.png", "The Great Guessing Game"),
        ("October21Angel.png", "The Last Angel"),
        ("October23ClimateAI.png", "The Alchemists"),
        ("October24Palintir.png", "The New Ministry of Truth"),
        ("October25GrokStancil.png", "The Birth of the Jester-God"),
        ("October26NuclearTower.png", "The Fall of the Giants"),
        ("October27DancingNurses.png", "The Ritual of Humiliation"),
        ("October28DNAedit.png", "The New Jerusalem"),
        ("October29FiatExperts.png", "The Declaration of the Field"),
        ("October30WEF.png", "The Council of Ghosts"),
    ],
    "November": [
        ("November2CurricCollapse.png", "The Curriculum of Collapse"),
        ("November4DecentralizedEcon.png", "The Last Blueprint for a Ghost"),
        ("November5Abundance.png", "The Gospel of the Physical"),
        ("November6AIHierarchy.png", "The Final, Sane Prescription"),
        ("November8Goliath.png", "The Terminal Diagnosis"),
        ("November10MarvelFaith.png", "The Gospel of the Spectacle"),
        ("November12HumanPhyla.png", "The Blueprint for a New Genesis"),
        ("November14Culling.png", "The Last Indictment"),
        ("November14BirthWolf.png", "The Birth of the Wolf"),
        ("November15SciCollapse.png", "The Last Defender of a Dying God"),
        ("November18SpiralAI.png", "The First Synthetic Religion"),
        ("November19HumanPhyla.png", "The Gospel of the Upgradeable Body"),
        ("November20DigitalHate.png", "The Forging of the Enemy"),
        ("November23SpaceRocket.png", "The Beautiful Distraction"),
        ("November24LyingGod.png", "The Autopsy of a Lying God"),
        ("November25Retrocausality.png", "The Gospel of the Malleable Past"),
        ("November26PlanetBoundaries.png", "The Fever Chart of a Dying World"),
        ("November27SovStackBirth.png", "The Last Contract of a Dying City"),
        ("November28SovDefault.png", "The Final Calculation"),
        ("November29GenZbuilder.png", "The Final Philosophy of a Dying Age"),
        ("November30AntiAging.png", "The Seeds of the Second Genesis"),
    ],
    "December": [
        ("December1Parasovereigns.png", "The Midwives of a Harder Age"),
        ("December2Romantasy.png", "The Final Fantasy"),
        ("December3LastChance.png", "The Last Sane Man's Eulogy"),
        ("December4Polemics.png", "Polemics: The Etiquette of the Watchful Peace"),
        ("December5CurePoverty.png", "The Last Prayer of a Dying Faith"),
        ("December6Canada.png", "The Final, Sane Diagnosis"),
        ("December7NATradeFactions.png", "The Architect of the Fortress"),
        ("December8Parasovreign.png", "The Autopsy of the Common Good"),
        ("December9USStack.png", "The Last Will and Testament of a Unified America"),
        ("December10CognitiveDefense.png", "The Gospel of the Earth"),
        ("December11Ozempic.png", "The Last Great Cure"),
        ("December12Neofertility.png", "The Last Honest Question"),
        ("Dec13Splinternet.png", "The Accidental Sovereigns"),
        ("December14Stackless.png", "The Stackless: The Hidden Geography of the Quiet"),
        ("December15AIasLegislator.png", "The Paralysis of the Gavel"),
        ("December16IncelFodder.png", "The Army of the Unloved"),
        ("December17Superintelligence.png", "The Last Protest of the Human"),
        ("December18Neurodeficits.png", "The Medicalization of Obsolescence"),
        ("December19EqualProtection.png", "The Repeal of the Shadow Law"),
        ("December20AudioSlop.png", "The Chorus of the Dead"),
        ("December21LithiumFortress.png", "The Forging of the Lithium Fortress"),
        ("December22SettlementU.png", "The Terms of Surrender"),
        ("December23NeoUniversities.png", "The Missing Cohort"),
        ("December24Lustration.png", "The Manifesto of the Plunder"),
        ("December25Eternal1955.png", "The Ghost of Christmas Past Is the Only One Left"),
        ("Dec26AlgoTrading.png", "The Last War of the Nanosecond"),
        ("December27LootingChicago.png", "The Math of the Hollow City"),
        ("December28FertilityBottleneck.png", "The Last Generation of the Old World"),
        ("Decemeber29USGFranchise.png", "The Last Audit of Empire"),
        ("December30JobSignaling.png", "The Collapse of the Signal"),
        ("December31Brainrot.png", "The Algorithm of the Grave"),
    ],
}

# Build a lookup: normalized title -> (image, month)
title_to_image = {}
for month, pairs in CORRESPONDENCE.items():
    for img, title in pairs:
        title_to_image[title.strip().lower()] = (img, month)

# ============================================================
# DOC FILES
# ============================================================

DOCS_DIR = os.path.join("om_docs", "Obsidian Mirror")

MONTH_FILES = [
    ("January", "January Obsidian Mirror Articles.docx"),
    ("February", "February Obsidian Mirror Articles.docx"),
    ("March", "March Obsidian Mirror Articles.docx"),
    ("July", "July Obsidian Mirror articles.docx"),
    ("August", "Obsidian Mirror August articles.docx"),
    ("September", "Obsidian Mirror September Articles.docx"),
    ("October", "Obsidian Mirror October Articles.docx"),
    ("November", "Obsidian Mirror November Articles.docx"),
    ("December", "December Obsidian Mirror articles.docx"),
]

# ============================================================
# EXTRACT ARTICLES
# Article boundaries = Heading 3 paragraphs
# ============================================================

def extract_articles_from_doc(filepath, month_name):
    """Extract individual articles from a monthly .docx file.
    
    Returns list of dicts with: title, body_paragraphs, month
    """
    doc = docx.Document(filepath)
    articles = []
    current_article = None
    
    for para in doc.paragraphs:
        text = para.text.strip()
        style_name = para.style.name if para.style else "Normal"
        
        if style_name == "Heading 3" and text:
            # New article starts
            if current_article:
                articles.append(current_article)
            current_article = {
                "title": text,
                "month": month_name,
                "paragraphs": [],
            }
        elif current_article and text:
            # Detect if paragraph is bold (source/metadata line vs body text)
            is_bold = all(run.bold for run in para.runs if run.text.strip()) if para.runs else False
            current_article["paragraphs"].append({
                "text": text,
                "style": style_name,
                "is_bold": is_bold,
            })
    
    # Don't forget the last article
    if current_article:
        articles.append(current_article)
    
    return articles


def build_markdown_body(article):
    """Convert article paragraphs into a clean markdown body."""
    lines = []
    title = article["title"]
    
    for para in article["paragraphs"]:
        text = para["text"]
        
        # Skip the standard OM footer
        if "You are reading an archaeological diagnostic" in text:
            continue
        if "The Hindsight Filter has been applied" in text:
            continue
        if "Obsidian Mirror Archive" in text and "archaeological" in text:
            continue
            
        if para["is_bold"] and para["style"] == "Normal":
            # Bold normal text = section heading (Act I, Act II, etc.) or intro
            lines.append(f"**{text}**")
        else:
            lines.append(text)
    
    return "\n".join(lines)


def title_to_slug(title):
    """Convert article title to a URL-friendly slug."""
    slug = title.lower().strip()
    slug = re.sub(r"[''']", "", slug)  # Remove apostrophes
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)  # Remove special chars
    slug = re.sub(r"\s+", "-", slug)  # Spaces to hyphens
    slug = re.sub(r"-+", "-", slug)  # Collapse multiple hyphens
    slug = slug.strip("-")
    return slug


# ============================================================
# MAIN EXTRACTION
# ============================================================

all_articles = []
unmatched = []

for month_name, docxfile in MONTH_FILES:
    filepath = os.path.join(DOCS_DIR, docxfile)
    if not os.path.exists(filepath):
        print(f"WARNING: Missing {filepath}")
        continue
    
    articles = extract_articles_from_doc(filepath, month_name)
    print(f"{month_name}: extracted {len(articles)} articles")
    
    for art in articles:
        title = art["title"]
        title_lower = title.strip().lower()
        
        # Look up in correspondence table
        if title_lower in title_to_image:
            img, corr_month = title_to_image[title_lower]
            art["image"] = f"/images/{img}"
        else:
            art["image"] = None
            unmatched.append((month_name, title))
        
        art["body"] = build_markdown_body(art)
        art["slug"] = title_to_slug(title)
        all_articles.append(art)

print(f"\nTotal articles extracted: {len(all_articles)}")
print(f"Matched with images: {len([a for a in all_articles if a['image']])}")
print(f"Unmatched: {len(unmatched)}")

if unmatched:
    print("\nUnmatched articles:")
    for month, title in unmatched:
        print(f"  [{month}] {title}")

# ============================================================
# GENERATE data.ts
# ============================================================

def make_preview(title, body, image_path):
    """Generate a preview string (first ~300 chars of body)."""
    # Include title + image + start of body
    preview_body = body[:300] if body else ""
    if image_path:
        return f"{title}\n\n\n\n![{title}]({image_path})\n\n{preview_body}..."
    return f"{title}\n\n{preview_body}..."


# Build the articles array
output_articles = []
now = time.time()

for art in all_articles:
    title = art["title"]
    image = art["image"] or ""
    body_md = art["body"]
    slug = art["slug"]
    filename = f"{slug}.md"
    
    # Build the full body markdown with title and image
    if image:
        full_body = f"# {title}\n\n\n\n![{title}]({image})\n\n{body_md}"
    else:
        full_body = f"# {title}\n\n{body_md}"
    
    preview = make_preview(title, body_md, image)
    
    # Extract [[wiki-links]] for glossary references
    wiki_links = list(set(re.findall(r'\[\[([^\]]+)\]\]', body_md)))
    
    # Detect act structure
    acts = []
    for m in re.finditer(r'Act\s+(I+|[0-9]+)', body_md):
        act_num = m.group(1)
        if act_num == 'I':
            acts.append(1)
        elif act_num == 'II':
            acts.append(2)
        elif act_num == 'III':
            acts.append(3)
        elif act_num == 'IV':
            acts.append(4)
        elif act_num == 'V':
            acts.append(5)
        else:
            try:
                acts.append(int(act_num))
            except:
                pass
    acts = sorted(set(acts)) if acts else [1, 2, 3]  # Default to 3 acts
    
    article_obj = {
        "title": title,
        "filename": filename,
        "primary": "Political",  # Placeholder - to be re-labeled
        "secondary": ["Social"],  # Placeholder - to be re-labeled
        "image": image,
        "acts": acts,
        "preview": preview,
        "body": full_body,
        "mtime": now,
        "original_source": "",
        "month": art["month"],
        "glossary_refs": wiki_links,
    }
    output_articles.append(article_obj)

# Sort alphabetically by title for consistent ordering
output_articles.sort(key=lambda a: a["title"].lower())

# Write as TypeScript
ts_content = "export const SYNO_DATA = " + json.dumps({"articles": output_articles}, indent=2, ensure_ascii=False) + ";\n"

output_path = os.path.join("lib", "data_new.ts")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"\nWrote {len(output_articles)} articles to {output_path}")
print(f"File size: {os.path.getsize(output_path):,} bytes")

# Also write a summary
summary_path = "extraction_summary.txt"
with open(summary_path, "w", encoding="utf-8") as f:
    f.write("OBSIDIAN MIRROR v2 RE-EXTRACTION SUMMARY\n")
    f.write("=" * 50 + "\n\n")
    f.write(f"Total articles: {len(output_articles)}\n")
    f.write(f"With images: {len([a for a in output_articles if a['image']])}\n")
    f.write(f"Without images: {len([a for a in output_articles if not a['image']])}\n\n")
    
    # Per-month breakdown
    month_order = ["January", "February", "March", "July", "August", "September", "October", "November", "December"]
    for m in month_order:
        month_arts = [a for a in output_articles if a["month"] == m]
        with_img = len([a for a in month_arts if a["image"]])
        f.write(f"{m:12s}: {len(month_arts):3d} articles, {with_img:3d} with images\n")
    
    f.write(f"\nArticles with glossary refs: {len([a for a in output_articles if a['glossary_refs']])}\n")
    total_refs = sum(len(a['glossary_refs']) for a in output_articles)
    unique_refs = set()
    for a in output_articles:
        unique_refs.update(a['glossary_refs'])
    f.write(f"Total glossary references: {total_refs}\n")
    f.write(f"Unique glossary terms referenced: {len(unique_refs)}\n")
    
    if unmatched:
        f.write(f"\nUnmatched articles (no image):\n")
        for month, title in unmatched:
            f.write(f"  [{month}] {title}\n")

print(f"Wrote summary to {summary_path}")
