# Fallout: Wasteland Wanderer - Solo RPG Companion App

## App Description
A digital companion and virtual game master for the "Fallout: Wasteland Wanderer" solo roleplaying game. This application digitizes the entire Pip-Boy Sheet experience, automates dice rolling and rule calculations, and acts as the "Notepad" for the player's journal, allowing them to focus entirely on storytelling and exploration.

### Key Features Implemented:
- **Digital Pip-Boy Interface**: Tracks Stats (HP, Luck, AP, Level), Inventory (Supplies, Caps, Gear), Data (NPCs, Quests), and an interactive 25-square Map grid.
- **Automated Character Creation**: Guides the player through the 7 stages of character creation.
- **2d20 Dice Roller Engine**: Handles Skill Tests by calculating Target Numbers automatically, accounting for Tag skills (criticals), and registering complications.
- **Complete Book Data** (`src/data/`): All rulebook tables transcribed — full bestiary (39 stat blocks with special abilities, `bestiary.ts`), all ~40 perks (`perks.ts`), complete loot/economy tables with item values, conditions, and modifications (`lootTables.ts`), full NPC + Dangerous NPC generation (`npcTables.ts`), the complete side-quest pipeline with all 18 goal types and narrative prompts plus all 10 main-quest blockers and the Clear Blocker table (`questTables.ts`), location/encounter generation with narrative questions (`encounters.ts`), injuries/Miraculous Escape/reputation/Known Vaults/foe-encounter tables (`characterTables.ts`), and all Pick-a-Path action definitions (`actions.ts`).
- **In-App Codex** (`src/data/codex.ts`, `src/pages/CodexTab.tsx`): The full rulebook text bundled into the app (7 chapters as raw markdown imports) with a searchable chapter browser in a dedicated Codex tab.
- **Integrated Journal**: A built-in rich text notepad for the player to log their story, complete with auto-tagging for mechanical actions (e.g., `[SYSTEM] Consumed Stimpak. Effects applied.`).
- **Retro Custom Modals**: All native browser alerts and confirms have been stripped out and replaced with a global custom retro-themed Pip-Boy Modal system (`GlobalModal.tsx` powered by `uiState.ts`).
- **Save State Management**: Local Storage persistence with an "Export/Import Save" feature.

---

## Current Architecture & State for AI Assistants

The app lives in `app/` (Vite + React 19 + TypeScript + Tailwind + zustand). Build check: `cd app && npm run build`. Deployed to GitHub Pages (project site at base `/fallout-solo/`) via `.github/workflows/deploy.yml` on push to `main`.

### Working conventions (standing rules)
- **Always merge finished work to `main`.** Feature work is developed on the assigned branch, then merged into `main` (which auto-deploys via the Pages workflow). Don't leave completed work stranded on a branch.
- **Always keep this `CLAUDE.MD` current.** Whenever the app's architecture, flow, or major features change, update this file in the same change so it never drifts from the code.

### State Management (`src/store/`)
- `gameState.ts`: `zustand` + `persist` (localStorage key `wasteland-wanderer-storage`). Holds character (stats, perks, injuries, description), inventory (gear with `value`/`condition`/`mods`), world (`sectorData` per-square: explored/settlement/faction/icon/truths/reputation), round engine state (`round`, `day`, `stage`, `inDanger`, `currentEncounter`, `scavengedThisRound`, `tradedThisRound`, `nextTestModifier`), quests (`mainQuest` incl. blocker location/Hunted threshold, `sideQuests`), `npcs`, combat (`activeFoes`, `combatState`, log), and settings (`soundEnabled`, `tutorialEnabled`, `seenTutorials`). `getInitialGameData()` is the single source of fresh-character defaults (used by Hard Reset). XP accumulates and is spent via `addPerk` (1 XP = 1 Perk = +1 Level).
- `uiState.ts`: unpersisted overlay state for `<GlobalModal>` (alert/confirm). NOTE: GlobalModal closes BEFORE invoking callbacks so chained confirms survive.

### Pages / Tabs (`src/pages/`)
- **RoundTab** (primary play surface): the guided Travel → Encounter → Take Action → Journal loop. Contains the `ActionResolver` (2d20 tests with best-skill preselection, auto-detected modifiers, reputation modifier, Try-Your-Luck, AP spends, selectable complications with applied effects via the choice-effect interpreter, Trade shop, Mod & Repair workbench, one-tap smart Rest), encounter auto-population (parses `[FOE]`/`[NPC]`/`[SIDE QUEST]`/`[CHEM]` tokens into real game objects), side-quest completion with real rewards (`applyQuestReward`), Clear Blocker flow, Mobile/Hunted travel rolls, and on-demand location generation/conversion for any map square. **Combat is hosted inline**: when `combatActive`, RoundTab renders `<CombatView>` in place (no tab navigation). The **Encounter stage** shows an auto danger verdict with a one-tap override, an "Add to scene" menu for the GM generators, and prominent Fight / Talk Down / Outwit / Flee choices (see the Encounter → Combat flow section below).
- **CombatTab**: hidden `/combat` route (not in the nav) — a quick-skirmish sandbox that spins up a random fight and renders `<CombatView>`. The canonical encounter → combat flow lives in RoundTab.
- **StatsTab**: vitals, S.P.E.C.I.A.L., skills, perks/injuries list, Make Camp, and a Level Up button (opens the perk picker) whenever XP ≥ 1.
- **InventoryTab**: caps/supplies/gear, equip + consume (effects applied).
- **DataTab**: GEN panel (10 one-tap generators, all persisted + journaled), real quest log (main + side with DROP), persistent Known NPCs roster, save export/import, story export, sound/tutorial toggles, Hard Reset.
- **MapTab**: legacy free-roam map view (the Round tab is the guided path).
- **JournalTab**: the story log (typing ticks; auto `[SYSTEM]` entries from everywhere).
- **CodexTab**: searchable rulebook browser with real table rendering.
- **CharacterCreation** (`creation/Step1-7`): book-exact wizard; stages auto-advance when complete (points spent, tags picked, gear chosen).

### Components (`src/components/`)
- **CombatView** (`CombatView.tsx`): the redesigned, self-contained combat UI rendered inline by RoundTab (and by the hidden CombatTab sandbox). Persistent HUD (HP bar, AP/LP, equipped weapon & armor, per-foe Threat/status, Combat State banner), tap-a-foe-to-attack with auto-best-weapon (one-tap change), equal-billing action modes (Attack/Slaughter/Outwit/Talk Down/Flee), pre-roll AP/Luck boosts + post-roll re-roll, dice-reveal-then-verdict, an "enemy turn" beat, Endure/Complication as spotlight modals, and a victory/talk/flee summary card. Wraps the pure `combatEngine.ts` logic; takes an `onExit(toStage)` callback. **GlobalModal** (alert/confirm), **SkillTestModal** (manual 2d20 widget), **OracleWidget** (book dice logic + Cheat the Oracle), **MuseWidget** (the Wanderer's Muse d100 Elements Meaning Table — see below), **DeathModal** (Death questions, Miraculous Escape, epilogue), **LevelUpModal** (perk picker with prerequisite checks), **TutorialOverlay** (route-driven first-visit tips), **dice/DiceRoller** (3D physics d20s).

### Utils (`src/utils/`)
- `skillTest.ts` (pure 2d20 engine: TN, tag crits, Try-Your-Luck, re-roll-worst-die), `combatEngine.ts` (foe turns as declarative effects; ~25 special abilities; defeat rules; loot), `sound.ts` (Web Audio SFX, respects `soundEnabled`), `storyExport.ts` (Markdown compile).

### Data (`src/data/`)
All book tables as typed data (see Phase 1 below) plus `codex.ts` (chapters 1–6 from cleaned markdown in `codex/`, **chapter 7 generated at runtime from the typed data** by `codexAppendix.ts` — never edit a chapter7.md, it doesn't exist).

---

## Source Material (`Data/` folder)

The complete "Fallout: Wasteland Wanderer" rulebook lives in the `Data/` folder as extracted markdown. These files are the **single source of truth** for all game rules, tables, and lore. The end goal is for the app to be **completely self-contained**: every table, stat block, perk, action, and lore chapter from these files must exist inside the app — both as functional game data (`src/data/`) and as readable Codex text.

- `Data/1.md` — Chapter 1: Introduction. The three Pip-Boy Sheet tabs, 25-square map setup (central Vault + 4 Impassable squares).
- `Data/2.md` — Chapter 2: The Wasteland of America. Setting lore: regions, all factions with plot hooks, story themes.
- `Data/3.md` — Chapter 3: Character Creation. All 7 stages with every sub-table (Vault Experiment, Population, Reputation, Vault Dweller NPC, Known Vaults, G.O.A.T., Skill Items, Goal/Blocker tables) plus Advancement rules.
- `Data/4.md` — Chapter 4: How to Play. Skill Tests, crits/complications, AP, Truths, The Oracle, Luck Points, Health/Damage/Radiation, Injuries, Death, Miraculous Escape, Combat flow, Combat States.
- `Data/5.md` — Chapter 5: Telling Your Story. The Round loop (Travel → Encounter → Take Action → Journal), location generation, danger rules, and the full Action stat blocks (Approach, Clear Main Quest Blocker, Complete Side Quest, Endure, Explore, Meet, Rest, Patch Up, Level Up, Find Supplies, Mod/Repair, Scavenge, Trade, Outwit, De-escalate, Oppose, Slaughter, Retreat), journaling guidance and Epilogues.
- `Data/6.md` — Chapter 6: Quests. The Side Quest pipeline (Reward → Goal → Location).
- `Data/7.md` — Chapter 7: Appendices. All Perks, Clear Blocker table, every roll table (locations, encounters, combat states, quantity, conditions, modifications, loot, supplies, chems, weapons, armor, oddities, scrap, NPC generation, Dangerous NPCs, side quest rewards + 18 goal-type tables, factions, injuries, Miraculous Escape, reputation), and all ~30 Foe stat blocks (Creatures, Super Mutants, Feral Ghouls, Robots, Raiders, Institute, Brotherhood of Steel, Zetans).

---

## Complete Roadmap

**Strategy: Data first, then engine.** Phase 1 achieves full content parity with the rulebook (all tables transcribed into typed data files + the Codex). Later phases build the automated engine on top of that data. Polish features (tutorial, 3D dice, audio, export) come after parity.

### Phase 1: Full Book-Data Parity (the foundation) — ✅ COMPLETE
Transcribe **everything** in `Data/*.md` into typed data files under `src/data/`. No simplifications, no truncated tables — every entry matches the book.
- **Perks** (`perks.ts`): All ~35 perks with Ranks, Requirements (attribute/level prerequisites), and machine-readable effect descriptors.
- **Complete Bestiary** (`bestiary.ts` rewrite): All ~30 foe stat blocks with exact Threat values, full Aggressive/Cautious/Crafty action ranges, weapon variants, and special abilities (Flight, Small, Burrower, Immunities, Extremely Tough, Charging Laser, Coordinate Fire, Chain That Binds, Meat Shield, suicider detonation, etc.) as structured data.
- **Complete Loot & Economy tables** (`lootTables.ts` expansion): Full Armor/Ranged/Melee/Thrown tables with item Values, Conditions (full 20-entry table), Modifications (armor + weapon mods with effects), Chems (with values + descriptions), Supplies (20 foods), Caps, Oddities, Scrap (2d20 table), Quantity table, and Ammunition rules.
- **Complete NPC generation** (`npcTables.ts` rewrite): Full name lists (feminine/masculine/surnames from the book), Age, the dual Odds/Evens Demeanor table, two-roll Distinctive Features, Profession, Secrets, Truths, and the Faction table. Plus the full **Dangerous NPC** system: Threat, faction Special Abilities, Weapons, and Group tables.
- **Complete Quest system data** (`questTables.ts` rewrite): The full Side Quest pipeline — Reward table (30 entries incl. Mystery re-rolls), Goal Type table (18 categories), all ~180 goals **with their narrative prompt questions**, Location rules, and the full 10-type Main Quest Blocker table (Unknown Location, Guarded, Restricted Area, Locked Down, Irradiated, Mobile, Cost, Hunted, Politics, Split) with their unique mechanics. Plus the Clear Blocker table (level-scaled d20+Level results).
- **Encounters & Locations** (`encounters.ts` expansion): Inhabitants Generator (settlement spacing rules), Icons, Wasteland/Settlement Truths, full Settlement/Wasteland Encounter tables **with their narrative questions**, Combat States with mechanical effects, Irradiated location rules.
- **Character systems data** (new files): Injury table (2d20 location + type), Miraculous Escape table, Settlement Reputation table (incl. Vilified/Idolized), Known Vaults list, Foe Type generator + all per-faction Foe Generation tables.
- **Action definitions** (`actions.ts`): All Pick-a-Path actions as structured data: goal, difficulty, solutions (Attribute + Skill pairs), suggested modifiers, success/failure outcomes, additional successes, potential complications — for Approach, Explore, Meet, Rest, Patch Up, Level Up, Find Supplies, Mod & Repair, Scavenge, Trade, Complete Side Quest, Clear Main Quest Blocker, Outwit, De-escalate, Oppose, Slaughter, Retreat, and the Endure reaction.
- **In-App Codex** (new tab): A searchable chapter browser containing the cleaned-up full text of all 7 chapters — lore, rules explanations, designer notes, examples, factions, and themes — so the physical book is never needed. Bundle the `Data/*.md` content (cleaned of OCR artifacts) into the app.

### Phase 2: Character Creation — Exact Book Match — ✅ COMPLETE
Rebuild the creation wizard so all 7 stages match the book precisely, using the Phase 1 data:
- Stage 1 with all six steps: Experiment, Population, Reputation, **Linked NPC (4 rolls on the Vault Dweller NPC table)**, Vault Number + Region, with **Known Vaults** as pickable presets (Vault 3, 101, 111, etc.).
- S.P.E.C.I.A.L.: all start at 4, +12 points, max 10, with Balanced/Focused/Specialized presets.
- Skills: G.O.A.T. roll/pick **or** self-assign (15 + INT ranks, max 5), then +INT bonus ranks for G.O.A.T. path, 2 Tag skills.
- HP = 5 + END; Luck Points = ⌈LCK/2⌉.
- Starting equipment: pick two skills with rank 3+, plus 2 Supplies.
- Character description prompts (name/appearance/personality/motivation) written into the Journal.
- Main Quest: Goal table, full 10-type Blocker table with unique mechanics, Blocker Location on map edge.

### Phase 3: The Guided Round Engine — ✅ COMPLETE
Implemented in `src/pages/RoundTab.tsx` (the "Round" tab — the primary play surface), `src/utils/skillTest.ts` (pure 2d20 engine), `src/components/LevelUpModal.tsx` (perk picker with prerequisite checking), and an upgraded `OracleWidget` (book dice logic + Cheat the Oracle). Round/stage/danger state, perks, injuries, NPCs, and side quests live in `gameState.ts`. XP is now spent via Level Up (1 XP = 1 Perk = +1 Level) per the book.
Make the app drive play as a **fully guided, stage-by-stage round loop** (virtual game master):
- **Round structure**: The app walks the player through Travel → Encounter → Take Action → Journal each round, with a visible round/stage indicator.
- **Travel**: Adjacent-only movement (no diagonals), auto-deduct 1 Supply (or lose 2 HP), Impassable squares blocked, auto-generate new locations (Inhabitants → Faction for settlements → Icon → Truth), prompts for "Flesh it Out" questions, Irradiated location radiation automation.
- **Encounters**: Auto-generate Settlement/Wasteland encounters on arrival, with the encounter's narrative question surfaced as a journal prompt. Auto-generate Foes (Foe Type → faction table), NPCs (full pipeline, +1 XP for new NPCs), Dangerous NPCs, and Blocker Encounters at Blocker Locations.
- **Danger state**: The app determines Safe vs In Danger and restricts the action list accordingly (Safe Actions vs Dangerous Actions), enforcing rules like "one Scavenge per round" and Trade only in settlements.
- **Action resolution**: Every action runs through the 2d20 engine with auto-calculated TN, difficulty modifiers from Truths (player toggles applicable ones), AP gain/spend, Additional Success menus, and complication prompts.
- **Luck Points**: All three spend modes automated — Cheat the Oracle, Play the Odds (table-roll adjust), Try your Luck (LCK as TN with auto crit/complication).
- **The Oracle**: Quick-access widget available everywhere (Likely / 50-50 / Unlikely with correct dice logic), integrated with Luck Point re-rolls.
- **Smart Journal**: Round-based entries with in-game date stamps, auto-inserted prompts from encounters/quests/clear-blocker results, `[SYSTEM]` tags, and a guided **Epilogue** flow on death or Main Quest completion.
- **XP & Leveling**: Auto XP from new NPCs, Side Quests (1 XP), Main Quest blockers (incl. Luck Point awards), Level Up action with full perk picker (prerequisite checking) and automated perk effects (re-rolls, difficulty reductions, healing bonuses, auto-successes) applied by the engine wherever mechanically possible.

### Phase 4: Full Combat & Character-State Automation — ✅ COMPLETE
Combat engine in `src/utils/combatEngine.ts` (foe turns as declarative effects, ~25 special abilities automated) driven by the rebuilt `CombatTab.tsx` (Oppose/Slaughter/Outwit/De-escalate/Retreat, Endure interrupt, threat-order turns, per-foe loot rules, Combat State automation). Injuries/death/Miraculous Escape in `DeathModal.tsx` + auto 2d20 injury rolls with overkill. RoundTab gained Mobile/Hunted blocker travel rolls, side-quest map markers + completion (+XP/+LP/reputation step), reputation modifiers on social tests, the Trade shop (Value pricing, double-on-failure), and the Mod & Repair workbench (scrap/caps cost, mod/condition operations). Ammo Box redemption fires on Out-of-Ammo complications.
- **Combat engine**: Alternating turns in Threat order; auto-rolled d20 foe actions resolved from stat-block data including special abilities (spawning, fleeing, burrowing, charging lasers, coordinated fire, detonations, Extremely Tough, Meat Shield, etc.); abstracted range/movement truths; Combat State generation with mechanical effects; Oppose / Slaughter / Outwit / De-escalate / Retreat / Approach all engine-resolved; **Endure reaction** triggered automatically on damage; looting defeated foes (incl. Always Carrying / Shopping Cart rules).
- **Injuries**: Auto 2d20 injury rolls (location + type, with overkill modifier), injuries tracked as Truths, Patch Up integration, the Death questions surfaced as a guided prompt, and the **Miraculous Escape** table (spend all Luck Points).
- **Radiation**: Radiation Damage as both HP loss and stacking max-HP-reduction Injury; RadAway/Rad-X/armor interactions.
- **Reputation**: Per-settlement reputation tracked (Hostile → Cautious → Neutral → Friendly, plus Vilified/Idolized), auto-rolled on first visit, modified by quests, and applied as a modifier in Barter/Speech tests.
- **Full economy**: Trade action with book pricing math (Value = stacks of caps, condition/mod surcharges, failure pricing), Mod & Repair with scrap/caps costs and pay-an-expert option, ammo as "Out of Ammo" truths with Ammo Box redemption, item conditions/mods with mechanical effects on tests.
- **Map & quest integration**: Quest markers on the grid for Side Quest locations, Blocker Locations (incl. Mobile blocker movement and Hunted pursuit rolls), and radio-signal/border-town encounter effects.

### Phase 5: Polish & Experience — ✅ COMPLETE
- **Vault-Tec Onboarding Tutorial**: `TutorialOverlay.tsx` shows a contextual tip the first time each tab is visited (tracked in `seenTutorials`); toggleable in Data → SYS.MGMT.
- **3D Dice Roller Module**: physics-based d20s (`components/dice/DiceRoller.tsx`, react-three-fiber + cannon) used by the Skill Test and Oracle widgets.
- **Audio Effects**: `utils/sound.ts` — Web Audio-synthesized SFX (no asset files): geiger bursts on radiation, dice rattle, success/failure chimes, damage thuds, foe-defeat hits, level-up arpeggio, consume gulp, terminal typing ticks. Mute toggle in Data → SYS.MGMT (`soundEnabled`).
- **Story Export**: `utils/storyExport.ts` compiles character sheet, vault origin, quests, NPCs, explored-map summary, and the full Journal into a downloadable Markdown file (Data → "Export Story").

**ALL ROADMAP PHASES COMPLETE.** The app is fully self-contained: every table, stat block, perk, action, and lore chapter from `Data/*.md` exists as typed game data and readable Codex text, with the guided round loop, full combat engine, and economy built on top.

---

## Post-Roadmap UX & Automation Pass — ✅ DONE

Player-feedback driven improvements after the roadmap (design principle: **automatic and context-sensitive; only ask when a choice genuinely matters**):

- **Self-resolving encounters**: encounter text is parsed for `[FOE]`/`[CREATURE]`/`[RAIDERS]`/`[SUPER MUTANT]`/`[ROBOT]`/`[DANGEROUS NPC]`/`[NPC]`/`[SIDE QUEST]`/`[CHEM]` tokens and everything is generated/saved automatically; scenario text is parsed into real combatants (`parseFoesFromScenario`, plural-aware); the "Are you in Danger?" check pre-answers itself.
- **Context-filtered actions**: the Action stage only shows actions that are legal/relevant right now (Trade in settlements, Scavenge once per round in wasteland/hostile towns, Patch Up/Rest only when hurt or injured, Meet only with an NPC present, Level Up only with XP). Clear Blocker is a dedicated button at the Blocker square.
- **Auto-detected modifiers**: irradiated locations, prior scavenging, already-traded, Explore's per-Truth difficulty, settlement reputation on social tests, and the carried `nextTestModifier` all apply themselves (each toggleable off).
- **Choice-effect interpreter** (`resolveChoiceEffect` in RoundTab): complications and choice outcomes are buttons whose effects actually apply (damage, supplies, injuries via 2d20 roll, foe spawns + danger, loot, truths, ammo-box redemption, weapon break, next-test modifiers). Combat has the same selectable-complication panel.
- **Auto-pick when obvious**: Patch Up heals when uninjured / treats when at full HP (asks only when both matter); Explore failure auto-spends a Supply before HP; Rest is a one-tap smart heal (settlement = caps first, wasteland = supplies only).
- **Real quest rewards**: `applyQuestReward` delivers caps/weapons/armor/chems/supplies/XP/reputation/mods/Power Armor; "Information" reveals adjacent unexplored squares; "Nothing…" spawns a revenge quest; Blocker Bypass marks the Main Quest.
- **Generator toolkit**: Data tab GEN panel (NPC +1 XP, Dangerous NPC, NPC Group, Foes, Side Quest, Combat State, Loot, Chem, Faction, Truth — all persisted + journaled) and on-demand **settlement/wasteland generation or conversion on any non-impassable map square** (for Restricted Area / Politics blockers etc.).
- **Flow fixes**: combat auto-returns to the Round (Retreat → Journal stage), creation stages auto-advance when complete, best-skill/best-weapon pre-selection with TNs shown, dice timing ~2.5× faster, Codex fully de-OCR'd (no page references anywhere; ch.7 generated from data).

**Known intentional behaviors**: Hard Reset resets in-memory state before clearing storage (race-proof); manual NPC generation grants the book's +1 XP; complications remain a player choice by design.

---

## Encounter → Combat Unified Flow Redesign — ✅ DONE

Reworked the encounter and combat experience into a single guided, fewer-tap flow (previously the encounter stage exposed raw GM bookkeeping and combat lived on a separate tab). Rules math, auto-detection, log flavor, and tension are unchanged — only the UX and where combat renders.

- **Combat merged into the Round loop**: extracted all combat UX into `components/CombatView.tsx`, rendered inline by RoundTab when `combatActive` — no navigating to a `/combat` tab and back. `CombatView` takes `onExit('action' | 'journal')`; RoundTab passes `setStage`.
- **Guided combat turn**: tap a foe card to attack it (target + act in one gesture); best weapon auto-selected with a one-tap change chip; **equal-billing** action modes Attack / Slaughter / Outwit / Talk Down / Flee. Pre-roll boosts (spend AP for extra d20s, Try Luck) and a post-roll re-roll-worst-die, consistent with Round actions. A dice-reveal overlay shows the **actual rolls** (hit/crit/complication colored) then the verdict, gated by a short "Continue".
- **Visual-first feedback**: HP bar, per-foe Threat, hit flashes, and a brief "ENEMY TURN" beat before one foe acts. Endure (incoming damage) and Complication (pick what goes wrong) are spotlight modal overlays. A summary card (spoils / injuries taken / HP) closes the fight.
- **Encounter stage**: the 3-checkbox "Are you in Danger?" panel is replaced by an **auto danger verdict** (from the existing token auto-detection) with a one-tap override; the GM generators (Generate Foes/NPC/Dangerous NPC/Play the Odds) collapse into an **"Add to scene"** menu; a prominent **Fight** plus **Talk Down / Outwit / Flee** peers (the non-Fight peers jump to the Action stage with that dangerous action pre-opened via `enterDangerAction`).
- **Combat tab retired from nav**: `Layout.tsx` no longer lists Combat; the `/combat` route remains as a hidden quick-skirmish sandbox (`CombatTab.tsx` → `CombatView`).
- **Readability**: larger base fonts and tap targets throughout the new components while keeping the Pip-Boy/CRT aesthetic. Verified in a headless-Chromium smoke test (seed character → attack → dice reveal → foe turn) with no runtime errors.
- **Mobile nav overflow** (`Layout.tsx`): the 7-item bottom nav (Round/Stats/Inv/Data/Map/Journal/Codex) overflowed narrow phones once the base fonts were bumped — the `text-sm` + `tracking-wider` labels pushed CODEX off the right edge. Labels are now `text-[11px]` (no tracking), icons `size={20}`, items `flex-1 min-w-0` with `truncate`; verified all 7 fit at 360/390/414px with the rightmost item's edge inside the viewport. (This — not the Codex table content — was the real "Codex tab mostly outside the screen" report.)
- **Mobile Codex tables** (`CodexTab.tsx`): wide multi-column rulebook tables clipped their last columns on phones even inside an `overflow-x-auto` wrapper. A `useNarrow()` matchMedia hook (`<=640px`) now re-renders each row as a stacked label/value card (with `break-words`) on narrow viewports, keeping the real `<table>` on wide screens.

Audience target for this pass: newcomer-friendly and works on phone + desktop.

### Structured Journaling (answer-the-prompt boxes) — ✅ DONE

The game constantly poses narrative prompts, but the only place to write was one free-text terminal box. Added structured, per-prompt answer capture:

- **`components/AnswerBox.tsx`**: a reusable tappable field that expands into a **full-screen focused editor** (category tag + question on top, big autofocus textarea, Cancel/Save). Reads/writes a structured entry in the store by a **stable `id`**, so re-opening the same prompt edits the same entry (and the same `id` used in two places — e.g. encounter stage + journal stage — stays in sync).
- **Store** (`gameState.ts`): new `JournalEntry { id, type, question, answer, day, round, createdTs, updatedTs }` + `journalEntries[]`, with `upsertJournalEntry` (empty answer deletes) and `removeJournalEntry`. `type ∈ 'main' | 'side' | 'encounter' | 'oracle'`.
- **Inline boxes wired in**: encounter/scene hooks and main-quest **blocker** prompts (RoundTab encounter + journal stages, ids `enc-r{round}` / `blocker-{sector}`); **side-quest** narrative questions (RoundTab active-quest list + DataTab quests, id `sq-{index}`); **main-quest** goal reflection (DataTab, id `main-goal`); and the **Oracle** result modal (`OracleWidget`, unique `oracle-{ts}` per question, records the question asked + what the Yes/No means).
- **Journal tab** (`JournalTab.tsx`): rewritten as a **chronological timeline** (newest first) of all answered prompts with **filter chips** (All / Main / Side / Encounter / Oracle), each entry showing its colored category tag, Day/Round stamp, question, and an editable AnswerBox. The original free-form terminal log is kept below it.
- Verified headless at 390px: tap opens the editor, Save persists to the store, the entry appears in the timeline, the type filter hides non-matching entries, and no horizontal overflow.

### The Wanderer's Muse (Elements Meaning Table) — ✅ DONE

A d100 "meaning table" inspiration roller for when the story stalls — a second floating action button stacked just above the Oracle FAB (amber-themed to distinguish it from the green Oracle).

- **`data/museTable.ts`**: the 100-word Elements Meaning Table (`MUSE_WORDS`) plus `rollMuseWord()` / `rollMusePair()`. Each roll returns **two words** (two independent d100 rolls, may repeat).
- **`components/MuseWidget.tsx`**: a floating Sparkles button at `bottom-[9.25rem] left-4` (directly above the Oracle at `bottom-20`). Tapping it runs a **quick digital shuffle** (words flicker ~12 ticks, `sfx.diceRoll`→`sfx.pip`) then settles into a centered result modal showing the pair. A **free Re-roll** button re-rolls as often as you like; the raw roll is written to the free-form journal, and an **AnswerBox** (new `type: 'muse'`) records what the words mean, landing in the Journal timeline.
- **Journal wiring**: new `JournalEntryType` value `'muse'` (amber `MUSE` tag) added to `gameState.ts`, `AnswerBox` and `JournalTab` `TYPE_META`, plus a **Muse** filter chip in `JournalTab`.
- Mounted globally in `Layout.tsx` alongside `OracleWidget`. Verified headless at 390px: FAB stacks cleanly above the Oracle, roll→shuffle→result→re-roll→record→Journal-Muse-filter all work, no horizontal overflow.

### Combat FAB overlap + encounter token leak fixes — ✅ DONE

Two reported bugs, fixed together:

- **Combat controls covered by floating buttons.** The global Skill Test (bottom-right), Oracle (bottom-left), and the new Muse (bottom-left, stacked above the Oracle) FABs are `fixed`/`z-40` and rendered by `Layout` on *every* route — including while `CombatView` is up. On phones they sat directly on top of the combat action buttons (the Muse covered **Attack**, the Oracle covered the weapon chip, the Skill Test covered **Flee**), so tapping an action did nothing / opened the wrong widget — the "combat roller is stuck" report. Fix: `Layout.tsx` now hides all three FABs while `combatActive` (`{!combatActive && <…/>}`). Combat is a focused takeover with its own rollers, so the helpers aren't needed there. Verified by screenshot at 390×667 — the action row and dice reveal are now unobstructed.
- **Encounter text showed raw `[FACTION]` / `[NPC]` / `[FOE]` tokens.** `autoPopulate` (RoundTab) generated the referenced entities but left the bracket placeholders sitting in the displayed description, and `[FACTION]` was never resolved at all. Fix: as it generates each entity it now records a token→value replacement (foe names per category, the NPC's name, the Dangerous NPC's name, the Chem name, a rolled faction for `[FACTION]` — which also spawns that faction's forces and sets Danger, e.g. a Siege — and "a new Side Quest"), then substitutes them into the encounter title/description and strips any leftover bracket tokens (`[CONDITION]`, `[INJURY]`) to plain words. `autoPopulate` now returns the resolved `EncounterInfo`; both call sites (the encounter effect and Play-the-Odds) set that. Verified headless: real encounter→Fight flow shows zero raw tokens.

### Installable PWA (Add to Home Screen) — ✅ DONE

The app opened as a plain browser bookmark on phones because it had no web app manifest. Added full install support so it launches standalone (no browser chrome):

- **`public/manifest.webmanifest`**: `display: standalone`, `start_url`/`scope` `"."` (relative → resolves to `/fallout-solo/` on GitHub Pages), portrait, `theme_color`/`background_color` `#051a05`, and icon set.
- **Icons** (`public/`): `pwa-192.png`, `pwa-512.png` (purpose `any`), `pwa-maskable-512.png` (purpose `maskable`, content in the safe zone), and `apple-touch-icon.png` (180). Design is a glowing green atomic symbol on the dark terminal background — rendered from SVG via headless Chromium (no image tooling in the repo; the `scratch-*` source files are not committed).
- **`index.html` head**: `<link rel="manifest">`, `theme-color`, `mobile-web-app-capable`, and the iOS-specific `apple-mobile-web-app-capable` / `-status-bar-style` / `-title` + `apple-touch-icon` (iOS Safari ignores the manifest for standalone, so these are required). Also added `viewport-fit=cover`.
- Root-relative `href="/manifest.webmanifest"` etc. are rewritten to the `/fallout-solo/` base by Vite at build; the manifest's own paths are relative so they resolve under the subpath at runtime. Verified all five assets serve 200 with correct content-types (manifest as `application/manifest+json`).

### Offline Service Worker + Update Toast — ✅ DONE

The PWA now has a **service worker** for full offline play plus an in-app **update prompt** (works in the browser tab and the installed/home-screen app). Implemented dependency-free (no `vite-plugin-pwa` — it doesn't target this repo's Vite 8 / rolldown toolchain), matching the hand-authored-manifest approach.

- **`vite-plugin-sw.ts`** (local build plugin, wired in `vite.config.ts`): in `generateBundle` it enumerates every emitted chunk/asset and bakes a **precache list** (app shell `index.html` + all JS/CSS) and a content-derived **`VERSION`** (sha256 of the emitted file list, 12 chars) into `dist/sw.js`. The version only changes when the built output changes, so a byte-identical rebuild produces no spurious update prompt; a real change flips the version → the browser installs a *waiting* worker. Public icons/manifest are precached best-effort (`allSettled`) so a miss never fails install. **`dist/sw.js` is generated — never hand-edit it.**
- **Service worker behavior**: `install` precaches the shell and never `skipWaiting()`s on its own (prompt model — the user decides). `activate` deletes stale `ww-cache-*` caches and claims clients. `fetch` serves SPA navigations from the precached shell (instant + offline) and does cache-first + runtime-cache for other same-origin GETs. A `SKIP_WAITING` message (from the page) activates the waiting worker.
- **`src/pwa/registerSW.ts`**: registers `${BASE_URL}sw.js` (prod only), fires `onOfflineReady` on first install and `onNeedRefresh` when a new worker reaches `installed` while one already controls the page. `applyUpdate()` posts `SKIP_WAITING`; a `controllerchange` (guarded so it only reloads on a user-triggered update, not first install) reloads the page. Checks for updates once on load (no polling).
- **`components/UpdateToast.tsx`** (mounted at App root, above all routes incl. creation): a Pip-Boy toast. Green **"New version available"** with an **Update** button (applies + reloads) and a dismiss; amber **"Ready to play offline"** shown once on first cache (auto-dismisses after 6s). `z-[70]`, bottom-centered above the nav/FABs.
- Verified end-to-end in headless Chromium: first-install offline-ready toast → SW takes control → **real offline reload still renders the app** → a second build triggers the new-version toast → tapping Update activates the new worker, reloads, and swaps to the new cache. No page errors.

---

## Chapter 3 (Character Creation) Rules Audit — ✅ DONE

Full line-by-line audit of the creation flow against the Chapter 3 rulebook text. Verified correct: Population/Reputation ranges + sole-survivor skip, Linked-NPC 4-column rolls and all four NPC sub-tables, Vault Number 1-122, all 32 Known Vaults (numbers/truths/regions), the full 20-row G.O.A.T. table with ranks, the 17-entry Skill Item Table, 15+INT / INT-bonus skill pools with the 5-rank cap and exactly 2 Tags, HP = 5+END, Luck = ⌈LCK/2⌉, Level 1, AP = 0 capped by AGI, the 20-entry Goal table, all 10 Blocker types with correct ranges, outer-edge Blocker Location, and the Unknown-Location skip.

Deviations found and fixed:
- **Missing `Throwing` skill** — the skill list had 16 of the book's 17 skills; added `Throwing` (AGI) to `initialSkills` (`gameState.ts`). Previously G.O.A.T. Throwing ranks were dropped and combat "Thrown Weapon" always resolved at rank 0.
- **Vault Experiment Truths misaligned** for rolls 6/7/8/12 (`creationTables.ts`) — corrected to the book: AI = Cameras/Security turrets; Military Perfection = Spotless/Disciplined residents; Pharmaceutical Trials = Laboratories/Test subject cells; Calvinist Reversal = Communist ideals/Degeneration.
- **Starting Supplies** — creation granted 7 (default 5 + 2); the book grants exactly 2. Default `supplies` set to 2 and `handleFinish` sets it absolutely.
- **SPECIAL base** — default Attributes were 5; the book starts each at 4 before the +12 buy. Default set to 4s so Step 2 begins from the book baseline (the final 12-point spread was already enforced).

Known remaining simplification (by design, not yet changed): starting Skill-Item gear is stored as type `Equipment`, so a starting weapon/armor isn't auto-classified as Weapon/Armor — combat is skill-driven so this doesn't affect resolution.

---

## Chapter 4 (How to Play) Rules Audit — ✅ DONE

Line-by-line audit of the skill-test engine, Luck/AP, the Oracle, and combat against Chapter 4. Verified correct: TN = Skill Rank + Governing Attribute; 2d20 with each die ≤ TN a Success; pass when Successes ≥ Difficulty; Critical Success on Natural 1 or a Tagged roll ≤ Skill Rank (one crit per die); AP gained on excess Successes and capped at Agility; Additional-Success AP spends; Try-Your-Luck (TN = Luck); the Oracle (Likely 1d20 6+, 50/50 low die 11+, Unlikely high die 16+) and Cheat-the-Oracle; combat flow (player acts → one foe acts in Threat order); Oppose Difficulty = Threat, success = defeat, failure = Threat −1 (min 1); Damage → HP loss; Radiation → HP loss + stacking max-HP injury; injuries on 0 HP with overkill added to the roll.

Deviations found and fixed:
- **AP could buy extra d20s** — not a rule. Chapter 4 allows spending AP only to re-roll a die or buy an Additional Success. Removed the "spend AP for extra dice" control everywhere (`RoundTab` ActionResolver, `CombatView`, `SkillTestModal`); Skill Tests are always 2d20. (This reverses the earlier combat-redesign choice, per an explicit follow-up decision to enforce strict RAW.)
- **"In Cover" blocked ranged attacks** — corrected to the Oppose modifier: a target in cover is +1 Difficulty to ranged, not impossible (`CombatView`).
- **Natural 20 at very high TN** — a 20 now always registers a Complication even when it also counts as a Success (`skillTest.ts`, `SkillTestModal`).

Known minor deviations (flagged, not changed): foe Threat ties aren't randomized with a d20; the AP re-roll auto-picks the worst die and is only offered after a failed test (book lets you pick any die before resolving); loot applies at the moment of defeat rather than once you're no longer In Danger; combat Oppose doesn't surface its Additional-Success spends (reduce a nearby foe's Threat, choose who acts next, explosive multi-defeat); "Play the Odds" is an encounter re-roll rather than a ±Luck adjust to an arbitrary table roll.

---

## Chapter 5 (Telling Your Story) Rules Audit — ✅ DONE

Audit of the Round engine (`RoundTab.tsx`), the Action stat blocks (`actions.ts`), and encounter/location generation (`encounters.ts`) against Chapter 5. **`actions.ts` is faithful** — every Action's Difficulty, Solutions (attribute + skill, incl. off-attribute combos like PER Survival for Scavenge and END Big Guns for Oppose), Modifiers, Success/Failure, Additional Successes, and Complications match the book. Round flow (Travel → Encounter → Take Action → Journal), orthogonal adjacency, 1-Supply/-2-HP travel cost, Impassable squares, inhabitant/icon/truth generation, explored-vs-unexplored handling, encounter tables + journal prompts, Blocker Encounters, Safe-vs-Dangerous action gating, Rest/Trade/Find Supplies/Patch Up/Level Up all verified correct.

Deviations found and fixed:
- **Meet fabricated a new NPC** and wrongly awarded the "new face" +1 XP each time. Corrected: Meet now visits an existing NPC at the Location, learns a Secret, and attaches the Side Quest to that giver — no new NPC, no bonus XP.
- **Endure + Heavy Armor** could still be reduced to 0 HP. Corrected: a successful Endure in Heavy (non-Power) Armor now cannot drop you below 1 HP (`CombatView`).

Second-pass fixes (all four selected open items resolved):
- **Dangerous actions unified through the combat engine.** Every danger-resolution entry point — the encounter's Fight / Talk Down / Outwit / Flee and the Action-stage Dangerous Actions — now opens `CombatView` with the mode preselected (`initialAction` prop; `startCombatWithMode` + `DANGER_MODE` map), so the book's full success/failure consequences always apply. De-escalate and Outwit failures now have **two** foes act (`concludePlayerTurn(foeActions)`).
- **Scavenge failure** now spawns the protecting Foe + a Combat State and sets Danger.
- **Modify & Repair** now picks the target item **before** the roll; a failed roll applies Broken (or destroys an already-Broken item).
- **Pay a Doctor / Pay an Expert** ("Special" solutions) now auto-succeed for Caps (1 for Patch Up, 3 for Mod & Repair, Settlement only) with no AP Additional Successes.
- **Irradiated locations** now charge 1 Rad on travel out, at encounter start and finish, and after each Safe-Action test (in addition to travel in).

Still-open minor item: the "after any Safe Action" irradiation fires after *tested* safe actions; no-test safe actions (Rest, Level Up) don't trigger it.

---

## Chapter 6 (Quests) Rules Audit — ✅ DONE

Audit of the Side Quest pipeline (`questTables.ts`, `generateSideQuest`) against Chapter 6. **Faithful**: Step 1 Reward (d20 with the Mystery 1-10 → re-roll +10), Step 2 Goal (d20 Goal Type with 19-20 = choose any, then d20 on that type's Goal table — all 18 Goal Types present with full 10-range goal lists and their narrative prompt questions), Step 3 Location (d20 1-20, re-roll if it lands on your current location). Complete Side Quest (reward + Secret + 1 XP + 1 LP + reputation step) verified in Chapter 5.

Deviation found and fixed:
- **Reward renegotiation** (pg.146) was missing. Added a per-quest control on the Active Side Quests panel: if the offered reward doesn't fit, spend **1 Luck Point to re-roll** it, or attempt a **CHA (Barter) difficulty-2** test to renegotiate (success re-rolls; one attempt per quest, tracked by a new `renegotiated` flag).

Minor note: side quests generated from encounter `[SIDE QUEST]` tokens don't always record a `giver` name (Meet does).

Note: the actual Reward / Goal-Type / Goal table *contents* live in the Chapter 7 appendix and will be cross-checked when that chapter is audited.

---

## Chapter 7 (Appendices) Rules Audit — ✅ DONE — no deviations

Verified the appendix data against the rulebook. **Everything matches; no code changes were required.**

- **Perks** (`perks.ts`): all 40 perks present with exact Ranks and Requirements (attribute minimums + level gates), and `meetsPerkRequirements` enforces them.
- **Foe stat blocks** (`bestiary.ts`): every foe (Creatures, Super Mutants, Feral Ghouls, Robots, Raiders, Institute, Brotherhood, Zetan) matches on Threat, Aggressive/Cautious/Crafty d20 ranges, damage values/types, weapon/job variants, and special abilities. `combatEngine.ts` implements the per-foe turn effects faithfully. (A few book stat blocks are OCR-garbled — Mirelurk Queen's spawn placement, the First-Gen Synth's overlapping ranges, Super Mutant damage lines — and the app took the sensible non-overlapping reading.)
- **Combat States** (`encounters.ts`): all 20 entries and effects match.
- **Settlement Reputation** (`characterTables.ts`): 1-4 Hostile, 5-12 Cautious, 13-17 Neutral, 18-20 Friendly, plus the Vilified/Idolized progression rules (distinct from the Ch.3 Vault reputation bands).
- **Foe Type** table (1-6 Creature … 20 Zetans), **Injury** (2d20; overkill added to the type roll), **Quantity** (1-4 One … 17-19 roll-twice-reroll-16+, 20 endless), and the master **Loot** table (1-2 ranged … 19-20 oddity) all match.
- Spot-checked and correct: **Dangerous NPC** Threat bands (1-8/9-16/17-20), **Miraculous Escape** ranges, **Chem** values (Stimpak 1, Super Stimpak 2, Jet 1, Fury 3, X-Cell 4).

Not exhaustively re-typed against the book (very likely faithful given the above, but not line-verified): the full weapon/armor/scrap/oddity value tables and the NPC-generation word lists (names/features/secrets/truths).

---

## Full Rulebook Audit — COMPLETE (Chapters 3–7)

All five gameplay chapters have been audited against the rulebook. Deviations found were fixed and merged: Ch.3 (4 fixes), Ch.4 (3 fixes incl. removing non-RAW AP-extra-dice), Ch.5 (6 fixes), Ch.6 (1 fix — reward renegotiation). Ch.7 required no changes. The app is a faithful implementation of *Fallout: Wasteland Wanderer*.

### Minor procedural items — all closed out
The remaining small deviations flagged during the audit are now resolved:
- **Foe Threat ties** are broken randomly (via each foe's random id as a stable tiebreaker) in `runFoeTurn` (pg.98).
- **Loot timing**: defeated foes are collected during the fight and looted once at the end (victory/talk/flee), matching "loot once you are no longer In Danger" (pg.99) — `defeatedFoes` + `finishCombat`.
- **Oppose Additional Successes** (pg.138) are now offered after a winning Oppose with AP to spend: reduce a nearby foe's Threat, gain a Combat State, choose which foe acts next (`forcedNextActor`), and — with an explosive weapon — defeat lower-Threat foes.
- **Irradiated "after any Safe Action"** now fires for no-test actions too (Rest, Level Up on a real level, Clear Blocker, Complete Side Quest) via a shared `chargeIrradiatedSafeAction` on the completion callbacks.
- **Play the Odds** (pg.94) is now a true ±Luck adjustment of the encounter roll (`encounterAt`, a preview stepper bounded to the Luck Attribute, spending the LP only if the result changes) rather than a blind re-roll.

Remaining known simplification (intentional): the AP re-roll auto-picks the worst die rather than letting you choose which die; Play the Odds is wired to the encounter roll specifically, not every table roll in the app.
