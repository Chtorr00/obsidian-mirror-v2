"""
Compare images required by the correspondence table with what's in public/images,
find source files, and generate a copy script.
"""
import os
import re

# All images referenced in the correspondence table (from OM Picture_title alignment.md)
REQUIRED_IMAGES = [
    # January (31)
    "Jan1SycophanticAI.png", "Jan2SexRecession.png", "Jan3CleanAir.png", "Jan4BernieBro.png",
    "Jan5Bottleneck.png", "Jan6DeclineWierdness.png", "Jan7DarkForestInternet.png", "Jan8AICompanion.png",
    "Jan9CollapseMovie.png", "Jan10PublicTrust.png", "Jan11BabyBust.png", "Jan12EnergyCannibal.png",
    "Jan13BlankSlate.png", "Jan14CrisisMeaning.png", "Jan15NeoLiteracy.png", "Jan16IVFEmbryo.png",
    "Jan17AIFirewall.png", "jan18SaintAmelia.png", "Jan19Daemon.png", "Jan20extendedmind.png",
    "Jan21PostCollege.png", "Jan22DigitalLSD.png", "Jan23FragCulture.png", "Jan24SocialMediaBan.png",
    "Jan25BassPro.png", "Jan26AIThermodynamics.png", "Jan27BTCelite.png", "Jan28PageSwipe.png",
    "Jan29AIArtisan.png", "Jan30CastawayGen.png", "Jan31TribalPatchwork.png",
    # February (28)
    "Feb1AnchorAI.png", "Feb2MoltRepublic.png", "Feb3NickLandp1.png", "Feb4NickLandp2.png",
    "Feb5AlienLLM.png", "Feb6TetradSoul.png", "Feb7ExodusArchitect.png", "Feb8CatechismVampire.png",
    "Feb9SchismSuperman.jpg", "Feb10ArrestAlgo.png", "Feb11TransparentAI.png", "Feb12PatientZero.png",
    "Feb12PurgePaper.png", "Feb14ManualDivorce.png", "Feb15IconFall.png", "Feb16TowerBabble.png",
    "Feb17PermissionSlip.png", "Feb18BlindWatch.png", "Feb19AssistiveStudent.png", "Feb20FirstFlash.png",
    "Feb21ObitWitness.png", "Feb22SoulStealer.png", "Feb23ReclamationCommons.png", "Feb24PacificationPalate.png",
    "Feb25ProleMind.png", "Feb26Archeofuturist.png", "Feb27ArchInherit.png", "Feb28PhilosophyDemolitionx.png",
    # March (15)
    "March1Hapaborean.png", "March2AIEventHorizon.png", "March3AIPlateau.png", "March4ArchitectCage.png",
    "March5PsychVoid.png", "March6SchismStroller.png", "March7Casino.png", "March8DiagnosisUnteachable.png",
    "March9AutomationIntimacy.png", "March10BallotBalkans.png", "March11DoctrineHarpoon.png",
    "March12EnclosureEye.png", "March13MonetizationFog.png", "March14OroborosMind.png", "March15PromethianPet.png",
    # July (25)
    "July7Shadow.jpeg", "July8EnginTomorowCrises.jpeg", "July9PleaForPolite.jpeg",
    "July10GhostInNetwork.jpeg", "July11ObituaryForNeural.jpeg", "July12ConnectiveTissue.jpeg",
    "July13WarThatDissolved.jpeg", "July14OracleMachine.jpeg", "July15LastAudit.jpeg",
    "July16FinancialEngine.jpeg", "July17BlueprintFortress.jpeg", "July18BlueprintAI.jpeg",
    "July19NHSMedical.jpeg", "July20SupplyChain.jpeg", "July21BitcoinNewSystem.jpeg",
    "July22AIunemployment.jpeg", "July23EndOfHistory.jpeg", "July24disinformationCathedral.jpeg",
    "July25AIplanUS.jpeg", "July26SevenTrends.jpeg", "July27TechCoToBlame.jpeg",
    "July28AIGrid.jpeg", "July29SouthChinaSea.jpeg", "July30Superintelligence.jpeg",
    "July31TechnologyForGood.jpeg",
    # August (31) - includes August5 which is missing from table, using August6DebtWave for article 5 slot
    "August1FracturedGrid.jpeg", "August2AIAvatar.jpeg", "August3DemocracyDecline.jpeg",
    "August4EnergyWar.jpeg", "August6AGIinChains.jpeg",
    "August7AIperfectPartner.jpeg", "August8declingingDemocracy.jpeg", "August9FortressEuropa.jpeg",
    "August10CultureDivide.jpeg", "August11NetworkStateish.jpeg", "August12crisisPosterity.jpeg",
    "August13Artic.jpeg", "August14AIalienation.jpeg", "August15Bitcoinforecast.jpeg",
    "August16ResourceWars.jpeg", "August17AIpriesthood.jpeg", "August18ExtendFamily.jpeg",
    "August19EnergyArcology.jpeg", "August20BalkanizedUS.jpeg", "August21ScrollPrison.jpeg",
    "August22UBIwoes.jpeg", "August23ArticFortress.jpeg", "August24UniversityDissolve.jpeg",
    "August25EuroAI.jpeg", "August26GeneSequence.png", "August27Lonlinessepidemic.png",
    "August28Mutualist.jpeg", "August29TradePlugs.jpeg", "August30RedVBlue.jpeg",
    "August31DigitalSiren.jpeg",
    # September (30)
    "September1Antartica.jpeg", "September2NetState.jpeg", "September3EnvRuling.png",
    "September4DigitalFog.png", "September5AIBarrier.png", "September6ShadowEconomy.jpeg",
    "September7AIEnergyGoliath.png", "September8ReadingDecline.png", "September9SocialCohesion.png",
    "September10BRICAxis.png", "September11KirkAssassination.png", "September12PoisonerHandbook.png",
    "September13LondonStack.png", "September14AInursery.png", "September15BabyBust.png",
    "September16maternalbond.png", "September17MemeNihilist.png", "September18ChinaEVoverproduction.png",
    "September19SovStackU.png", "September20StablecoinBanking.png", "September21OceanTreaty.png",
    "September22NewScholars.png", "September24Diversity.png", "September25SocialMediaLawsuit.png",
    "September26FourthTurning.png", "September27Palantir.png", "September28AINursery.png",
    "September29AIparent.png", "September30BitcoinKing.png",
    # October (24)
    "October1GenZriot.png", "October2BitcoinProphesy.png", "October3SupplyChain.png",
    "October9LandDugin.png", "October10SharpieSupplyChain.png", "October11AISchool.png",
    "October12AICyberWar.png", "October13OnlineGambling.png", "October14MulticulturalismUK.png",
    "October15Poasting.png", "October16FeminineWoke.png", "October17TribalKnowledge.png",
    "October18HigherEdFailing.png", "October19GeneEditing.png", "October20AIEnergyWall.png",
    "October21Angel.png", "October23ClimateAI.png", "October24Palintir.png",
    "October25GrokStancil.png", "October26NuclearTower.png",
    "October27DancingNurses.png", "October28DNAedit.png", "October29FiatExperts.png", "October30WEF.png",
    # November (21)
    "November2CurricCollapse.png", "November4DecentralizedEcon.png", "November5Abundance.png",
    "November6AIHierarchy.png", "November8Goliath.png", "November10MarvelFaith.png",
    "November12HumanPhyla.png", "November14Culling.png", "November14BirthWolf.png",
    "November15SciCollapse.png", "November18SpiralAI.png", "November19HumanPhyla.png",
    "November20DigitalHate.png", "November23SpaceRocket.png", "November24LyingGod.png",
    "November25Retrocausality.png", "November26PlanetBoundaries.png", "November27SovStackBirth.png",
    "November28SovDefault.png", "November29GenZbuilder.png", "November30AntiAging.png",
    # December (31)
    "December1Parasovereigns.png", "December2Romantasy.png", "December3LastChance.png",
    "December4Polemics.png", "December5CurePoverty.png", "December6Canada.png",
    "December7NATradeFactions.png", "December8Parasovreign.png", "December9USStack.png",
    "December10CognitiveDefense.png", "December11Ozempic.png", "December12Neofertility.png",
    "Dec13Splinternet.png", "December14Stackless.png", "December15AIasLegislator.png",
    "December16IncelFodder.png", "December17Superintelligence.png", "December18Neurodeficits.png",
    "December19EqualProtection.png", "December20AudioSlop.png", "December21LithiumFortress.png",
    "December22SettlementU.png", "December23NeoUniversities.png", "December24Lustration.png",
    "December25Eternal1955.png", "Dec26AlgoTrading.png", "December27LootingChicago.png",
    "December28FertilityBottleneck.png", "Decemeber29USGFranchise.png",
    "December30JobSignaling.png", "December31Brainrot.png",
]

# Source directories
SOURCE_DIR = r"C:\Users\markj\OneDrive\Documents\AI\ObsidianMirror"
DEST_DIR = r"public\images"

# Build index of source images by filename (case-insensitive)
source_index = {}
for root, dirs, files in os.walk(SOURCE_DIR):
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.png', '.jpeg', '.jpg']:
            source_index[f.lower()] = os.path.join(root, f)

# Check existing
existing = set()
if os.path.exists(DEST_DIR):
    existing = set(os.listdir(DEST_DIR))

existing_lower = {f.lower() for f in existing}

# Find missing
missing = []
found_in_source = []
not_found_anywhere = []

for img in REQUIRED_IMAGES:
    if img.lower() not in existing_lower:
        if img.lower() in source_index:
            found_in_source.append((img, source_index[img.lower()]))
        else:
            not_found_anywhere.append(img)

print(f"Total required images: {len(REQUIRED_IMAGES)}")
print(f"Already in public/images: {len(REQUIRED_IMAGES) - len(found_in_source) - len(not_found_anywhere)}")
print(f"Found in source, need to copy: {len(found_in_source)}")
print(f"NOT FOUND ANYWHERE: {len(not_found_anywhere)}")

if found_in_source:
    print(f"\n{'='*60}")
    print("IMAGES TO COPY:")
    print(f"{'='*60}")
    for img, src in found_in_source:
        print(f"  {img}")
        print(f"    FROM: {src}")

if not_found_anywhere:
    print(f"\n{'='*60}")
    print("IMAGES NOT FOUND:")
    print(f"{'='*60}")
    for img in not_found_anywhere:
        print(f"  {img}")

# Generate PowerShell copy commands
if found_in_source:
    print(f"\n{'='*60}")
    print("POWERSHELL COPY COMMANDS:")
    print(f"{'='*60}")
    for img, src in found_in_source:
        dest = os.path.join(DEST_DIR, img)
        print(f'Copy-Item "{src}" "{dest}"')
