import { BESTIARY, getFoeByName } from './data/bestiary';
import { PERKS } from './data/perks';
import { ACTIONS } from './data/actions';
import { MUSE_WORDS } from './data/museTable';
import * as enc from './data/encounters';
import * as loot from './data/lootTables';
import * as npc from './data/npcTables';
import * as ct from './data/characterTables';
import * as qt from './data/questTables';
import { CODEX_CHAPTERS } from './data/codex';

const F: string[] = [];
const fail = (m: string) => F.push(m);
const eq = (label: string, got: unknown, want: unknown) => { if (got !== want) fail(`${label}: got ${got}, want ${want}`); };

// ---- d20 table lengths ----
eq('LOCATION_ICONS', enc.LOCATION_ICONS.length, 20);
eq('WASTELAND_TRUTHS', enc.WASTELAND_TRUTHS.length, 20);
eq('SETTLEMENT_TRUTHS', enc.SETTLEMENT_TRUTHS.length, 20);
eq('SETTLEMENT_ENCOUNTERS', enc.SETTLEMENT_ENCOUNTERS.length, 20);
eq('WASTELAND_ENCOUNTERS', enc.WASTELAND_ENCOUNTERS.length, 20);
eq('COMBAT_STATES', enc.COMBAT_STATES.length, 20);
eq('CONDITIONS', loot.CONDITIONS.length, 20);
eq('PROFESSIONS', npc.PROFESSIONS.length, 20);
eq('NPC_SECRETS', npc.NPC_SECRETS.length, 20);
eq('NPC_TRUTHS', npc.NPC_TRUTHS.length, 20);
eq('DEMEANOR_ODDS', npc.DEMEANOR_ODDS.length, 20);
eq('DEMEANOR_EVENS', npc.DEMEANOR_EVENS.length, 20);
eq('FEATURES_ROLL_ONE', npc.FEATURES_ROLL_ONE.length, 20);
eq('FEATURES_ROLL_TWO', npc.FEATURES_ROLL_TWO.length, 20);
eq('MUSE_WORDS', MUSE_WORDS.length, 100);
eq('PERKS', PERKS.length, 40);
eq('QUEST_REWARDS', qt.QUEST_REWARDS.length, 21);  // Mystery + 20 named rows (pg.194-196)
eq('GOAL_TYPES', qt.GOAL_TYPES.length, 18);

// ---- muse uniqueness ----
if (new Set(MUSE_WORDS).size !== MUSE_WORDS.length) fail('MUSE_WORDS has duplicates');

// ---- ranged-table coverage: every d20 result 1..20 resolves exactly once ----
type R = { range: [number, number] };
const cover = (label: string, rows: R[], max = 20) => {
  for (let i = 1; i <= max; i++) {
    const hits = rows.filter(r => i >= r.range[0] && i <= r.range[1]).length;
    if (hits === 0) fail(`${label}: roll ${i} matches NO row`);
    if (hits > 1) fail(`${label}: roll ${i} matches ${hits} rows`);
  }
};
// Injuries are 2d20 = one d20 per table (pg.217), not a summed 2d20.
cover('INJURY_TYPES', ct.INJURY_TYPES as R[]);
cover('INJURY_LOCATIONS', ct.INJURY_LOCATIONS as R[]);
cover('MIRACULOUS_ESCAPES', ct.MIRACULOUS_ESCAPES as R[]);
cover('MAIN_QUEST_BLOCKERS', qt.MAIN_QUEST_BLOCKERS as R[]);
Object.entries(ct.FOE_TABLES).forEach(([k, v]) => cover(`FOE_TABLE ${k}`, v as R[]));
qt.GOAL_TYPES.forEach(g => cover(`GOAL ${g.name}`, g.goals as R[]));

// CLEAR_BLOCKER is d20+Level so it is open-ended upward; check 1..40 resolves.
cover('CLEAR_BLOCKER_TABLE', qt.CLEAR_BLOCKER_TABLE as R[], 40);

// ---- bestiary integrity ----
BESTIARY.forEach(f => {
  if (f.threat < 1) fail(`${f.name}: threat ${f.threat}`);
  if (!f.actions.length) fail(`${f.name}: no actions`);
  cover(`${f.name} actions`, f.actions as R[]);
  f.variants?.forEach(v => cover(`${f.name} variant ${v.name}`, v.actions as R[]));
});

// ---- every spawn referenced by the combat engine must exist ----
const SPAWNS = ['Radroach','Dog','Mirelurk Hatchling','Super Mutant','Feral Ghoul',
  'First Generation Synth','Synth Trooper'];
SPAWNS.forEach(n => { if (!getFoeByName(n)) fail(`combatEngine spawns unknown foe "${n}"`); });

// ---- actions ----
ACTIONS.forEach(a => {
  // difficulty null = no Skill Test, so no solutions is correct.
  if (!a.solutions.length && a.difficulty !== null) fail(`Action ${a.name}: no solutions`);
  a.solutions.forEach(s => {
    if (s.attribute !== 'Special' && !s.skill) fail(`Action ${a.name}: solution "${s.label}" has no skill`);
  });
  if (a.difficulty === undefined) fail(`Action ${a.name}: undefined difficulty`);
});

// ---- skills referenced by actions must exist in the character sheet ----
const SKILLS = ['Athletics','Barter','Big Guns','Energy Weapons','Explosives','Lockpick','Medicine',
  'Melee Weapons','Pilot','Repair','Science','Small Guns','Sneak','Speech','Survival','Throwing','Unarmed'];
ACTIONS.forEach(a => a.solutions.forEach(s => {
  if (s.skill && !SKILLS.includes(s.skill)) fail(`Action ${a.name}: unknown skill "${s.skill}"`);
}));
ACTIONS.forEach(a => a.modifiers.forEach(m => {
  if (m.skill && !SKILLS.includes(m.skill)) fail(`Action ${a.name}: modifier references unknown skill "${m.skill}"`);
}));

// ---- codex ----
CODEX_CHAPTERS.forEach(c => { if (!c.content || c.content.length < 200) fail(`Codex ${c.title}: content too short`); });
eq('Codex chapter count', CODEX_CHAPTERS.length, 8);

// ---- loot rollers return valid gear ----
for (let i = 0; i < 4000; i++) {
  const g = loot.rollScavenge();
  if (!g || !g.name || g.quantity < 1) fail(`rollScavenge produced invalid item: ${JSON.stringify(g)}`);
  const c = loot.rollChem();
  if (!c?.name || c.type !== 'Consumable') fail(`rollChem invalid: ${JSON.stringify(c)}`);
}
for (let i = 0; i < 2000; i++) {
  const q = qt.generateSideQuest(13);
  if (!q.goal || !q.rewardName || q.location < 1 || q.location > 20) fail(`generateSideQuest invalid: ${JSON.stringify(q)}`);
  const f = ct.generateFoeEncounter();
  if (!f.scenarios.length) fail('generateFoeEncounter empty');
  const n = npc.generateFullNpc();
  if (!n.name || !n.demeanor || !n.profession) fail('generateFullNpc incomplete');
  const d = npc.generateDangerousNpc();
  if (!d.name || d.threat < 1 || !d.ability) fail('generateDangerousNpc incomplete');
  const inj = ct.rollInjury(Math.floor(Math.random()*10));
  if (!inj.description) fail('rollInjury empty');
}

// ---- remaining book tables ----
eq('FACTIONS', npc.FACTIONS.length, 20);
eq('SUPPLIES', loot.SUPPLIES.length, 20);
eq('ODDITIES', loot.ODDITIES.length, 20);
eq('KNOWN_VAULTS', ct.KNOWN_VAULTS.length, 32);
cover('DANGEROUS_NPC_ABILITIES', npc.DANGEROUS_NPC_ABILITIES as unknown as R[]);
eq('DANGEROUS_NPC_WEAPONS', npc.DANGEROUS_NPC_WEAPONS.length, 10);  // 10 rows paired across d20 (1-2,3-4,...)
eq('REPUTATION_ORDER', ct.REPUTATION_ORDER.length, 6);

// Scrap is a 2d20 table (pg.173): every sum 2..40 must resolve.
for (let i = 2; i <= 40; i++) {
  if (!loot.SCRAP_TABLE.some(e => e.roll === i)) fail(`SCRAP_TABLE: 2d20 sum ${i} has no row`);
}

// ---- Quantity table (pg.167) distribution sanity ----
{
  const seen = new Set<number>();
  for (let i = 0; i < 20000; i++) { const q = loot.rollQuantity(); seen.add(q.amount); if (q.amount < 1) fail('rollQuantity < 1'); }
  [1,2,3,4,5].forEach(n => { if (!seen.has(n)) fail(`rollQuantity never produced ${n}`); });
}

// ---- weapon/armor generators ----
for (let i = 0; i < 3000; i++) {
  (['ranged','melee'] as const).forEach(k => {
    const w = loot.rollWeapon(k);
    if (!w?.name || w.type !== 'Weapon') fail(`rollWeapon(${k}) invalid: ${JSON.stringify(w)}`);
  });
  const a = loot.rollArmor();
  if (!a?.name || a.type !== 'Armor') fail(`rollArmor invalid: ${JSON.stringify(a)}`);
  if (!loot.rollCondition()) fail('rollCondition empty');
  if (!loot.rollArmorMod()?.name) fail('rollArmorMod empty');
  if (!loot.rollWeaponMod()?.name) fail('rollWeaponMod empty');
  if (!loot.rollScrap()?.name) fail('rollScrap empty');
}

// ---- encounters ----
for (let r = 1; r <= 20; r++) {
  [true, false].forEach(settlement => {
    const e = enc.encounterAt(settlement, r);
    if (!e?.name || !e.description) fail(`encounterAt(${settlement},${r}) incomplete`);
  });
}
for (let i = 0; i < 2000; i++) {
  if (!enc.rollCombatStateEntry()?.name) fail('rollCombatStateEntry empty');
  if (!enc.rollIcon()) fail('rollIcon empty');
  if (!enc.rollWastelandTruth()) fail('rollWastelandTruth empty');
  if (!enc.rollSettlementTruth()) fail('rollSettlementTruth empty');
  if (!npc.rollFaction()) fail('rollFaction empty');
  const cb = qt.rollClearBlocker(1 + Math.floor(Math.random() * 12));
  if (!cb?.name) fail('rollClearBlocker empty');
}

const uniq = [...new Set(F)];
console.log(uniq.length ? uniq.join('\n') : 'NO STATIC FAULTS');
console.log(`\n[${uniq.length} distinct fault(s)]`);
