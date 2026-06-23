// Chapter 7 (Appendices) for the Codex — generated from the app's own typed
// game data, so the reference text is always clean and always in sync.
import { PERKS } from './perks';
import { CLEAR_BLOCKER_TABLE, QUEST_REWARDS, GOAL_TYPES, MAIN_QUEST_BLOCKERS } from './questTables';
import {
  LOCATION_ICONS, WASTELAND_TRUTHS, SETTLEMENT_TRUTHS,
  SETTLEMENT_ENCOUNTERS, WASTELAND_ENCOUNTERS, COMBAT_STATES
} from './encounters';
import {
  CONDITIONS, ARMOR_MODS, WEAPON_MODS, ARMOR_TABLE, RANGED_WEAPONS,
  MELEE_WEAPONS, THROWN_WEAPONS, CHEMS, SUPPLIES, ODDITIES, SCRAP_TABLE
} from './lootTables';
import {
  FACTIONS, DEMEANOR_ODDS, DEMEANOR_EVENS, FEATURES_ROLL_ONE, FEATURES_ROLL_TWO,
  PROFESSIONS, NPC_SECRETS, NPC_TRUTHS, DANGEROUS_NPC_ABILITIES, DANGEROUS_NPC_WEAPONS
} from './npcTables';
import {
  INJURY_TYPES, INJURY_LOCATIONS, MIRACULOUS_ESCAPES, REPUTATION_DESCRIPTIONS, KNOWN_VAULTS
} from './characterTables';
import { BESTIARY } from './bestiary';

const range = (r: [number, number]) => (r[0] === r[1] ? `${r[0]}` : `${r[0]}-${r[1]}`);

const d20Table = (header: string, entries: string[]): string => {
  const rows = entries.map((e, i) => `| ${i + 1} | ${e.replace(/\|/g, '/')} |`);
  return [`| d20 | ${header} |`, '| --- | --- |', ...rows].join('\n');
};

export const buildAppendixMarkdown = (): string => {
  const md: string[] = [];
  const h2 = (t: string) => md.push(`\n## ${t}\n`);
  const h3 = (t: string) => md.push(`\n### ${t}\n`);
  const p = (t: string) => md.push(t + '\n');

  md.push('# Appendices: Perks, Roll Tables & Foes\n');
  p('Every table in this chapter is generated from the same data the app uses to run your game.');

  // ============== PERKS ==============
  h2('Appendix 1: Perks');
  p('Spend 1 XP via the Level Up action to gain a Perk (and +1 Level). You must meet all Requirements.');
  md.push('| Perk | Ranks | Requirements | Effect |');
  md.push('| --- | --- | --- | --- |');
  for (const perk of PERKS) {
    const reqs: string[] = [];
    if (perk.requirements.attribute) {
      reqs.push(Object.entries(perk.requirements.attribute).map(([a, v]) => `${a} ${v}`).join(', '));
    }
    if (perk.requirements.level) reqs.push(`Level ${perk.requirements.level}+`);
    const effect = (perk.rankDescriptions ?? [perk.description]).join(' ');
    md.push(`| **${perk.name}** | ${perk.ranks === Infinity ? '∞' : perk.ranks} | ${reqs.join(' • ') || '—'} | ${effect.replace(/\|/g, '/')} |`);
  }

  // ============== CLEAR BLOCKER ==============
  h2('Appendix 2: Roll Tables');
  h3('Clear Blocker Table (d20 + Level)');
  md.push('| Result | Name | Effect |');
  md.push('| --- | --- | --- |');
  for (const e of CLEAR_BLOCKER_TABLE) {
    const r = e.range[1] >= 999 ? `${e.range[0]}+` : range(e.range);
    md.push(`| ${r} | **${e.name}** | ${e.effect} |`);
  }

  // ============== LOCATIONS ==============
  h3('Location Icons (d20)');
  md.push(d20Table('Icon', LOCATION_ICONS));
  h3('Wasteland Truths (d20)');
  md.push(d20Table('Truth', WASTELAND_TRUTHS));
  h3('Settlement Truths (d20)');
  md.push(d20Table('Truth', SETTLEMENT_TRUTHS));

  // ============== ENCOUNTERS ==============
  h3('Settlement Encounters (d20)');
  md.push('| d20 | Encounter | Question |');
  md.push('| --- | --- | --- |');
  SETTLEMENT_ENCOUNTERS.forEach((e, i) => md.push(`| ${i + 1} | **${e.name}**: ${e.description} | *${e.question}* |`));
  h3('Wasteland Encounters (d20)');
  md.push('| d20 | Encounter | Question |');
  md.push('| --- | --- | --- |');
  WASTELAND_ENCOUNTERS.forEach((e, i) => md.push(`| ${i + 1} | **${e.name}**: ${e.description} | *${e.question}* |`));
  h3('Combat States (d20)');
  md.push('| d20 | State | Description |');
  md.push('| --- | --- | --- |');
  COMBAT_STATES.forEach((s, i) => md.push(`| ${i + 1} | **${s.name}** | ${s.description} |`));

  // ============== EQUIPMENT ==============
  h3('Conditions (d20)');
  md.push(d20Table('Condition', CONDITIONS));

  h3('Modifications (d20)');
  md.push('| d20 | Armor Mod | Weapon Mod |');
  md.push('| --- | --- | --- |');
  for (let i = 0; i < ARMOR_MODS.length; i++) {
    md.push(`| ${range(ARMOR_MODS[i].range)} | **${ARMOR_MODS[i].name}**: ${ARMOR_MODS[i].description} | **${WEAPON_MODS[i].name}**: ${WEAPON_MODS[i].description} |`);
  }

  h3('Armor (d20) — Value in Stacks of Caps');
  md.push('| Roll ≤ | Armor | Value |');
  md.push('| --- | --- | --- |');
  ARMOR_TABLE.forEach(a => md.push(`| ${a.roll} | ${a.name} | ${a.value} |`));

  h3('Ranged Weapons (2d20)');
  md.push('| Roll ≤ | Weapon | Value |');
  md.push('| --- | --- | --- |');
  RANGED_WEAPONS.forEach(w => md.push(`| ${w.roll} | ${w.name} | ${w.value} |`));

  h3('Melee Weapons (2d20)');
  md.push('| Roll ≤ | Weapon | Value |');
  md.push('| --- | --- | --- |');
  MELEE_WEAPONS.forEach(w => md.push(`| ${w.roll} | ${w.name} | ${w.value} |`));

  h3('Thrown Weapons & Explosives (d20)');
  md.push('| Roll ≤ | Weapon | Value |');
  md.push('| --- | --- | --- |');
  THROWN_WEAPONS.forEach(w => md.push(`| ${w.roll} | ${w.name} | ${w.value} |`));

  h3('Chems (d20; on a 1, re-roll twice)');
  md.push('| Roll ≤ | Chem | Value | Description |');
  md.push('| --- | --- | --- | --- |');
  CHEMS.forEach(c => md.push(`| ${c.roll} | **${c.name}** | ${c.value} | ${c.description} |`));

  h3('Supplies (d20) — each grants a Stack of Supplies');
  md.push(d20Table('Supply', SUPPLIES));

  h3('Oddities (d20)');
  md.push('| d20 | Oddity | Quirk |');
  md.push('| --- | --- | --- |');
  ODDITIES.forEach((o, i) => md.push(`| ${i + 1} | **${o.name}** | ${o.quirk} |`));

  h3('Scrap (2d20)');
  md.push('| Roll ≤ | Scrap |');
  md.push('| --- | --- |');
  SCRAP_TABLE.forEach(s => md.push(`| ${s.roll} | ${s.name} |`));

  // ============== NPCS ==============
  h3('Factions (d20)');
  md.push(d20Table('Faction', FACTIONS));

  h3('NPC Demeanor (d20 for Odds/Evens, then d20)');
  md.push('| d20 | Odds | Evens |');
  md.push('| --- | --- | --- |');
  DEMEANOR_ODDS.forEach((o, i) => md.push(`| ${i + 1} | ${o} | ${DEMEANOR_EVENS[i]} |`));

  h3('NPC Distinctive Features (roll twice — one per column)');
  md.push('| d20 | Roll One | Roll Two |');
  md.push('| --- | --- | --- |');
  FEATURES_ROLL_ONE.forEach((f, i) => md.push(`| ${i + 1} | ${f} | ${FEATURES_ROLL_TWO[i]} |`));

  h3('NPC Professions (d20)');
  md.push(d20Table('Profession', PROFESSIONS));
  h3('NPC Secrets (d20)');
  md.push(d20Table('Secret', NPC_SECRETS));
  h3('NPC Truths (d20)');
  md.push(d20Table('Truth', NPC_TRUTHS));

  h3('Dangerous NPC Special Abilities (d20 / by Faction)');
  md.push('| Roll | Faction | Ability |');
  md.push('| --- | --- | --- |');
  DANGEROUS_NPC_ABILITIES.forEach(a =>
    md.push(`| ${range(a.range)} | ${a.faction} | **${a.name}**: ${a.description}${a.grants ? ` *(Gains: ${a.grants})*` : ''} |`));

  h3('Dangerous NPC Weapons (d20, read in pairs)');
  md.push(d20Table('Weapons', DANGEROUS_NPC_WEAPONS.flatMap(w => [w, w])));

  // ============== QUESTS ==============
  h3('Side Quest Rewards (d20; Mystery re-rolls at +10)');
  md.push('| Roll | Reward | Description |');
  md.push('| --- | --- | --- |');
  QUEST_REWARDS.forEach(r => {
    const label = r.range[1] >= 99 ? `${r.range[0]}+` : range(r.range);
    md.push(`| ${label} | **${r.name}** | ${r.description} |`);
  });

  h3('Main Quest Blockers (d20)');
  md.push('| Roll | Blocker | Description |');
  md.push('| --- | --- | --- |');
  MAIN_QUEST_BLOCKERS.forEach(b => md.push(`| ${range(b.range)} | **${b.name}** | ${b.description} |`));

  h3('Side Quest Goal Types (d20; 19-20 = choose any)');
  md.push(d20Table('Goal Type', [...GOAL_TYPES.map(g => g.name), 'Choose any', 'Choose any']));

  for (const type of GOAL_TYPES) {
    h3(`Goals — ${type.name}`);
    p(`*"${type.flavor}"*`);
    md.push('| Roll | Goal | Questions |');
    md.push('| --- | --- | --- |');
    type.goals.forEach(g => md.push(`| ${range(g.range)} | ${g.goal} | *${g.questions}* |`));
  }

  // ============== MISC ==============
  h3('Injuries (2d20: one for type +overkill, one for location)');
  md.push('| Roll | Injury | Location |');
  md.push('| --- | --- | --- |');
  INJURY_TYPES.forEach((t, i) => {
    const loc = INJURY_LOCATIONS.filter(l => l.range[0] >= t.range[0] && l.range[1] <= t.range[1]).map(l => l.location).join(' / ')
      || INJURY_LOCATIONS[Math.min(i * 2, INJURY_LOCATIONS.length - 1)].location;
    md.push(`| ${range(t.range)} | ${t.injury} | ${loc} |`);
  });

  h3('Miraculous Escape (d20 — spend ALL Luck Points)');
  md.push('| Roll | Escape | Description |');
  md.push('| --- | --- | --- |');
  MIRACULOUS_ESCAPES.forEach(e => md.push(`| ${range(e.range)} | **${e.name}** | ${e.description} |`));

  h3('Settlement Reputation');
  md.push('| Reputation | Description |');
  md.push('| --- | --- |');
  Object.entries(REPUTATION_DESCRIPTIONS).forEach(([k, v]) => md.push(`| **${k}** | ${v} |`));

  h3('Known Vaults');
  md.push('| Vault | Truths | Region |');
  md.push('| --- | --- | --- |');
  KNOWN_VAULTS.forEach(v => md.push(`| ${v.number} | ${v.truths.join(', ')} | ${v.region} |`));

  // ============== FOES ==============
  h2('Appendix 3: Foe Stat Blocks');
  let lastCategory = '';
  for (const foe of BESTIARY) {
    if (foe.category !== lastCategory) {
      h3(`${foe.category}s`);
      lastCategory = foe.category;
    }
    md.push(`\n#### ${foe.name} (Threat ${foe.threat})\n`);
    p(`*${foe.background}*`);
    md.push('| Roll | Action | Effect |');
    md.push('| --- | --- | --- |');
    for (const a of foe.actions) {
      const dmg = a.damage ? ` **(${a.damage} ${a.damageType ?? ''} Damage)**` : '';
      md.push(`| ${range(a.range)} | ${a.type} | ${a.description.replace(/\|/g, '/')}${dmg} |`);
    }
    if (foe.variants && foe.variants.length > 0) {
      p(`*Variants: ${foe.variants.map(v => v.name).join(', ')}*`);
    }
    for (const ability of foe.specialAbilities) {
      p(`**${ability.name}** — ${ability.description}`);
    }
  }

  return md.join('\n');
};
