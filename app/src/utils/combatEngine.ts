// Combat engine (Chapter 4 pg.98-105 + Appendix 3) — resolves foe turns from
// stat-block data, including special abilities, as declarative effects the
// Combat tab applies.
import type { FoeAction, FoeTemplate } from '../data/bestiary';
import type { GearItem } from '../store/gameState';
import { rollChem, rollScrap, rollScavenge } from '../data/lootTables';

export interface CombatFoeState {
  id: string;
  template: FoeTemplate;
  currentThreat: number;
  buffs: string[];
}

export interface PlayerDamage {
  amount: number;
  type: 'Physical' | 'Energy' | 'Radiation' | 'Explosive';
  /** Zetan vaporiser etc. cannot be Endured. */
  canEndure: boolean;
  /** V.A.T.S.-style hits that also inflict an Injury. */
  causesInjury?: boolean;
}

export interface TurnEffect {
  log: string;
  playerDamage?: PlayerDamage;
  /** Bestiary names of foes that join the fight. */
  spawn?: string[];
  /** The acting foe removes itself (detonation, fled, beamed up…). */
  selfDefeat?: boolean;
  fled?: boolean;
  addBuffs?: string[];
  removeBuffs?: string[];
  threatDelta?: number;
  /** Other foes of a category immediately act (Brute roar, Boss order…). */
  chain?: { category: string; mode: 'aggressive' | 'rolled'; limit?: number };
  /** A specific other foe leaves the fight (rout, Meat Shield victim…). */
  removeFoeId?: string;
}

const d20 = () => Math.floor(Math.random() * 20) + 1;

export const rollFoeAction = (actions: FoeAction[]): { action: FoeAction; roll: number } => {
  const roll = d20();
  const action = actions.find(a => roll >= a.range[0] && roll <= a.range[1]) ?? actions[0];
  return { action, roll };
};

const has = (foe: CombatFoeState, buff: string) => foe.buffs.includes(buff);
const countBuff = (foe: CombatFoeState, buff: string) => foe.buffs.filter(b => b === buff).length;

/** Bonus damage from chem buffs (Psycho/Overdrive: +1 each). */
const damageBuff = (foe: CombatFoeState) => countBuff(foe, 'DMG+1');

/** Resolves one foe turn into effects. `others` = the other active foes. */
export const resolveFoeTurn = (
  foe: CombatFoeState,
  others: CombatFoeState[],
  playerLuck: number
): TurnEffect[] => {
  const { action, roll } = rollFoeAction(foe.template.actions);
  const name = foe.template.name.replace(/\s*\(.+\)$/, ''); // strip weapon variant
  const effects: TurnEffect[] = [];
  const base: TurnEffect = { log: `[${action.type} ${roll}] ${foe.template.name}: ${action.description}` };

  const dmg = (amount: number, type: PlayerDamage['type'] = 'Physical', canEndure = true, causesInjury = false): PlayerDamage =>
    ({ amount: amount + damageBuff(foe), type, canEndure, causesInjury });

  switch (name) {
    // ---------- CREATURES ----------
    case 'Bloodbug': {
      const full = has(foe, 'Sac Full');
      if (action.type === 'Aggressive') {
        effects.push(full
          ? { ...base, log: `${base.log} (spits irradiated blood)`, playerDamage: dmg(2, 'Radiation'), removeBuffs: ['Sac Full'] }
          : { ...base, playerDamage: dmg(1), addBuffs: ['Sac Full'] });
      } else if (action.type === 'Crafty') {
        effects.push(full
          ? { ...base, log: `${foe.template.name} is engorged and flees!`, selfDefeat: true, fled: true }
          : { ...base, playerDamage: dmg(1), addBuffs: ['Sac Full'] });
      } else {
        effects.push({ ...base, addBuffs: ['Airborne'] });
      }
      break;
    }
    case 'Molerat':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1), removeBuffs: ['Burrowed'] });
      else effects.push({ ...base, addBuffs: has(foe, 'Burrowed') ? [] : ['Burrowed'] });
      break;
    case 'Radscorpion':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(has(foe, 'Burrowed') ? 2 : 3), removeBuffs: ['Burrowed'], addBuffs: ['Grappling'] });
      else if (action.type === 'Cautious') effects.push(has(foe, 'Grappling')
        ? { ...base, playerDamage: dmg(1), log: `${base.log} — you gain the Poisoned Truth!` }
        : { ...base });
      else effects.push({ ...base, addBuffs: ['Burrowed'], removeBuffs: ['Grappling'] });
      break;
    case 'Radroach':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1) });
      else if (action.type === 'Cautious') effects.push({ ...base, spawn: ['Radroach'] });
      else effects.push({ ...base, log: 'All Radroaches flee!', selfDefeat: true, fled: true });
      break;
    case 'Dog':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1) });
      else if (action.type === 'Crafty') effects.push({ ...base, spawn: ['Dog'] });
      else effects.push(base);
      break;
    case 'Mirelurk Queen':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(5) });
      else if (action.type === 'Crafty') effects.push({ ...base, spawn: ['Mirelurk Hatchling', 'Mirelurk Hatchling', 'Mirelurk Hatchling'] });
      else effects.push({ ...base, addBuffs: ['Hunkered'] });
      break;
    case 'Mirelurk Hatchling':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1) });
      else if (action.type === 'Crafty') effects.push({ ...base, log: `${base.log} (Remove 1 Stack of Supplies!)` });
      else effects.push(base);
      break;

    // ---------- SUPER MUTANTS ----------
    case 'Super Mutant Brute': {
      const isGatling = foe.template.name.includes('Gatling');
      if (action.type === 'Aggressive') {
        if (isGatling && !has(foe, 'Spun Up')) {
          effects.push({ ...base, log: `${foe.template.name} spins up its Gatling Gun, yelling as it advances!`, addBuffs: ['Spun Up'] });
        } else {
          effects.push({ ...base, playerDamage: dmg(action.damage ?? 4, action.damageType === 'Explosive' ? 'Explosive' : 'Physical') });
        }
      } else if (action.type === 'Cautious') {
        effects.push(isGatling ? { ...base, addBuffs: ['Spun Up'] } : { ...base, addBuffs: ['In Cover'] });
      } else {
        effects.push({ ...base, chain: { category: 'Super Mutant', mode: 'rolled' } });
      }
      break;
    }
    case 'Super Mutant Suicider':
      if (action.type === 'Aggressive') {
        effects.push({ ...base, playerDamage: dmg(5, 'Explosive'), selfDefeat: true });
      } else if (action.type === 'Crafty') {
        effects.push({ ...base, addBuffs: ['Nuke Armed'] });
      } else {
        effects.push(base);
      }
      break;
    case 'Super Mutant Hound':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1) });
      else if (action.type === 'Crafty') effects.push({ ...base, spawn: ['Super Mutant'] });
      else effects.push({ ...base, log: `${base.log} (It will return with reinforcements…)`, selfDefeat: true, fled: true });
      break;
    case 'Super Mutant Behemoth':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(4) });
      else if (action.type === 'Crafty') effects.push({ ...base, addBuffs: ['Grabbing You'], log: `${base.log} (STR Athletics diff 3 to break free!)` });
      else effects.push(base);
      break;

    // ---------- GHOULS ----------
    case 'Feral Ghoul':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1) });
      else if (action.type === 'Crafty') effects.push({ ...base, spawn: ['Feral Ghoul'] });
      else effects.push(base);
      break;
    case 'Glowing One':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2, 'Radiation') });
      else if (action.type === 'Crafty') effects.push({ ...base, log: `${base.log} (A fallen ghoul rises!)`, spawn: ['Feral Ghoul'] });
      else effects.push(base);
      break;

    // ---------- ROBOTS ----------
    case 'Assaultron': {
      const charge = countBuff(foe, 'Charge');
      if (action.type === 'Crafty') {
        const laserDmg = Math.min(5, 2 + charge);
        effects.push({ ...base, playerDamage: dmg(laserDmg, 'Energy'), removeBuffs: Array(charge).fill('Charge') });
      } else if (action.type === 'Cautious' && foe.currentThreat <= 2) {
        effects.push({ ...base, log: `${foe.template.name} EXPLODES!`, playerDamage: dmg(3, 'Explosive'), selfDefeat: true });
        effects.push({ log: 'Radiation washes over you. (+1 Radiation Damage)', playerDamage: { amount: 1, type: 'Radiation', canEndure: false } });
      } else if (action.type === 'Aggressive') {
        effects.push({ ...base, playerDamage: dmg(2), addBuffs: ['Charge'] });
      } else {
        effects.push({ ...base, addBuffs: ['Charge'] });
      }
      // every action charges the laser
      if (action.type === 'Crafty') break;
      break;
    }
    case 'Sentry Bot':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(4) });
      else if (action.type === 'Cautious') effects.push({ ...base, threatDelta: foe.currentThreat < 4 ? 1 : 0 });
      else if (foe.currentThreat <= 2) {
        effects.push({ ...base, log: `${foe.template.name} self-destructs!`, playerDamage: dmg(4, 'Explosive'), selfDefeat: true });
      } else effects.push(base);
      break;
    case 'Mr. Gutsy':
      if (action.type === 'Crafty') effects.push({ ...base, playerDamage: dmg(2, 'Explosive'), selfDefeat: true });
      else effects.push({ ...base, playerDamage: dmg(2, action.type === 'Cautious' ? 'Energy' : 'Physical') });
      break;
    case 'Mr. Handy':
      if (action.type === 'Crafty') {
        const r = d20();
        effects.push(r <= playerLuck
          ? { ...base, log: `${foe.template.name} helpfully hands you a Chem before hovering off!` }
          : { ...base, log: `${foe.template.name} offers utterly useless verbal assistance.` });
      } else {
        effects.push({ ...base, playerDamage: dmg(1, action.type === 'Cautious' ? 'Energy' : 'Physical') });
      }
      break;
    case 'Eyebot':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1, 'Energy') });
      else if (action.type === 'Cautious') effects.push({ ...base, selfDefeat: true, fled: true });
      else effects.push(base);
      break;
    case 'Protectron':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(action.damage ?? 1, foe.template.name.includes('Fire') ? 'Energy' : 'Physical') });
      else if (action.type === 'Cautious' && foe.currentThreat <= 1) {
        effects.push({ ...base, log: `${foe.template.name} detonates!`, playerDamage: dmg(1, 'Explosive'), selfDefeat: true });
      } else effects.push(base);
      break;
    case 'Turret':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2, foe.template.name.includes('Laser') ? 'Energy' : 'Physical') });
      else effects.push(base);
      break;

    // ---------- RAIDERS ----------
    case 'Raider':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1) });
      else if (action.type === 'Crafty') {
        if (others.length === 0) effects.push({ ...base, log: `${foe.template.name} flees — alone, this isn't worth dying for!`, selfDefeat: true, fled: true });
        else if (has(foe, 'DMG+1')) effects.push({ ...base, log: `${foe.template.name} overdoses on Psycho and collapses!`, selfDefeat: true });
        else effects.push({ ...base, addBuffs: ['DMG+1'] });
      } else effects.push({ ...base, addBuffs: ['In Cover'] });
      break;
    case 'Psycho':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2) });
      else if (action.type === 'Cautious') {
        if (has(foe, 'DMG+1')) effects.push({ ...base, log: `${foe.template.name} overdoses and collapses!`, selfDefeat: true });
        else effects.push({ ...base, addBuffs: ['DMG+1'] });
      } else {
        if (has(foe, 'Jet')) effects.push({ ...base, log: `${foe.template.name} overdoses on Jet and collapses!`, selfDefeat: true });
        else effects.push({ ...base, addBuffs: ['Jet'], log: `${base.log} (It now acts TWICE per turn!)` });
      }
      break;
    case 'Scavver':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2) });
      else if (action.type === 'Crafty') effects.push({ ...base, playerDamage: dmg(2, 'Energy'), addBuffs: ['In Cover'] });
      else effects.push({ ...base, addBuffs: ['In Cover'] });
      break;
    case 'Raider Boss':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(3) });
      else if (action.type === 'Cautious') {
        if (has(foe, 'Overdrive')) effects.push({ ...base, log: `${foe.template.name} overdoses and collapses!`, selfDefeat: true });
        else effects.push({ ...base, addBuffs: ['Overdrive', 'DMG+1'], threatDelta: 1 });
      } else {
        effects.push({ ...base, chain: { category: 'Raider', mode: 'aggressive' } });
      }
      break;

    // ---------- INSTITUTE ----------
    case 'First Generation Synth':
    case 'Synth Strider':
      if (action.type === 'Aggressive' || action.type === 'Cautious') effects.push({ ...base, playerDamage: dmg(1, 'Energy') });
      else effects.push({ ...base, addBuffs: ['Grappling'], log: `${base.log} (STR Athletics diff 1 or you cannot move!)` });
      if (name === 'First Generation Synth') {
        const r = d20();
        if (r > playerLuck) {
          effects.push({ log: 'ALWAYS MORE: another First Generation Synth relays in with a flash of blue light!', spawn: ['First Generation Synth'] });
        }
      }
      break;
    case 'Synth Trooper': {
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2, 'Energy') });
      else if (action.type === 'Cautious') effects.push({ ...base, playerDamage: dmg(1, 'Energy'), addBuffs: ['In Cover'] });
      else {
        const synthAllies = others.filter(o => o.template.category === 'Institute' && o.template.name !== 'Institute Scientist').length;
        effects.push({ ...base, playerDamage: dmg(1 + synthAllies, 'Energy'), log: `${base.log} (Coordinate Fire: +${synthAllies} damage)` });
      }
      break;
    }
    case 'Synth Courser':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(3, 'Energy') });
      else if (action.type === 'Cautious') effects.push({ ...base, spawn: ['Synth Trooper'], addBuffs: ['In Cover'] });
      else effects.push({ ...base, addBuffs: has(foe, 'Invisible') ? [] : ['Invisible'] });
      break;
    case 'Institute Scientist':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1, 'Energy') });
      else if (action.type === 'Cautious') effects.push({ ...base, addBuffs: ['In Cover'] });
      else effects.push(base);
      break;

    // ---------- BROTHERHOOD ----------
    case 'Brotherhood Knight':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(3, 'Energy') });
      else if (action.type === 'Crafty') effects.push({ ...base, chain: { category: 'Brotherhood of Steel', mode: 'rolled', limit: 2 } });
      else effects.push(base);
      break;
    case 'Brotherhood Paladin':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(3, 'Energy') });
      else if (action.type === 'Crafty') effects.push({ ...base, chain: { category: 'Brotherhood of Steel', mode: 'rolled', limit: 2 } });
      else effects.push(base);
      break;
    case 'Brotherhood Elder': {
      if (action.type === 'Aggressive') {
        const bros = others.filter(o => o.template.category === 'Brotherhood of Steel').length;
        effects.push(bros > 0
          ? { ...base, playerDamage: dmg(bros), log: `${base.log} (Volley: 1 Damage per Brotherhood foe = ${bros})` }
          : { ...base, playerDamage: dmg(3, 'Energy') });
      } else if (action.type === 'Cautious') {
        effects.push({ ...base, chain: { category: 'Brotherhood of Steel', mode: 'rolled' } });
      } else {
        effects.push({ ...base, chain: { category: 'Brotherhood of Steel', mode: 'rolled', limit: 2 } });
      }
      break;
    }
    case 'Brotherhood Scribe': {
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(1, 'Energy') });
      else if (action.type === 'Cautious') {
        const wounded = others.find(o =>
          (o.template.name.includes('Knight') || o.template.name.includes('Paladin')) && o.currentThreat < o.template.threat);
        effects.push(wounded
          ? { ...base, log: `${base.log} — ${wounded.template.name}'s Power Armor is repaired to full Threat!` }
          : base);
      } else effects.push({ ...base, addBuffs: ['In Cover'] });
      break;
    }
    case 'Brotherhood Initiate':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2, 'Energy') });
      else effects.push({ ...base, addBuffs: action.type === 'Cautious' ? ['In Cover'] : [] });
      break;

    // ---------- ZETANS ----------
    case 'Zetan':
      if (action.type === 'Aggressive') effects.push({ ...base, playerDamage: dmg(2, 'Energy') });
      else if (action.type === 'Cautious') {
        if (has(foe, 'Signal Sent')) effects.push({ ...base, log: `${foe.template.name} is beamed up to the mothership and vanishes!`, selfDefeat: true, fled: true });
        else effects.push({ ...base, addBuffs: ['Signal Sent'] });
      } else {
        effects.push({ ...base, playerDamage: dmg(3, 'Energy', false), log: `${base.log} (This damage CANNOT be Endured!)` });
      }
      break;

    // ---------- GENERIC FALLBACK ----------
    default:
      if (action.damage) {
        effects.push({
          ...base,
          playerDamage: dmg(action.damage, (action.damageType as PlayerDamage['type']) ?? 'Physical')
        });
      } else if (action.specialEffect?.toLowerCase().includes('spawn')) {
        const match = action.specialEffect.match(/Spawn (\d+) (.+)/i);
        effects.push({ ...base, spawn: match ? Array(Number(match[1])).fill(match[2]) : [] });
      } else {
        effects.push(base);
      }
  }

  return effects;
};

/** Resolves what happens when a foe is Defeated by the player. Returns
 *  follow-up effects (Extremely Tough, detonations, Meat Shield, routs). */
export const resolveDefeat = (
  foe: CombatFoeState,
  others: CombatFoeState[],
  playerLuck: number,
  byRangedAttack: boolean
): { defeated: boolean; redirectedTo?: CombatFoeState; effects: TurnEffect[] } => {
  const effects: TurnEffect[] = [];
  const name = foe.template.name.replace(/\s*\(.+\)$/, '');

  // Meat Shield: a lower-Threat Raider-category foe dies in the Boss's place.
  if (name === 'Raider Boss' && byRangedAttack) {
    const shield = others.find(o => o.template.category === 'Raider' && o.currentThreat < foe.currentThreat);
    if (shield) {
      effects.push({ log: `MEAT SHIELD! ${shield.template.name} is shoved into the line of fire and dies in the Boss's place!` });
      return { defeated: false, redirectedTo: shield, effects };
    }
  }

  // Extremely Tough: the first "defeat" only enrages a Behemoth.
  if (name === 'Super Mutant Behemoth' && !foe.buffs.includes('Tough Used')) {
    effects.push({ log: 'EXTREMELY TOUGH! The Behemoth shrugs off a killing blow and acts instead!' });
    return { defeated: false, effects };
  }

  // Armed Suicider nuke detonates on defeat.
  if (foe.buffs.includes('Nuke Armed')) {
    effects.push({
      log: 'The Suicider\'s mini nuke DETONATES as it falls! (5 Damage)',
      playerDamage: { amount: 5, type: 'Explosive', canEndure: true }
    });
  }

  // Not the Boss!: Raiders may rout when their Boss falls.
  if (name === 'Raider Boss') {
    others.forEach(o => {
      if (o.template.name.replace(/\s*\(.+\)$/, '') === 'Raider' && d20() <= playerLuck) {
        effects.push({ log: `${o.template.name} sees the Boss fall and FLEES!`, removeFoeId: o.id });
      }
    });
  }

  return { defeated: true, effects };
};

/** Loot from a Defeated foe (pg.99 + per-foe Always Carrying rules). */
export const lootFoe = (template: FoeTemplate): { items: GearItem[]; log: string } => {
  const name = template.name.replace(/\s*\(.+\)$/, '');
  const items: GearItem[] = [];

  switch (name) {
    case 'Raider':
      items.push(rollChem());
      break;
    case 'Psycho':
    case 'Raider Boss':
      items.push(rollChem(), rollChem());
      break;
    case 'Scavver':
      items.push(rollScrap());
      break;
    case 'Super Mutant Behemoth':
      items.push(rollScavenge(), rollScavenge());
      break;
    default:
      items.push(rollScavenge());
  }
  return {
    items,
    log: `Looted ${template.name}: ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`
  };
};
