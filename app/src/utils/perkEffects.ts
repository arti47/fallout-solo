// Perk mechanics (Appendix 1, pg.150-157).
//
// `data/perks.ts` holds the book text; this module holds the machine-readable
// effects and the pure helpers the engine calls. Perks used to be entirely
// cosmetic — taking one changed nothing but a label — so every hook here is
// consumed by a real code path (skill tests, healing, travel, scavenging,
// injuries, combat).
//
// Anything the app genuinely cannot decide for you (does this Foe count as an
// Insect? are you in darkness?) is exposed as a `prompt` perk: the engine
// surfaces it at the moment it could apply and lets you toggle it on.

import type { Special, Skill } from '../store/gameState';

export type AttrKey = keyof Special;

/** Context describing the test/situation currently being resolved. */
export interface PerkContext {
  /** Action name, e.g. 'Scavenge', 'Endure', 'Oppose', 'Modify and Repair Gear'. */
  action?: string;
  /** Skill being rolled, e.g. 'Sneak'. */
  skill?: string;
  /** Governing attribute of the test. */
  attribute?: AttrKey;
  /** True when the test is a ranged weapon attack. */
  ranged?: boolean;
  /** Current/least HP fraction, for perks that key off being hurt. */
  hpBelowHalf?: boolean;
}

export type PerkEffect =
  /** Applied once, at the moment the perk is taken; needs a player choice. */
  | { kind: 'onTake'; choose: 'attribute' | 'tagSkill' | 'skillRanks'; ranks?: number; maxRank?: number }
  /** Applied once, at the moment the perk is taken; no choice needed. */
  | { kind: 'onTakeMaxHp'; amount: number }
  /** Every time you heal HP, add this much. */
  | { kind: 'healBonus'; amount: number }
  /** Every Travel, gain this many Supplies. */
  | { kind: 'travelSupply'; amount: number }
  /** Automatic Difficulty change when `match` holds. */
  | { kind: 'difficulty'; delta: number; match: (c: PerkContext) => boolean; label: string }
  /** Offers a free extra d20 re-roll when `match` holds. */
  | { kind: 'reroll'; match: (c: PerkContext) => boolean; label: string }
  /** Player-confirmed effect surfaced at the right moment. */
  | { kind: 'prompt'; at: 'scavenge' | 'injury' | 'combat' | 'modrepair' | 'defeat'; label: string }
  /** Pure roleplay; no mechanical hook exists. */
  | { kind: 'narrative' };

const RANGED_SKILLS = ['Small Guns', 'Energy Weapons', 'Big Guns', 'Throwing'];
export const isRangedSkill = (skill?: string) => !!skill && RANGED_SKILLS.includes(skill);

/** Machine-readable effects, keyed by the exact perk name in `data/perks.ts`. */
export const PERK_EFFECTS: Record<string, PerkEffect[]> = {
  'S.P.E.C.I.A.L. Training': [{ kind: 'onTake', choose: 'attribute' }],
  'Skill Mastery': [{ kind: 'onTake', choose: 'tagSkill' }],
  'Skilled': [{ kind: 'onTake', choose: 'skillRanks', ranks: 2, maxRank: 6 }],
  'Life Giver': [{ kind: 'onTakeMaxHp', amount: 3 }],

  'Fast Metabolism': [{ kind: 'healBonus', amount: 2 }],
  'Hunter': [{ kind: 'travelSupply', amount: 1 }],

  'Adamantine Skeleton': [{ kind: 'prompt', at: 'injury', label: 'Re-roll this Injury and keep either result' }],

  'Ghost': [{ kind: 'reroll', match: c => c.skill === 'Sneak', label: 'Ghost: re-roll 1d20 in shadow or darkness' }],
  'Infiltrator': [{ kind: 'reroll', match: c => c.skill === 'Lockpick', label: 'Infiltrator: re-roll 1d20 on Lockpick' }],
  'Black Widow/Lady Killer': [
    { kind: 'reroll', match: c => c.attribute === 'C', label: 'Black Widow / Lady Killer: re-roll 1d20 against someone attracted to you' }
  ],
  'Can do!': [{ kind: 'reroll', match: c => c.action === 'Scavenge', label: 'Can do!: re-attempt this Scavenge test free' }],

  'Animal Friend': [
    { kind: 'difficulty', delta: -1, match: c => c.action === 'De-escalate', label: 'Animal Friend: -1 vs Mammals, Lizards and Insects' }
  ],
  'Moving Target': [
    { kind: 'difficulty', delta: -1, match: c => c.action === 'Endure', label: 'Moving Target: -1 Endure while moving out of Power Armor' }
  ],
  'Awareness': [
    { kind: 'difficulty', delta: -1, match: c => c.action === 'Oppose' && !!c.ranged, label: 'Awareness: -1 vs your marked Foe' }
  ],

  'Cap Collector': [{ kind: 'prompt', at: 'scavenge', label: 'Cap Collector: roll d20 vs Luck for a Stack of Caps' }],
  'Pharma Farma': [{ kind: 'prompt', at: 'scavenge', label: 'Pharma Farma: take Chems instead of this loot' }],
  'Scrounger': [{ kind: 'prompt', at: 'scavenge', label: 'Scrounger: take Scrap instead of this loot' }],

  'Armorer': [{ kind: 'prompt', at: 'modrepair', label: 'Armorer: add an extra Modification to Armor' }],
  'Blacksmith': [{ kind: 'prompt', at: 'modrepair', label: 'Blacksmith: add an extra Modification to a Melee Weapon' }],

  'Bloody Mess': [{ kind: 'prompt', at: 'defeat', label: 'Bloody Mess: d20 vs Luck to gib a second Foe' }],
  'Better Criticals': [{ kind: 'prompt', at: 'combat', label: 'Better Criticals: 1 LP to Defeat a random Foe after a winning Oppose' }],
  'Gun Fu': [{ kind: 'prompt', at: 'combat', label: 'Gun Fu: 1 LP to defeat a second target of equal or lower Threat' }],
  'Steady Aim': [{ kind: 'prompt', at: 'combat', label: 'Steady Aim: 1 LP to re-roll both dice when you scored no Success' }],
  'Paralyzing Palm': [{ kind: 'prompt', at: 'combat', label: 'Paralyzing Palm: 1 LP to stun the Foe after a failed Unarmed Oppose' }],
  'Hit the Deck': [{ kind: 'prompt', at: 'combat', label: 'Hit the Deck: 1 LP to halve explosion Damage' }],
  'Mysterious Stranger': [{ kind: 'prompt', at: 'combat', label: 'Mysterious Stranger: 1 LP at the start of combat, pick 2 numbers' }],
  'Cautious Nature': [{ kind: 'prompt', at: 'combat', label: 'Cautious Nature: 1 LP to replace the Combat State with Distant Foe' }],
  'Dodger': [{ kind: 'prompt', at: 'combat', label: 'Dodger: 1 LP to reduce this Endure Difficulty by 1' }],
  'Finesse': [{ kind: 'prompt', at: 'combat', label: 'Finesse: 1 LP to reduce a ranged Oppose Difficulty by 1' }],
  'Adrenaline Rush': [{ kind: 'prompt', at: 'combat', label: 'Adrenaline Rush: count STR as 12 for one STR test while below half HP' }],
  'Barbarian': [{ kind: 'prompt', at: 'combat', label: 'Barbarian: automatically succeed one END test this Round' }],
  'Entomologist': [{ kind: 'prompt', at: 'combat', label: 'Entomologist: reduce Insect Threat by 1' }],

  'Party Boy/Party Girl': [{ kind: 'prompt', at: 'scavenge', label: 'Party Boy / Party Girl: Heal 2 HP from an alcoholic drink' }],

  // No mechanical hook exists for these — they shape the fiction, not the maths.
  'Butcher': [{ kind: 'narrative' }],
  'Cannibal': [{ kind: 'narrative' }],
  'Iron Fist': [{ kind: 'narrative' }],
  'Light Step': [{ kind: 'narrative' }],
  'Night Person': [{ kind: 'narrative' }],
  'Nuclear Physicist': [{ kind: 'narrative' }]
};

export type OwnedPerk = { name: string; rank: number };

const effectsFor = (perks: OwnedPerk[]): { perk: OwnedPerk; effect: PerkEffect }[] =>
  perks.flatMap(p => (PERK_EFFECTS[p.name] ?? []).map(effect => ({ perk: p, effect })));

/** Total automatic Difficulty change from perks for this test, plus labels to
 *  show the player why the number moved. */
export const perkDifficulty = (perks: OwnedPerk[], ctx: PerkContext): { delta: number; labels: string[] } => {
  let delta = 0;
  const labels: string[] = [];
  for (const { perk, effect } of effectsFor(perks)) {
    if (effect.kind !== 'difficulty' || !effect.match(ctx)) continue;
    // Ranked perks apply once per rank (Animal Friend rank 2 is a stronger version
    // in the book, but never stacks beyond its printed effect).
    delta += effect.delta;
    labels.push(`${perk.name} — ${effect.label}`);
  }
  return { delta, labels };
};

/** Free re-rolls this test qualifies for. */
export const perkRerolls = (perks: OwnedPerk[], ctx: PerkContext): string[] =>
  effectsFor(perks)
    .filter(({ effect }) => effect.kind === 'reroll' && effect.match(ctx))
    .map(({ effect }) => (effect as Extract<PerkEffect, { kind: 'reroll' }>).label);

/** Extra HP added to every heal (Fast Metabolism). */
export const perkHealBonus = (perks: OwnedPerk[]): number =>
  effectsFor(perks).reduce((n, { perk, effect }) =>
    effect.kind === 'healBonus' ? n + effect.amount * Math.max(1, perk.rank) : n, 0);

/** Supplies gained on each Travel (Hunter). */
export const perkTravelSupplies = (perks: OwnedPerk[]): number =>
  effectsFor(perks).reduce((n, { perk, effect }) =>
    effect.kind === 'travelSupply' ? n + effect.amount * Math.max(1, perk.rank) : n, 0);

/** Perk reminders relevant at a given moment. */
export const perkPrompts = (perks: OwnedPerk[], at: Extract<PerkEffect, { kind: 'prompt' }>['at']): string[] =>
  effectsFor(perks)
    .filter(({ effect }) => effect.kind === 'prompt' && effect.at === at)
    .map(({ effect }) => (effect as Extract<PerkEffect, { kind: 'prompt' }>).label);

/** What a newly-taken perk still needs from the player, if anything. */
export const perkOnTake = (name: string): Extract<PerkEffect, { kind: 'onTake' }> | null => {
  const e = (PERK_EFFECTS[name] ?? []).find(x => x.kind === 'onTake');
  return (e as Extract<PerkEffect, { kind: 'onTake' }>) ?? null;
};

/** Immediate max-HP change from taking a perk (Life Giver). */
export const perkOnTakeMaxHp = (name: string): number =>
  (PERK_EFFECTS[name] ?? []).reduce((n, e) => (e.kind === 'onTakeMaxHp' ? n + e.amount : n), 0);

/** Skills eligible for a new Tag (Skill Mastery). */
export const untaggedSkills = (skills: Skill[]): Skill[] => skills.filter(s => !s.isTag);
