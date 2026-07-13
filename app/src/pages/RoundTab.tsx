import { useEffect, useMemo, useState } from 'react';
import { useGameState } from '../store/gameState';
import type { Special, EncounterInfo, GearItem } from '../store/gameState';
import { useUIState } from '../store/uiState';
import {
  rollInhabitants, resolveInhabitants, rollIcon, rollWastelandTruth,
  rollSettlementTruth, rollSettlementEncounter, rollWastelandEncounter,
  rollCombatStateEntry
} from '../data/encounters';
import { parseFoesFromScenario, getRandomFoe } from '../data/bestiary';
import type { FoeTemplate } from '../data/bestiary';
import { rollFaction, generateFullNpc, generateDangerousNpc } from '../data/npcTables';
import { generateFoeEncounter, rollSettlementReputation, shiftReputation, rollInjury } from '../data/characterTables';
import type { Reputation, FoeType } from '../data/characterTables';
import { generateSideQuest, rollClearBlocker, rollMainQuestBlocker, rollQuestReward } from '../data/questTables';
import { rollScavenge, rollQuantity, rollCondition, rollArmorMod, rollWeaponMod, rollChem, rollWeapon, rollArmor } from '../data/lootTables';
import { ACTIONS } from '../data/actions';
import type { GameAction } from '../data/actions';
import { runSkillTest, rerollWorstDie } from '../utils/skillTest';
import type { TestOutcome } from '../utils/skillTest';
import LevelUpModal from '../components/LevelUpModal';
import CombatView from '../components/CombatView';
import type { PlayerCombatAction } from '../components/CombatView';
import { sfx } from '../utils/sound';
import { Footprints, Zap, Swords, Book, ChevronRight, Dices, MessageCircle, Brain, Wind, PlusCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const IMPASSABLE = [3, 8, 21, 24];
const EDGE_SQUARES = [1, 2, 4, 5, 6, 10, 11, 15, 16, 20, 22, 23, 25];
const VAULT_SQUARE = 13;

const STAGES = [
  { id: 'travel', label: 'Travel', icon: Footprints },
  { id: 'encounter', label: 'Encounter', icon: Zap },
  { id: 'action', label: 'Action', icon: Swords },
  { id: 'journal', label: 'Journal', icon: Book }
] as const;

/** In-game calendar: adventures take place in the 2280s (pg.142). */
const gameDate = (day: number) => {
  const date = new Date(2287, 9, 23);
  date.setDate(date.getDate() + (day - 1));
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Orthogonal adjacency on the 5x5 grid (diagonals are NOT adjacent, pg.108).
const isAdjacent = (a: number, b: number) => {
  if (a - b === 5 || b - a === 5) return true;
  if (Math.abs(a - b) === 1 && Math.floor((a - 1) / 5) === Math.floor((b - 1) / 5)) return true;
  return false;
};

const ATTR_KEY_MAP: Record<string, keyof Special> = { STR: 'S', PER: 'P', END: 'E', CHA: 'C', INT: 'I', AGI: 'A', LCK: 'L' };

// Dangerous Actions are resolved by the combat engine (CombatView), which
// applies the book's full success/failure consequences.
const DANGER_MODE: Record<string, PlayerCombatAction> = {
  'Oppose': 'Oppose', 'Slaughter': 'Slaughter', 'Outwit': 'Outwit',
  'De-escalate': 'De-escalate', 'Retreat': 'Retreat'
};

// =================================================================
// ACTION RESOLVER — runs one Pick-a-Path action through the 2d20 engine
// =================================================================
function ActionResolver({ action, onDone, onFoes }: { action: GameAction; onDone: () => void; onFoes?: (foes: FoeTemplate[]) => void }) {
  const {
    special, skills, ap, luck, caps, updateAp, updateLuck, updateCaps, appendJournal, updateSupplies,
    updateHp, updateRads, addGear, removeGear, gear, injuries, removeInjury, currentSector, updateSectorData,
    sectorData, setDanger, markScavenged, markTraded, addNpc, addSideQuest, tradedThisRound,
    addInjury, nextTestModifier, setNextTestModifier, hp, maxHp, rads, supplies
  } = useGameState();

  const effectiveMaxHp = Math.max(1, maxHp - rads);
  const missingHp = Math.max(0, effectiveMaxHp - hp);

  // Default to the solution with the player's best Target Number.
  const [solutionIndex, setSolutionIndex] = useState(() => {
    let best = 0;
    let bestTn = -1;
    action.solutions.forEach((s, i) => {
      if (s.attribute === 'Special' || !s.skill) return;
      const tn = special[ATTR_KEY_MAP[s.attribute]] + (skills.find(k => k.name === s.skill)?.rank ?? 0);
      if (tn > bestTn) { bestTn = tn; best = i; }
    });
    return best;
  });
  const [activeModifiers, setActiveModifiers] = useState<number[]>([]);
  const [tryLuck, setTryLuck] = useState(false);
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);
  const [rerolled, setRerolled] = useState(false);
  const [bonusNotes, setBonusNotes] = useState<string[]>([]);
  const [claimedExtras, setClaimedExtras] = useState<number[]>([]);
  // Trade: the trader's stock (3 loot rolls, no caps results — pg.134).
  const [stock, setStock] = useState<GearItem[]>([]);
  // Mod & Repair: which gear item is on the workbench.
  const [workItemId, setWorkItemId] = useState<string | null>(null);
  // Set when the outcome was bought via a "Pay a Doctor/Expert" Special
  // solution (auto-success; no AP may be spent on Additional Successes).
  const [paidSpecial, setPaidSpecial] = useState(false);

  const solution = action.solutions[solutionIndex];
  const attrKeyMap = ATTR_KEY_MAP;

  const sector = sectorData[currentSector];

  // Settlement Reputation as a social-test modifier (pg.112/218): a wary town
  // is harder to Barter/Speech with; a friendly one easier.
  const repDelta = (() => {
    if (!sector?.isSettlement || !sector.reputation) return 0;
    if (!['Barter', 'Speech'].includes(solution?.skill ?? '')) return 0;
    if (['Vilified', 'Hostile', 'Cautious'].includes(sector.reputation)) return 1;
    if (['Friendly', 'Idolized'].includes(sector.reputation)) return -1;
    return 0;
  })();
  const [repApplied, setRepApplied] = useState(true);

  // Modifiers the app can detect from game state — applied automatically,
  // each one toggleable off.
  const autoMods: { label: string; delta: number }[] = [];
  const truths = sector?.truths ?? [];
  if (action.name === 'Explore' && truths.length > 0) {
    autoMods.push({ label: `Location already has ${truths.length} Truth(s)`, delta: truths.length });
  }
  if (['Find Supplies', 'Scavenge'].includes(action.name) && truths.some(t => t.startsWith('Irradiated'))) {
    autoMods.push({ label: 'This location is badly irradiated', delta: 1 });
  }
  if (action.name === 'Scavenge' && sector?.explored && !sector.scavengeAvailable) {
    autoMods.push({ label: 'You have scavenged this location before', delta: 1 });
  }
  if (action.name === 'Trade' && tradedThisRound) {
    autoMods.push({ label: 'You have already Traded this Round', delta: 1 });
  }
  if (nextTestModifier !== 0) {
    autoMods.push({ label: 'Carried over from your last action', delta: nextTestModifier });
  }
  const [autoModsOff, setAutoModsOff] = useState<number[]>([]);
  const autoDelta = autoMods.reduce((sum, m, i) => sum + (autoModsOff.includes(i) ? 0 : m.delta), 0);

  // Which complication has been picked (one per test).
  const [complicationPicked, setComplicationPicked] = useState<string | null>(null);
  const [choiceNotes, setChoiceNotes] = useState<Record<string, string>>({});

  /** Interprets an outcome/complication string and APPLIES its mechanical
   *  effect to the game state. Returns a summary of what happened. */
  const resolveChoiceEffect = (text: string, kind: string): string => {
    const t = text.toLowerCase();
    const applied: string[] = [];

    const dmgMatch = t.match(/suffer (\d+) damage/) ?? t.match(/lose (\d+) ?hp/);
    if (dmgMatch) {
      const n = Number(dmgMatch[1]);
      updateHp(-n);
      applied.push(`-${n} HP`);
    }
    if (/spend 1 supply|supplies is spoiled|reduce the number received by 1/.test(t)) {
      updateSupplies(-1);
      applied.push('-1 Supply');
    }
    if (t.includes('[injury]')) {
      const inj = rollInjury();
      addInjury(inj.description);
      applied.push(`Injury: ${inj.description}`);
    }
    if (t.includes('lose a medical item or chem')) {
      const med = gear.find(g => g.type === 'Consumable');
      if (med) {
        removeGear(med.id);
        applied.push(`Lost ${med.name}`);
      } else {
        applied.push('No chems to lose — lucky');
      }
    }
    if (/\[dangerous npc/.test(t)) {
      const d = generateDangerousNpc();
      setDanger(true);
      applied.push(`Dangerous NPC arrives: ${d.name} (Threat ${d.threat}, ${d.ability.faction}) — IN DANGER`);
    } else if (/\[creature/.test(t)) {
      const gen = generateFoeEncounter('Creature');
      const foes = gen.scenarios.flatMap(parseFoesFromScenario);
      const final = foes.length ? foes : [getRandomFoe()];
      onFoes?.(final);
      setDanger(true);
      applied.push(`Creatures: ${final.map(f => f.name).join(', ')} — IN DANGER`);
    } else if (/\[foe/.test(t) || t.includes('ambushed')) {
      const gen = generateFoeEncounter();
      const foes = gen.scenarios.flatMap(parseFoesFromScenario);
      const final = foes.length ? foes : [getRandomFoe()];
      onFoes?.(final);
      setDanger(true);
      applied.push(`Foes: ${final.map(f => f.name).join(', ')} — IN DANGER`);
    }
    if (/new \[npc\]|meet a new npc/.test(t)) {
      const npc = generateFullNpc();
      addNpc({
        name: npc.name,
        description: `${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction}) — Truth: ${npc.truth}`,
        location: currentSector
      });
      applied.push(`Met ${npc.name} (+1 XP)`);
    }
    if (t.includes('[combat state]')) {
      const st = rollCombatStateEntry();
      applied.push(`Combat State: ${st.name} — ${st.description}`);
    }
    if (t.includes('next skill test is increased')) {
      setNextTestModifier(1);
      applied.push('Next test: +1 Difficulty');
    } else if (t.includes('next skill test') && t.includes('reduced')) {
      setNextTestModifier(-1);
      applied.push('Next test: -1 Difficulty');
    }
    if (t.includes('[loot]')) {
      const l = rollScavenge();
      addGear(l);
      applied.push(`Loot: ${l.quantity}x ${l.name}`);
    }
    if (t.includes('1 additional supply') || t.includes('generate 1 additional supply')) {
      updateSupplies(1);
      applied.push('+1 Supply');
    }
    if (t.includes('heal 1 additional hp')) {
      updateHp(1);
      applied.push('+1 HP');
    }
    if (t.includes('[settlement truth]') || t.includes('[wasteland truth]')) {
      const truth = sector?.isSettlement ? rollSettlementTruth() : rollWastelandTruth();
      updateSectorData(currentSector, { truths: [...(sector?.truths ?? []), truth] });
      applied.push(`New Truth: ${truth}`);
    }
    if (t.includes('[icon]')) {
      const icon = rollIcon();
      updateSectorData(currentSector, { truths: [...(sector?.truths ?? []), `Landmark: ${icon}`] });
      applied.push(`New Icon: ${icon}`);
    }
    if (t.includes('out of ammunition') || t.includes('out of ammo')) {
      const box = gear.find(g => g.type === 'Ammo');
      if (box) {
        removeGear(box.id);
        applied.push('Spent an Ammo Box — you keep firing');
      } else {
        const weapon = gear.find(g => g.equipped && g.type === 'Weapon');
        if (weapon) {
          useGameState.setState(state => ({
            gear: state.gear.map(g => g.id === weapon.id ? { ...g, condition: 'Out of Ammo' } : g)
          }));
          applied.push(`${weapon.name} is OUT OF AMMO`);
        }
      }
    }
    if (t.includes('weapon breaks') || t.includes('broken condition')) {
      const weapon = gear.find(g => g.equipped && g.type === 'Weapon');
      if (weapon) {
        useGameState.setState(state => ({
          gear: state.gear.map(g => g.id === weapon.id ? { ...g, condition: 'Broken' } : g)
        }));
        applied.push(`${weapon.name} is BROKEN`);
      }
    }
    if (t.includes('armor is damaged')) {
      const armor = gear.find(g => g.equipped && g.type === 'Armor');
      if (armor) {
        useGameState.setState(state => ({
          gear: state.gear.map(g => g.id === armor.id ? { ...g, condition: 'Damaged' } : g)
        }));
        applied.push(`${armor.name} is Damaged`);
      }
    }

    const summary = applied.length ? applied.join(' • ') : 'Noted — narrate it in your Journal.';
    appendJournal(`${kind}: ${text}\n→ ${summary}`);
    return summary;
  };


  const baseDifficulty = typeof action.difficulty === 'number' ? action.difficulty : 1;
  const modifierDelta = activeModifiers.reduce((sum, i) => sum + (action.modifiers[i].direction === '+' ? 1 : -1), 0);
  const difficulty = Math.max(0, Math.min(5, baseDifficulty + modifierDelta + (repApplied ? repDelta : 0) + autoDelta));

  const applyOutcome = (result: TestOutcome): string[] => {
    const notes: string[] = [];
    if (result.excess > 0) {
      updateAp(1);
      notes.push('+1 AP (extra Successes).');
    }
    if (!result.passed) {
      // Failure auto-effects. Cost-choices resolve themselves: spend the
      // Supply if you have one (HP is precious), otherwise take the hit.
      if (action.name === 'Explore') {
        if (supplies > 0) {
          updateSupplies(-1);
          notes.push('Lost your way: -1 Supply (auto — sparing your health).');
        } else {
          updateHp(-1);
          notes.push('Lost your way with empty packs: -1 HP.');
        }
      }
      if (action.name === 'Trade') {
        // Failed barter: you can still buy, at double prices (pg.134).
        markTraded();
        const items: GearItem[] = [];
        while (items.length < 3) {
          const item = rollScavenge();
          if (item.type === 'Currency') continue;
          items.push(item);
        }
        setStock(items);
        notes.push('The trader senses your desperation — everything costs DOUBLE.');
      }
      if (action.name === 'Scavenge') {
        // Failure (pg.133): the loot is guarded — a Foe appears; a Combat State
        // decides whether you are In Danger.
        markScavenged();
        const gen = generateFoeEncounter();
        const parsed = gen.scenarios.flatMap(parseFoesFromScenario);
        const final = parsed.length ? parsed : [getRandomFoe()];
        onFoes?.(final);
        setDanger(true);
        const st = rollCombatStateEntry();
        notes.push(`The loot is guarded! ${final.map(f => f.name).join(', ')} appear — Combat State: ${st.name}. You are IN DANGER.`);
      }
      if (action.name === 'Modify and Repair Gear') {
        // Failure (pg.132): the chosen item gains Broken; if already Broken, it
        // is destroyed.
        const item = gear.find(g => g.id === workItemId);
        if (item) {
          if (item.condition === 'Broken') {
            removeGear(item.id);
            notes.push(`You wreck it beyond saving — ${item.name} is destroyed.`);
          } else {
            useGameState.setState(s => ({
              gear: s.gear.map(g => g.id === item.id ? { ...g, condition: 'Broken' } : g)
            }));
            notes.push(`Botched the job — ${item.name} is now BROKEN.`);
          }
        }
      }
      return notes;
    }
    switch (action.name) {
      case 'Find Supplies': {
        const q = rollQuantity();
        updateSupplies(q.amount);
        notes.push(`Gained ${q.amount} Supplies${q.endless ? ' (a seemingly endless cache!)' : ''}.`);
        break;
      }
      case 'Scavenge': {
        const loot1 = rollScavenge();
        const loot2 = rollScavenge();
        addGear(loot1);
        addGear(loot2);
        markScavenged();
        notes.push(`Loot: ${loot1.quantity}x ${loot1.name} and ${loot2.quantity}x ${loot2.name}.`);
        break;
      }
      case 'Explore': {
        const truth = sector?.isSettlement ? rollSettlementTruth() : rollWastelandTruth();
        updateSectorData(currentSector, { truths: [...(sector?.truths ?? []), truth] });
        notes.push(`New Location Truth: ${truth}`);
        break;
      }
      case 'Meet': {
        // Book (pg.129): Meet visits a KNOWN NPC already in your Location —
        // learn their Secret and get a Side Quest from them. It does NOT create
        // a new NPC (so it grants no "new face" +1 XP).
        const here = useGameState.getState().npcs.filter(n => n.location === currentSector);
        const giver = here[0];
        const secret = generateFullNpc().secret;
        const quest = generateSideQuest(currentSector);
        addSideQuest({
          goalType: quest.goalType, goal: quest.goal, questions: quest.questions,
          reward: quest.rewardName, rewardDesc: quest.rewardDescription,
          location: quest.location, giver: giver?.name, status: 'Active'
        });
        notes.push(`${giver?.name ?? 'The NPC'} shares a secret: ${secret}`);
        notes.push(`New Side Quest [${quest.goalType}]: ${quest.goal} (Location ${quest.location}, Reward: ${quest.rewardName})`);
        notes.push(`Prompt: ${quest.questions}`);
        break;
      }
      case 'Patch Up': {
        // Auto-pick when one option is clearly right.
        if (injuries.length === 0) {
          updateHp(4);
          notes.push('Healed 4 HP (no injuries to treat).');
        } else if (missingHp === 0) {
          notes.push(`Treated injury: ${injuries[0]} (already at full HP).`);
          removeInjury(0);
        }
        // Otherwise both options matter — the choice buttons appear below.
        break;
      }
      case 'Trade': {
        markTraded();
        // Stock: roll loot 3 times, re-rolling Caps results (pg.134).
        const items: GearItem[] = [];
        while (items.length < 3) {
          const item = rollScavenge();
          if (item.type === 'Currency') continue;
          items.push(item);
        }
        setStock(items);
        notes.push('The trader lays out their wares.');
        break;
      }
      case 'De-escalate':
      case 'Oppose':
      case 'Slaughter':
      case 'Outwit':
        setDanger(false);
        notes.push('The threat is dealt with — you are Safe again.');
        break;
      case 'Retreat':
        setDanger(false);
        notes.push('You escape! Travel to an adjacent explored Location and end the Round (Journal stage).');
        break;
    }
    return notes;
  };

  const roll = () => {
    if (action.name === 'Modify and Repair Gear' && !workItemId) return;

    // "Pay a Doctor" (Patch Up) / "Pay an Expert" (Mod & Repair): in a
    // Settlement, spend Caps to automatically succeed — no dice, and no AP may
    // be spent on Additional Successes (pg.130/132).
    if (solution?.attribute === 'Special') {
      const cost = action.name === 'Patch Up' ? 1 : 3;
      if (!sector?.isSettlement) {
        appendJournal(`${solution.label}: only available in a Settlement.`);
        return;
      }
      if (caps < cost) {
        appendJournal(`Not enough Caps to pay (need ${cost} Stack${cost > 1 ? 's' : ''}).`);
        return;
      }
      updateCaps(-cost);
      const auto: TestOutcome = {
        rolls: [], targetNumber: 0, critThreshold: 0,
        successes: Math.max(1, difficulty), complications: 0, passed: true, excess: 0, tryLuck: false
      };
      setPaidSpecial(true);
      sfx.success();
      setOutcome(auto);
      setBonusNotes(applyOutcome(auto));
      appendJournal(`${action.name}: paid ${cost} Stack${cost > 1 ? 's' : ''} of Caps for an expert — automatic success.`);
      return;
    }

    // Mod & Repair cost (pg.132): consume one piece of Scrap, or 3 Stacks of Caps.
    if (action.name === 'Modify and Repair Gear') {
      const scrap = gear.find(g => g.type === 'Junk');
      if (scrap) {
        removeGear(scrap.id);
        appendJournal(`Spent scrap for the job: ${scrap.name}.`);
      } else if (caps >= 3) {
        updateCaps(-3);
        appendJournal('Spent 3 Stacks of Caps on parts.');
      } else {
        appendJournal('Cannot Mod & Repair: no Scrap and fewer than 3 Stacks of Caps.');
        onDone();
        return;
      }
    }
    if (tryLuck) {
      if (luck < 1) return;
      updateLuck(-1);
    }
    // The carried modifier applies to this one test only.
    if (nextTestModifier !== 0) setNextTestModifier(0);
    const result = runSkillTest(special, skills, {
      attribute: attrKeyMap[solution?.attribute ?? 'STR'] ?? 'S',
      skillName: solution?.skill ?? 'Athletics',
      difficulty,
      tryLuck
    }, special.L);
    if (result.passed) sfx.success(); else sfx.failure();
    setOutcome(result);
    const notes = applyOutcome(result);
    // Irradiated location (pg.111): suffer 1 Rad after completing any Safe Action.
    if (action.category === 'safe' && sector?.truths?.some(t => t.startsWith('Irradiated'))) {
      updateRads(1);
      notes.push('The irradiated ground gnaws at you. (+1 Rad)');
    }
    setBonusNotes(notes);
    appendJournal(
      `${action.name} — ${solution?.label ?? ''} (Diff ${difficulty}, TN ${result.targetNumber}${result.tryLuck ? ', Trying Luck' : ''})\n` +
      `Rolled: ${result.rolls.join(', ')} → ${result.passed ? 'PASSED' : 'FAILED'} (${result.successes}/${difficulty}${result.complications ? `, ${result.complications} complication(s)` : ''})`
    );
  };

  const handleReroll = () => {
    if (!outcome || rerolled || ap < 1) return;
    updateAp(-1);
    const next = rerollWorstDie(outcome, difficulty);
    setRerolled(true);
    setOutcome(next);
    setBonusNotes(applyOutcome(next));
    appendJournal(`Re-rolled one die (1 AP): ${next.rolls.join(', ')} → ${next.passed ? 'PASSED' : 'FAILED'}`);
  };

  const claimExtra = (index: number) => {
    if (ap < 1 || claimedExtras.includes(index)) return;
    updateAp(-1);
    setClaimedExtras([...claimedExtras, index]);
    const text = action.additionalSuccess[index];
    const note = resolveChoiceEffect(text, 'Additional Success (1 AP)');
    setChoiceNotes(prev => ({ ...prev, [text]: note }));
  };

  // ===== REST: one-tap smart heal (context picks the resources) =====
  if (action.name === 'Rest') {
    // In a settlement you may pay with Caps too — spend Caps first to save
    // Supplies for the road. In the wasteland, Supplies only.
    const inSettlement = !!sector?.isSettlement;
    const capsToSpend = inSettlement ? Math.min(missingHp, caps) : 0;
    const suppliesToSpend = Math.min(missingHp - capsToSpend, supplies);
    const healAmount = capsToSpend + suppliesToSpend;

    const doRest = () => {
      if (capsToSpend > 0) updateCaps(-capsToSpend);
      if (suppliesToSpend > 0) updateSupplies(-suppliesToSpend);
      updateHp(healAmount);
      appendJournal(`Rested: spent ${[capsToSpend > 0 ? `${capsToSpend} Stack(s) of Caps` : '', suppliesToSpend > 0 ? `${suppliesToSpend} Supplies` : ''].filter(Boolean).join(' + ')} → healed ${healAmount} HP (${Math.min(hp + healAmount, effectiveMaxHp)}/${effectiveMaxHp}).`);
      onDone();
    };

    const costLabel = [
      capsToSpend > 0 ? `${capsToSpend} Caps` : null,
      suppliesToSpend > 0 ? `${suppliesToSpend} Supplies` : null
    ].filter(Boolean).join(' + ');

    return (
      <div className="border-2 border-[#14FF00] p-4 bg-[#051a05] space-y-3">
        <h4 className="font-bold text-white">Rest {inSettlement ? '(Settlement — Caps accepted)' : '(Wasteland — Supplies only)'}</h4>
        <p className="text-sm normal-case opacity-80">"{action.quote}"</p>
        <div className="text-sm normal-case">
          HP {hp}/{effectiveMaxHp} • {supplies} Supplies • {caps} Caps
        </div>
        {healAmount > 0 ? (
          <button onClick={doRest} className="w-full border-2 border-[#14FF00] p-3 font-bold hover:bg-[#14FF00] hover:text-black animate-pulse">
            Rest — spend {costLabel}, heal {healAmount} HP{hp + healAmount >= effectiveMaxHp ? ' (to full)' : ''}
          </button>
        ) : (
          <div className="text-amber-400 text-sm normal-case border border-amber-400/50 p-2">
            {missingHp === 0 ? 'You are already at full health.' : 'Nothing left to spend — find Supplies first.'}
          </div>
        )}
        <button onClick={onDone} className="w-full border border-[#14FF00] p-2 hover:bg-[#14FF00] hover:text-black">Back</button>
      </div>
    );
  }

  // No-test actions resolve immediately.
  if (action.difficulty === null) {
    return (
      <div className="border-2 border-[#14FF00] p-4 bg-[#051a05] space-y-3">
        <h4 className="font-bold text-white">{action.name}</h4>
        <p className="text-sm normal-case opacity-80">"{action.quote}"</p>
        {action.requirement && <p className="text-xs normal-case text-amber-400">{action.requirement}</p>}
        <ul className="text-sm normal-case space-y-1">
          {action.success.map((s, i) => <li key={i}>• {s}</li>)}
        </ul>
        <button onClick={onDone} className="w-full border border-[#14FF00] p-2 hover:bg-[#14FF00] hover:text-black">Done</button>
      </div>
    );
  }

  if (outcome) {
    // Only ask when BOTH options genuinely matter (hurt AND injured).
    const patchUpChoice = action.name === 'Patch Up' && outcome.passed && injuries.length > 0 && missingHp > 0;
    return (
      <div className="border-2 border-[#14FF00] p-4 bg-[#051a05] space-y-3">
        <h4 className={`text-2xl font-bold text-center ${outcome.passed ? 'text-[#14FF00]' : 'text-red-500'}`}>
          {action.name}: {outcome.passed ? 'PASSED' : 'FAILED'}
        </h4>
        <div className="text-center text-white">
          Rolled {outcome.rolls.join(', ')} vs TN {outcome.targetNumber} — {outcome.successes}/{difficulty} successes
          {outcome.complications > 0 && <span className="text-red-500 font-bold"> • {outcome.complications} COMPLICATION(S)</span>}
        </div>

        {!rerolled && !outcome.passed && ap >= 1 && (
          <button onClick={handleReroll} className="w-full border border-amber-400 text-amber-400 p-2 text-sm hover:bg-amber-400 hover:text-black">
            Spend 1 AP: Re-roll worst die
          </button>
        )}

        <div className="text-sm normal-case space-y-1 border-t border-[#14FF00]/30 pt-2">
          {(outcome.passed ? action.success : action.failure).map((s, i) => (
            <li key={i} className="list-none">• {s}</li>
          ))}
          {bonusNotes.map((n, i) => <div key={`b${i}`} className="text-[#14FF00] font-bold">» {n}</div>)}
        </div>

        {patchUpChoice && (
          <div className="flex gap-2">
            <button
              onClick={() => { updateHp(4); appendJournal('Patch Up: healed 4 HP.'); onDone(); }}
              className="flex-1 border border-[#14FF00] p-2 text-sm hover:bg-[#14FF00] hover:text-black"
            >Heal 4 HP</button>
            {injuries.length > 0 && (
              <button
                onClick={() => { appendJournal(`Patch Up: treated injury — ${injuries[0]}.`); removeInjury(0); onDone(); }}
                className="flex-1 border border-[#14FF00] p-2 text-sm hover:bg-[#14FF00] hover:text-black"
              >Remove Injury</button>
            )}
          </div>
        )}

        {/* ===== Trade shop (pg.134): Value = Stacks of Caps; mods/conditions surcharge; double on failure ===== */}
        {action.name === 'Trade' && stock.length > 0 && (
          <div className="border border-amber-400/60 p-2 space-y-1">
            <div className="text-xs font-bold text-amber-400">TRADER'S STOCK (you have {caps} Stacks of Caps):</div>
            {stock.map(item => {
              const surcharge = (item.mods?.length ?? 0) + (item.condition?.match(/Pristine|Sturdy|Well-loved/) ? 1 : 0);
              const price = ((item.value ?? 1) + surcharge) * (outcome.passed ? 1 : 2);
              return (
                <div key={item.id} className="flex justify-between items-center text-xs normal-case border-b border-amber-400/20 pb-1">
                  <span>{item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}</span>
                  <button
                    onClick={() => {
                      updateCaps(-price);
                      addGear(item);
                      setStock(stock.filter(s => s.id !== item.id));
                      appendJournal(`Bought ${item.name} for ${price} Stack(s) of Caps.`);
                    }}
                    disabled={caps < price}
                    className="border border-amber-400 text-amber-400 px-2 py-0.5 hover:bg-amber-400 hover:text-black disabled:opacity-30 uppercase"
                  >
                    Buy ({price} ⛃)
                  </button>
                </div>
              );
            })}
            {outcome.passed && (
              <>
                <div className="text-xs font-bold text-amber-400 pt-1">SELL (gain the item's Value in Stacks):</div>
                {gear.filter(g => (g.value ?? 0) > 0 && !g.equipped).slice(0, 6).map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs normal-case border-b border-amber-400/20 pb-1">
                    <span>{item.name}</span>
                    <button
                      onClick={() => {
                        updateCaps(item.value ?? 1);
                        removeGear(item.id);
                        appendJournal(`Sold ${item.name} for ${item.value ?? 1} Stack(s) of Caps.`);
                      }}
                      className="border border-amber-400 text-amber-400 px-2 py-0.5 hover:bg-amber-400 hover:text-black uppercase"
                    >
                      Sell (+{item.value ?? 1} ⛃)
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ===== Mod & Repair workbench (pg.132) ===== */}
        {action.name === 'Modify and Repair Gear' && outcome.passed && (
          <div className="border border-amber-400/60 p-2 space-y-1">
            <div className="text-xs font-bold text-amber-400">WORKBENCH — choose an item:</div>
            {gear.filter(g => ['Weapon', 'Armor', 'Equipment'].includes(g.type)).map(item => (
              <button
                key={item.id}
                onClick={() => setWorkItemId(item.id)}
                className={`block w-full text-left text-xs normal-case border p-1.5 ${workItemId === item.id ? 'bg-amber-400/20 border-amber-400' : 'border-amber-400/30'}`}
              >
                {item.name}{item.condition ? ` [${item.condition.split(',')[0]}]` : ''}{item.mods?.length ? ` {${item.mods.join(', ')}}` : ''}
              </button>
            ))}
            {workItemId && (() => {
              const item = gear.find(g => g.id === workItemId);
              if (!item) return null;
              const applyTo = (changes: Partial<GearItem>, log: string) => {
                useGameState.setState(state => ({
                  gear: state.gear.map(g => g.id === workItemId ? { ...g, ...changes } : g)
                }));
                appendJournal(log);
                onDone();
              };
              return (
                <div className="flex gap-1 pt-1">
                  <button
                    onClick={() => {
                      const mod = item.type === 'Armor' ? rollArmorMod() : rollWeaponMod();
                      applyTo(
                        { mods: [...(item.mods ?? []), mod.name], name: `${mod.name} ${item.name}` },
                        `Modified ${item.name}: ${mod.name} — ${mod.description}`
                      );
                    }}
                    className="flex-1 border border-amber-400 text-amber-400 p-1.5 text-[10px] uppercase hover:bg-amber-400 hover:text-black"
                  >Apply Mod</button>
                  <button
                    onClick={() => {
                      const condition = rollCondition();
                      applyTo({ condition }, `Re-conditioned ${item.name}: now ${condition}.`);
                    }}
                    className="flex-1 border border-amber-400 text-amber-400 p-1.5 text-[10px] uppercase hover:bg-amber-400 hover:text-black"
                  >New Condition</button>
                  <button
                    onClick={() => applyTo({ condition: undefined }, `Repaired ${item.name}: condition removed.`)}
                    disabled={!item.condition}
                    className="flex-1 border border-amber-400 text-amber-400 p-1.5 text-[10px] uppercase hover:bg-amber-400 hover:text-black disabled:opacity-30"
                  >Remove Condition</button>
                </div>
              );
            })()}
          </div>
        )}

        {outcome.passed && !paidSpecial && action.additionalSuccess.length > 0 && (
          <div className="border-t border-[#14FF00]/30 pt-2 space-y-1">
            <div className="text-xs font-bold">ADDITIONAL SUCCESSES (1 AP each — AP: {ap}):</div>
            {action.additionalSuccess.map((extra, i) => (
              <button
                key={i}
                onClick={() => claimExtra(i)}
                disabled={(ap < 1 && !claimedExtras.includes(i)) || claimedExtras.includes(i)}
                className={`block w-full text-left text-xs normal-case border p-2 ${claimedExtras.includes(i) ? 'border-[#14FF00] bg-[#14FF00]/20' : 'border-[#14FF00]/40 hover:border-[#14FF00]'} disabled:opacity-40`}
              >
                {claimedExtras.includes(i) ? '✓ ' : ''}{extra}
                {choiceNotes[extra] && <span className="block text-[#14FF00] font-bold">» {choiceNotes[extra]}</span>}
              </button>
            ))}
          </div>
        )}

        {outcome.complications > 0 && (
          <div className="border border-red-500 p-2 text-xs normal-case space-y-1">
            <div className="font-bold text-red-500 uppercase">
              Complication! Pick what goes wrong{complicationPicked ? ' — resolved:' : ':'}
            </div>
            {action.complications.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  if (complicationPicked) return;
                  setComplicationPicked(c);
                  const note = resolveChoiceEffect(c, 'Complication');
                  setChoiceNotes(prev => ({ ...prev, [c]: note }));
                }}
                disabled={!!complicationPicked && complicationPicked !== c}
                className={`block w-full text-left border p-1.5 ${complicationPicked === c ? 'bg-red-500/20 border-red-500' : 'border-red-500/40 hover:border-red-500'} disabled:opacity-30`}
              >
                {complicationPicked === c ? '✓ ' : ''}{c}
                {choiceNotes[c] && <span className="block text-[#14FF00] font-bold">» {choiceNotes[c]}</span>}
              </button>
            ))}
          </div>
        )}

        <button onClick={onDone} className="w-full border-2 border-[#14FF00] p-2 font-bold hover:bg-[#14FF00] hover:text-black">
          Acknowledge
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#14FF00] p-4 bg-[#051a05] space-y-3">
      <h4 className="font-bold text-white">{action.name} <span className="text-xs opacity-60">({action.category})</span></h4>
      <p className="text-xs normal-case opacity-70">"{action.quote}"</p>
      {action.requirement && <p className="text-xs normal-case text-amber-400">{action.requirement}</p>}
      {action.difficultyNote && <p className="text-xs normal-case opacity-70">{action.difficultyNote}</p>}

      <div>
        <div className="text-xs font-bold mb-1">SOLUTION (best pre-selected):</div>
        {action.solutions.map((s, i) => {
          const tn = s.attribute !== 'Special' && s.skill
            ? special[ATTR_KEY_MAP[s.attribute]] + (skills.find(k => k.name === s.skill)?.rank ?? 0)
            : null;
          return (
            <button
              key={i}
              onClick={() => setSolutionIndex(i)}
              className={`block w-full text-left text-sm border p-2 mb-1 ${i === solutionIndex ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00]/40 hover:border-[#14FF00]'}`}
            >
              {s.label} {s.skill ? `— ${s.attribute} (${s.skill})` : ''}{tn !== null ? ` · TN ${tn}` : ''}
            </button>
          );
        })}
      </div>

      {(repDelta !== 0 || autoMods.length > 0) && (
        <div>
          <div className="text-xs font-bold mb-1">AUTO-DETECTED (tap to override):</div>
          {repDelta !== 0 && (
            <button
              onClick={() => setRepApplied(!repApplied)}
              className={`block w-full text-left text-xs normal-case border p-1.5 mb-1 ${repApplied ? 'bg-[#14FF00]/20 border-[#14FF00]' : 'border-[#14FF00]/30 line-through opacity-50'}`}
            >
              <span className={repDelta > 0 ? 'text-red-400' : 'text-[#14FF00]'}>[{repDelta > 0 ? '+' : '-'}1]</span>{' '}
              Settlement Reputation: {sector?.reputation}
            </button>
          )}
          {autoMods.map((m, i) => {
            const off = autoModsOff.includes(i);
            return (
              <button
                key={i}
                onClick={() => setAutoModsOff(off ? autoModsOff.filter(x => x !== i) : [...autoModsOff, i])}
                className={`block w-full text-left text-xs normal-case border p-1.5 mb-1 ${!off ? 'bg-[#14FF00]/20 border-[#14FF00]' : 'border-[#14FF00]/30 line-through opacity-50'}`}
              >
                <span className="text-red-400">[+{m.delta}]</span> {m.label}
              </button>
            );
          })}
        </div>
      )}

      {action.modifiers.length > 0 && (
        <div>
          <div className="text-xs font-bold mb-1">MODIFIERS (toggle those that apply):</div>
          {action.modifiers
            .filter(m => !m.skill || m.skill === solution?.skill)
            .map((m) => {
              const realIndex = action.modifiers.indexOf(m);
              const active = activeModifiers.includes(realIndex);
              return (
                <button
                  key={realIndex}
                  onClick={() => setActiveModifiers(active ? activeModifiers.filter(i => i !== realIndex) : [...activeModifiers, realIndex])}
                  className={`block w-full text-left text-xs normal-case border p-1.5 mb-1 ${active ? 'bg-[#14FF00]/20 border-[#14FF00]' : 'border-[#14FF00]/30 hover:border-[#14FF00]/60'}`}
                >
                  <span className={m.direction === '+' ? 'text-red-400' : 'text-[#14FF00]'}>[{m.direction}1]</span> {m.text}
                </button>
              );
            })}
        </div>
      )}

      {/* Mod & Repair: pick the item BEFORE rolling, so a failed roll has a
          target to Break (pg.132). */}
      {action.name === 'Modify and Repair Gear' && (
        <div className="border border-amber-400/60 p-2 space-y-1">
          <div className="text-xs font-bold text-amber-400">CHOOSE AN ITEM TO WORK ON:</div>
          {gear.filter(g => ['Weapon', 'Armor', 'Equipment'].includes(g.type)).map(item => (
            <button
              key={item.id}
              onClick={() => setWorkItemId(item.id)}
              className={`block w-full text-left text-xs normal-case border p-1.5 ${workItemId === item.id ? 'bg-amber-400/20 border-amber-400' : 'border-amber-400/30'}`}
            >
              {item.name}{item.condition ? ` [${item.condition.split(',')[0]}]` : ''}{item.mods?.length ? ` {${item.mods.join(', ')}}` : ''}
            </button>
          ))}
          {gear.filter(g => ['Weapon', 'Armor', 'Equipment'].includes(g.type)).length === 0 && (
            <div className="text-xs normal-case opacity-60">No modifiable gear.</div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center text-sm border-y border-[#14FF00]/40 py-2">
        <span>DIFFICULTY: <span className="text-white font-bold text-lg">{difficulty}</span></span>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={tryLuck} disabled={luck < 1} onChange={e => setTryLuck(e.target.checked)} />
          Try Your Luck (1 LP, TN={special.L})
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 border border-[#14FF00] p-2 hover:bg-[#14FF00] hover:text-black">Cancel</button>
        <button
          onClick={roll}
          disabled={action.name === 'Modify and Repair Gear' && !workItemId}
          className="flex-1 border-2 border-[#14FF00] p-2 font-bold bg-black hover:bg-[#14FF00] hover:text-black disabled:opacity-30 animate-pulse flex items-center justify-center gap-2"
        >
          <Dices size={16} /> {action.name === 'Modify and Repair Gear' && !workItemId ? 'Pick an item first' : 'Roll 2d20'}
        </button>
      </div>
    </div>
  );
}

// =================================================================
// ROUND TAB — the guided Travel → Encounter → Action → Journal loop
// =================================================================
export default function RoundTab() {
  const {
    round, day, stage, inDanger, currentEncounter, currentSector, sectorData,
    supplies, hp, luck, xp, mainQuest, scavengedThisRound, sideQuests,
    setStage, setDanger, setEncounter, completeRound, setCurrentSector,
    updateSectorData, updateSupplies, updateHp, updateRads, updateLuck, updateXp,
    appendJournal, setMainQuest, level, setSideQuestStatus,
    startCombat, setCombatState, updateCaps, addGear, combatActive
  } = useGameState();
  const { showAlert } = useUIState();

  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [dangerChecks, setDangerChecks] = useState<boolean[]>([false, false, false]);
  const [activeAction, setActiveAction] = useState<GameAction | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [journalDraft, setJournalDraft] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  /** Foes rolled for this encounter, ready to fight. */
  const [encounterFoes, setEncounterFoes] = useState<FoeTemplate[]>([]);
  /** Encounter "Add to scene" GM-tools menu open state. */
  const [sceneMenuOpen, setSceneMenuOpen] = useState(false);
  /** Player override of the auto-detected danger verdict (null = use auto). */
  const [dangerOverride, setDangerOverride] = useState<boolean | null>(null);
  /** Action mode to preselect when combat opens (Fight / Talk Down / …). */
  const [initialCombatAction, setInitialCombatAction] = useState<PlayerCombatAction>('Oppose');

  const sector = sectorData[currentSector];
  const isSettlement = !!sector?.isSettlement;
  const atBlocker = mainQuest?.blockerLocation === currentSector;
  const isIrradiated = (square: number) =>
    !!sectorData[square]?.truths?.some(t => t.startsWith('Irradiated'));

  const adjacentSquares = useMemo(
    () => Array.from({ length: 25 }, (_, i) => i + 1).filter(n => isAdjacent(currentSector, n) && !IMPASSABLE.includes(n)),
    [currentSector]
  );

  // ---------- LOCATION GENERATION (on demand) ----------
  // The book regularly says "Generate a Settlement…" (Restricted Area,
  // Politics, Captured…). This writes a full location onto any square —
  // generating unexplored squares or converting explored ones.
  const generateLocationAt = (square: number, type: 'settlement' | 'wasteland') => {
    const isSettlement = type === 'settlement';
    const existing = sectorData[square];
    const icon = rollIcon();
    const truth = isSettlement ? rollSettlementTruth() : rollWastelandTruth();
    const faction = isSettlement ? rollFaction() : undefined;
    const reputation = isSettlement ? rollSettlementReputation() : undefined;
    updateSectorData(square, {
      explored: true,
      scavengeAvailable: existing?.scavengeAvailable ?? true,
      isSettlement,
      icon,
      truths: [truth],
      faction,
      reputation
    });
    const verb = existing?.explored ? 'Converted' : 'Generated';
    appendJournal(`${verb} Square ${square}: ${isSettlement ? `Settlement (${faction}, Reputation: ${reputation})` : 'Wasteland'} — Icon: ${icon}\nTruth: ${truth}`);
  };

  // ---------- TRAVEL ----------
  const settlementNear = (target: number, distance: number) =>
    Object.entries(sectorData).some(([num, info]) => {
      if (!info.isSettlement) return false;
      const n = Number(num);
      const dist = Math.abs(Math.floor((n - 1) / 5) - Math.floor((target - 1) / 5)) + Math.abs(((n - 1) % 5) - ((target - 1) % 5));
      return dist <= distance;
    });

  const handleTravel = () => {
    if (!selectedSquare) return;
    // Irradiated location (pg.111): suffer 1 Rad when Traveling OUT of one.
    if (isIrradiated(currentSector)) {
      updateRads(1);
      sfx.geiger(4);
      appendJournal('Leaving the irradiated ground costs you. (+1 Rad)');
    }
    // Cost: 1 Supply, or lose 2 HP if you cannot pay (pg.108).
    if (supplies >= 1) {
      updateSupplies(-1);
    } else {
      updateHp(-2);
      appendJournal('No supplies for the road — the hunger takes its toll. (-2 HP)');
    }
    setCurrentSector(selectedSquare);

    const info = sectorData[selectedSquare];
    let travelNote = `Round ${round}: Traveled to Square ${selectedSquare}.`;

    if (!info?.explored) {
      // Generate the location: Inhabitants → Faction → Icon → Truth (pg.110-111).
      const inhabitants = resolveInhabitants(
        rollInhabitants(),
        settlementNear(selectedSquare, 2),
        settlementNear(selectedSquare, 1)
      );
      const newIsSettlement = inhabitants === 'settlement';
      const icon = rollIcon();
      const truth = newIsSettlement ? rollSettlementTruth() : rollWastelandTruth();
      const faction = newIsSettlement ? rollFaction() : undefined;
      const reputation = newIsSettlement ? rollSettlementReputation() : undefined;
      updateSectorData(selectedSquare, {
        explored: true,
        scavengeAvailable: true,
        isSettlement: newIsSettlement,
        icon,
        truths: [truth],
        faction,
        reputation
      });
      travelNote += `\nDiscovered: ${newIsSettlement ? `a Settlement (${faction}, Reputation: ${reputation})` : 'open Wasteland'} — Icon: ${icon}\nTruth: ${truth}`;
      if (truth.startsWith('Irradiated')) {
        updateRads(1);
        sfx.geiger(4);
        travelNote += '\nThe land sears with radiation. (+1 RAD)';
      }
    } else if (info.truths?.some(t => t.startsWith('Irradiated'))) {
      updateRads(1);
      sfx.geiger(4);
      travelNote += '\nTraveling through irradiated ground. (+1 RAD)';
    }

    // Mobile Blocker (pg.75): if you travel anywhere else, on a d20 of 5 or
    // lower the Blocker Location shifts to an adjacent unexplored square.
    if (mainQuest?.blocker === 'Mobile' && mainQuest.blockerLocation && selectedSquare !== mainQuest.blockerLocation) {
      if (Math.floor(Math.random() * 20) + 1 <= 5) {
        const candidates = Array.from({ length: 25 }, (_, i) => i + 1).filter(n =>
          isAdjacent(mainQuest.blockerLocation!, n) && !IMPASSABLE.includes(n) && !sectorData[n]?.explored);
        if (candidates.length > 0) {
          const next = candidates[Math.floor(Math.random() * candidates.length)];
          setMainQuest({ ...mainQuest, blockerLocation: next });
          travelNote += `\nYour quarry has MOVED — the Blocker is now at Square ${next}!`;
        }
      }
    }

    // Hunted Blocker (pg.75): each Travel, roll vs a shrinking threshold; on a
    // hit the Hunter appears in your next Encounter, and the threshold resets.
    if (mainQuest?.blocker === 'Hunted') {
      const threshold = mainQuest.hunterThreshold ?? 19;
      const pursuit = Math.floor(Math.random() * 20) + 1;
      if (pursuit >= threshold) {
        setMainQuest({ ...mainQuest, hunterThreshold: 19 });
        travelNote += `\nPursuit roll ${pursuit} (needed ${threshold}+): YOUR HUNTER ARRIVES — they appear during the next Encounter!`;
      } else {
        setMainQuest({ ...mainQuest, hunterThreshold: Math.max(10, threshold - 1) });
        travelNote += `\nPursuit roll ${pursuit} (needed ${threshold}+): you stay ahead of your Hunter… for now.`;
      }
    }

    appendJournal(travelNote);
    setSelectedSquare(null);
    setEncounter(null);
    setStage('encounter');
  };

  // ---------- ENCOUNTER ----------
  const generateEncounter = (): EncounterInfo => {
    if (atBlocker && mainQuest) {
      return {
        type: 'blocker',
        title: `MAIN QUEST BLOCKER: ${mainQuest.blocker}`,
        description: `${mainQuest.blockerDesc ?? ''}\n\nTie this encounter to your Blocker — once you have dealt with it, take the Clear Main Quest Blocker action.`,
        question: 'How does the Blocker manifest here, and what will it cost you to get past it?'
      };
    }
    const enc = isSettlement ? rollSettlementEncounter() : rollWastelandEncounter();
    return {
      type: isSettlement ? 'settlement' : 'wasteland',
      title: enc.name,
      description: enc.description,
      question: enc.question
    };
  };

  // Reads the encounter's own text and generates everything it references:
  // foes (by faction), Dangerous NPCs, NPCs (+1 XP), Side Quests, Chems.
  // Returns true if the scene implies Danger.
  const autoPopulate = (enc: EncounterInfo): boolean => {
    const text = `${enc.title} ${enc.description}`.toUpperCase();
    const newExtras: string[] = [];
    let foes: FoeTemplate[] = [];
    let threat = enc.type === 'blocker';
    const journalLines: string[] = [];

    const spawnFoes = (type?: FoeType) => {
      const gen = generateFoeEncounter(type);
      const parsed = gen.scenarios.flatMap(parseFoesFromScenario);
      foes = [...foes, ...(parsed.length ? parsed : [getRandomFoe()])];
      const line = `Foes (${gen.foeType}): ${gen.scenarios.join(' ')}`;
      newExtras.push(line);
      journalLines.push(line);
      threat = true;
    };

    if (/\[RAIDER/.test(text)) spawnFoes('Raiders');
    if (/\[CREATURE/.test(text)) spawnFoes('Creature');
    if (/\[SUPER MUTANT/.test(text)) spawnFoes('Super Mutants');
    if (/\[ROBOT/.test(text)) spawnFoes('Robots');
    if (/\[FOE/.test(text)) spawnFoes();

    if (/\[DANGEROUS NPC/.test(text)) {
      const dnpc = generateDangerousNpc();
      const line = `Dangerous NPC: ${dnpc.name} (Threat ${dnpc.threat}) — ${dnpc.weapons} Special: ${dnpc.ability.name} [${dnpc.ability.faction}]`;
      newExtras.push(line);
      journalLines.push(line);
      threat = true;
    }
    if (/\[NPC\]/.test(text)) {
      const npc = generateFullNpc();
      useGameState.getState().addNpc({
        name: npc.name,
        description: `${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction}) — ${npc.features.join('; ')} | Truth: ${npc.truth}`,
        location: currentSector
      });
      const line = `NPC: ${npc.name} — ${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction}). (+1 XP)`;
      newExtras.push(line);
      journalLines.push(line);
    }
    if (/\[SIDE ?QUEST\]/.test(text)) {
      const quest = generateSideQuest(currentSector);
      useGameState.getState().addSideQuest({
        goalType: quest.goalType, goal: quest.goal, questions: quest.questions,
        reward: quest.rewardName, rewardDesc: quest.rewardDescription,
        location: quest.location, status: 'Active'
      });
      const line = `New Side Quest [${quest.goalType}]: ${quest.goal} (Sq.${quest.location}, Reward: ${quest.rewardName})`;
      newExtras.push(line);
      journalLines.push(line);
    }
    if (/\[CHEM\]/.test(text)) {
      const chem = rollChem();
      useGameState.getState().addGear(chem);
      const line = `Found a Chem: ${chem.name}.`;
      newExtras.push(line);
      journalLines.push(line);
    }

    setExtras(newExtras);
    setEncounterFoes(foes);
    setDangerChecks([threat, false, false]);
    if (journalLines.length > 0) appendJournal(journalLines.join('\n'));
    return threat;
  };

  // Auto-generate the Encounter when its stage begins (effect, not render,
  // so StrictMode double-rendering can't journal it twice).
  useEffect(() => {
    if (stage === 'encounter' && !currentEncounter) {
      const enc = generateEncounter();
      setEncounter(enc);
      appendJournal(`Encounter — ${enc.title}: ${enc.description}`);
      autoPopulate(enc);
      setDangerOverride(null);
      setSceneMenuOpen(false);
      // Irradiated location (pg.111): suffer 1 Rad when an Encounter starts here.
      if (isIrradiated(currentSector)) {
        updateRads(1);
        sfx.geiger(4);
        appendJournal('The encounter begins under a haze of radiation. (+1 Rad)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentEncounter]);

  const playTheOdds = () => {
    if (luck < 1) return;
    updateLuck(-1);
    const enc = generateEncounter();
    setEncounter(enc);
    appendJournal(`Played the Odds (1 LP) — new Encounter: ${enc.title}`);
    autoPopulate(enc);
    setDangerOverride(null);
  };

  const addFoes = () => {
    const foes = generateFoeEncounter();
    const text = `Foes (${foes.foeType}): ${foes.scenarios.join(' ')}`;
    setExtras([...extras, text]);
    appendJournal(text);
    // Turn the scenario text into real combatants (fallback: one random foe).
    const parsed = foes.scenarios.flatMap(parseFoesFromScenario);
    setEncounterFoes([...encounterFoes, ...(parsed.length > 0 ? parsed : [getRandomFoe()])]);
  };

  const beginCombat = () => {
    const foes = encounterFoes.length > 0 ? encounterFoes : [getRandomFoe()];
    startCombat(foes);
    const state = rollCombatStateEntry();
    setCombatState(`${state.name}: ${state.description}`);
    setDanger(true);
    setEncounterFoes([]);
    appendJournal(`Combat begins! (${foes.map(f => f.name).join(', ')}) — Combat State: ${state.name}`);
  };

  /** Enter combat with a specific action mode preselected (Fight / Talk Down /
   *  Outwit / Flee / Slaughter) so danger is always resolved by the real engine
   *  with the book's success/failure consequences. */
  const startCombatWithMode = (mode: PlayerCombatAction) => {
    // Irradiated location (pg.111): finishing the Encounter (here, by entering
    // combat from it) costs 1 Rad.
    if (stage === 'encounter' && isIrradiated(currentSector)) {
      updateRads(1);
      sfx.geiger(4);
      appendJournal('The encounter closes in irradiated air. (+1 Rad)');
    }
    setInitialCombatAction(mode);
    beginCombat();
  };

  const addNpcToScene = () => {
    const npc = generateFullNpc();
    useGameState.getState().addNpc({
      name: npc.name,
      description: `${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction}) — ${npc.features.join('; ')} | Truth: ${npc.truth}`,
      location: currentSector
    });
    const text = `NPC: ${npc.name} — ${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction}). Features: ${npc.features.join('; ')}. (+1 XP for a new face)`;
    setExtras([...extras, text]);
    appendJournal(text);
  };

  const addDangerousNpc = () => {
    const dnpc = generateDangerousNpc();
    const text = `Dangerous NPC: ${dnpc.name} (Threat ${dnpc.threat}) — ${dnpc.weapons} Special: ${dnpc.ability.name} [${dnpc.ability.faction}]`;
    setExtras([...extras, text]);
    appendJournal(text);
  };

  const proceedToAction = (danger: boolean) => {
    // Irradiated location (pg.111): suffer 1 Rad when the Encounter finishes.
    if (isIrradiated(currentSector)) {
      updateRads(1);
      sfx.geiger(4);
      appendJournal('You push on through the radiation. (+1 Rad)');
    }
    setDanger(danger);
    setDangerChecks([false, false, false]);
    setExtras([]);
    setStage('action');
  };

  // ---------- ACTION ----------
  const clearBlocker = () => {
    if (!mainQuest) return;
    const result = rollClearBlocker(level);
    if (result.name === 'New Blocker') {
      const newBlocker = rollMainQuestBlocker();
      const newLocation = newBlocker.name === 'Unknown Location'
        ? null
        : EDGE_SQUARES[Math.floor(Math.random() * EDGE_SQUARES.length)];
      setMainQuest({
        ...mainQuest,
        blocker: newBlocker.name,
        blockerDesc: newBlocker.description,
        blockerLocation: newLocation
      });
      updateXp(1);
      updateLuck(2);
      appendJournal(`Cleared the Blocker! But the road goes on — NEW BLOCKER: ${newBlocker.name}${newLocation ? ` at Square ${newLocation}` : ' (location unknown)'}. (+1 XP, +2 Luck)`);
      showAlert(`Blocker cleared! A new Blocker appears: ${newBlocker.name}. (+1 XP, +2 Luck Points)`);
    } else {
      appendJournal(`CLEAR BLOCKER — ${result.name}: ${result.effect}`);
      showAlert(`${result.name}: ${result.effect}\n\nIf you succeed at your Quest, use "Complete Main Quest" and write your Epilogue.`);
    }
  };

  const completeMainQuest = () => {
    if (!mainQuest) return;
    setMainQuest({ ...mainQuest, status: 'Completed' });
    updateXp(3);
    appendJournal('MAIN QUEST COMPLETE! (+3 XP) — Your story reaches its end. Write your Epilogue in the Journal stage.');
    showAlert('Main Quest complete! +3 XP. Write your Epilogue this Journal stage — and perhaps a new Dweller will follow in your footsteps.');
  };

  /** Applies a side quest reward to the character for real. */
  const applyQuestReward = (rewardName: string): string => {
    const pickBetter = (a: ReturnType<typeof rollWeapon>, b: ReturnType<typeof rollWeapon>) =>
      (a.value ?? 0) >= (b.value ?? 0) ? a : b;
    switch (rewardName) {
      case 'Caps': updateCaps(1); return '+1 Stack of Caps';
      case 'More Caps': updateCaps(2); return '+2 Stacks of Caps';
      case 'Even More Caps': updateCaps(3); return '+3 Stacks of Caps';
      case 'Fortune': updateCaps(5); return '+5 Stacks of Caps';
      case 'Ranged Weapon': {
        const w = pickBetter(rollWeapon('ranged'), rollWeapon('ranged'));
        addGear(w);
        return `Gained ${w.name}`;
      }
      case 'Melee Weapon': {
        const w = pickBetter(rollWeapon('melee'), rollWeapon('melee'));
        addGear(w);
        return `Gained ${w.name}`;
      }
      case 'Quality Weaponry': {
        const w = Math.random() < 0.5 ? rollWeapon('ranged') : rollWeapon('melee');
        w.condition = 'Pristine, pre-war, mastercrafted';
        w.name = `Pristine ${w.name}`;
        addGear(w);
        return `Gained ${w.name}`;
      }
      case 'Chems':
      case 'A Backpack full of Chems': {
        const count = rewardName === 'Chems' ? rollQuantity().amount : 5;
        const names: string[] = [];
        for (let i = 0; i < count; i++) {
          const chem = rollChem();
          addGear(chem);
          names.push(chem.name);
        }
        return `Gained ${count} chems: ${names.join(', ')}`;
      }
      case 'Supplies': {
        const q = rollQuantity();
        updateSupplies(q.amount);
        return `+${q.amount} Supplies`;
      }
      case 'Training': {
        updateXp(1);
        return '+1 bonus XP (Training)';
      }
      case 'Armor': {
        const a = pickBetter(rollArmor(), rollArmor());
        addGear(a);
        return `Gained ${a.name}`;
      }
      case 'Pristine Armor': {
        const a = rollArmor();
        a.condition = 'Pristine, pre-war, mastercrafted';
        a.name = `Pristine ${a.name}`;
        addGear(a);
        return `Gained ${a.name}`;
      }
      case 'Power Armor': {
        addGear({
          id: `reward-${Date.now()}`,
          name: `${rollCondition().split(',')[0]} Power Armor`,
          type: 'Armor', quantity: 1, weight: 5, value: 5
        });
        return 'Gained Power Armor!';
      }
      case 'A Favour': {
        if (isSettlement && sector?.reputation) {
          const r = shiftReputation(sector.reputation as Reputation, 1);
          updateSectorData(currentSector, { reputation: r });
          return `Reputation rises again: ${r}`;
        }
        return 'A favour owed — call it in later';
      }
      case 'A Pact': {
        if (isSettlement && sector?.reputation) {
          const r = shiftReputation(sector.reputation as Reputation, 2);
          updateSectorData(currentSector, { reputation: r });
          return `A pact is sworn: ${r}`;
        }
        return 'A pact sworn — powerful friends now';
      }
      case 'Modifications': {
        const target = useGameState.getState().gear.find(g => g.equipped && (g.type === 'Weapon' || g.type === 'Armor'))
          ?? useGameState.getState().gear.find(g => g.type === 'Weapon' || g.type === 'Armor');
        if (target) {
          const mod = target.type === 'Armor' ? rollArmorMod() : rollWeaponMod();
          useGameState.setState(state => ({
            gear: state.gear.map(g => g.id === target.id
              ? { ...g, mods: [...(g.mods ?? []), mod.name], name: `${mod.name} ${g.name}` }
              : g)
          }));
          return `${target.name} gains ${mod.name}: ${mod.description}`;
        }
        return 'A free modification — visit the workbench';
      }
      case 'Information': {
        // Reveal adjacent unexplored locations as if travelled to.
        const revealed: string[] = [];
        Array.from({ length: 25 }, (_, i) => i + 1)
          .filter(n => isAdjacent(currentSector, n) && !IMPASSABLE.includes(n) && !sectorData[n]?.explored)
          .forEach(n => {
            const inhabitants = resolveInhabitants(rollInhabitants(), settlementNear(n, 2), settlementNear(n, 1));
            const newSettlement = inhabitants === 'settlement';
            updateSectorData(n, {
              explored: true, scavengeAvailable: true, isSettlement: newSettlement,
              icon: rollIcon(),
              truths: [newSettlement ? rollSettlementTruth() : rollWastelandTruth()],
              faction: newSettlement ? rollFaction() : undefined,
              reputation: newSettlement ? rollSettlementReputation() : undefined
            });
            revealed.push(`Sq.${n}`);
          });
        return revealed.length ? `Maps revealed: ${revealed.join(', ')}` : 'The information confirms what you already knew';
      }
      case 'Blocker Bypass': {
        if (mainQuest) {
          setMainQuest({ ...mainQuest, blockerDesc: `${mainQuest.blockerDesc ?? ''} [BYPASS EARNED: you may Clear this Blocker without overcoming it.]` });
        }
        return 'You hold the key past your Main Quest Blocker!';
      }
      case 'Nothing…': {
        addSideQuestForVanishedGiver();
        return 'The reward... never arrives. A new quest: hunt them down.';
      }
      default:
        return 'Reward noted in your journal.';
    }
  };

  const addSideQuestForVanishedGiver = () => {
    useGameState.getState().addSideQuest({
      goalType: 'Vengeance',
      goal: 'They stiffed you on the reward and vanished. Hunt them down.',
      questions: 'Where would they run? What will you do when you find them?',
      reward: 'Even More Caps',
      rewardDesc: 'Three Stacks of Caps — theirs, now yours.',
      location: Math.floor(Math.random() * 20) + 1,
      status: 'Active'
    });
  };

  // Reward renegotiation (pg.146): if the offered Reward doesn't fit the Goal,
  // spend a Luck Point to re-roll it, or attempt a CHA (Barter) diff-2 test.
  // One attempt per quest, either way.
  const renegotiateReward = (index: number, method: 'luck' | 'barter') => {
    const q = sideQuests[index];
    if (!q || q.status !== 'Active' || q.renegotiated) return;
    const applyNew = () => {
      const nr = rollQuestReward();
      useGameState.setState(s => ({
        sideQuests: s.sideQuests.map((sq, i) =>
          i === index ? { ...sq, reward: nr.name, rewardDesc: nr.description, renegotiated: true } : sq)
      }));
      appendJournal(`Renegotiated Side Quest reward → ${nr.name}: ${nr.description}`);
      showAlert(`New reward: ${nr.name}\n${nr.description}`);
    };
    if (method === 'luck') {
      if (luck < 1) return;
      updateLuck(-1);
      applyNew();
    } else {
      const { special, skills } = useGameState.getState();
      const outcome = runSkillTest(special, skills, { attribute: 'C', skillName: 'Barter', difficulty: 2 }, special.L);
      appendJournal(`Renegotiate (Barter, diff 2): rolled ${outcome.rolls.join(', ')} → ${outcome.passed ? 'SUCCESS' : 'FAILURE'}`);
      if (outcome.passed) {
        applyNew();
      } else {
        useGameState.setState(s => ({
          sideQuests: s.sideQuests.map((sq, i) => i === index ? { ...sq, renegotiated: true } : sq)
        }));
        showAlert('The NPC holds firm — the reward stands.');
      }
    }
  };

  // Complete Side Quest (pg.125): reward applied for real + 1 XP + 1 Luck
  // Point, and the settlement remembers your help (Reputation +1 step).
  const completeSideQuest = (index: number) => {
    const quest = sideQuests[index];
    setSideQuestStatus(index, 'Completed');
    updateXp(1);
    updateLuck(1);
    const rewardNote = applyQuestReward(quest.reward);
    let repNote = '';
    if (isSettlement && sector?.reputation) {
      const newRep = shiftReputation(sector.reputation as Reputation, 1);
      if (newRep !== sector.reputation) {
        updateSectorData(currentSector, { reputation: newRep });
        repNote = ` The settlement's view of you improves: ${newRep}.`;
      }
    }
    appendJournal(`SIDE QUEST COMPLETE [${quest.goalType}]: ${quest.goal}\nReward — ${quest.reward}: ${rewardNote} (+1 XP, +1 Luck Point)${repNote}`);
    showAlert(`Side Quest complete!\n${rewardNote}\n+1 XP, +1 Luck Point.${repNote}`);
  };

  // Only show actions that make sense RIGHT NOW. The book's requirements are
  // applied as visibility, not as disabled noise.
  const effectiveMaxHp = Math.max(1, useGameState.getState().maxHp - useGameState.getState().rads);
  const availableActions = ACTIONS.filter(a => {
    if (a.category === 'reaction') return false;
    if (inDanger) return a.category === 'dangerous';
    if (a.category !== 'safe') return false;
    switch (a.name) {
      case 'Approach': return encounterFoes.length > 0;
      case 'Clear Main Quest Blocker': return false;  // dedicated button below
      case 'Complete Side Quest': return false;       // dedicated panel below
      case 'Trade': return isSettlement;
      case 'Scavenge': return !scavengedThisRound && (!isSettlement || sector?.reputation === 'Hostile');
      case 'Patch Up': return hp < effectiveMaxHp || useGameState.getState().injuries.length > 0;
      case 'Rest': return hp < effectiveMaxHp;
      case 'Meet': return useGameState.getState().npcs.some(n => n.location === currentSector);
      case 'Level Up': return xp >= 1;
      default: return true;
    }
  });

  // ---------- JOURNAL ----------
  const finishRound = () => {
    const header = `\n=== Round ${round} — ${gameDate(day)} (Square ${currentSector}) ===`;
    const body = journalDraft.trim() || '(The Wasteland keeps its silence today.)';
    useGameState.setState(state => ({ journalText: state.journalText + `${header}\n${body}\n` }));
    setJournalDraft('');
    completeRound();
  };

  // =================== RENDER ===================
  // A fight in progress takes over the Round page — resolved in place, no
  // tab-hop. On exit CombatView returns us to the right stage.
  if (combatActive) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="border-b-2 border-[#14FF00] pb-2 flex justify-between items-baseline uppercase">
          <h2 className="text-xl font-bold tracking-widest">ROUND {round}</h2>
          <span className="text-sm opacity-70">Square {currentSector}</span>
        </div>
        <CombatView onExit={(toStage) => setStage(toStage)} initialAction={initialCombatAction} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 uppercase pb-8">
      {/* Round header + stage tracker */}
      <div className="border-b-2 border-[#14FF00] pb-2">
        <div className="flex justify-between items-baseline">
          <h2 className="text-xl font-bold tracking-widest">ROUND {round}</h2>
          <span className="text-sm opacity-70">{gameDate(day)} • Square {currentSector}{isSettlement ? ' (Settlement)' : ''}</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1 px-2 py-1 border text-xs flex-1 justify-center ${stage === s.id ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00]/40 opacity-60'}`}>
                <s.icon size={12} /> {s.label}
              </div>
              {i < STAGES.length - 1 && <ChevronRight size={12} className="opacity-40" />}
            </div>
          ))}
        </div>
      </div>

      {/* ============ TRAVEL ============ */}
      {stage === 'travel' && (
        <div className="space-y-3">
          <p className="text-sm normal-case opacity-80">
            Pick an adjacent location (no diagonals). Travel costs 1 Supply — with none, you lose 2 HP.
            You have {supplies} Supplies, {hp} HP.
          </p>
          <div className="grid grid-cols-5 gap-1 border-2 border-[#14FF00] p-1 bg-[#051a05] max-w-xs mx-auto">
            {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
              const info = sectorData[num];
              const impassable = IMPASSABLE.includes(num);
              const adjacent = adjacentSquares.includes(num);
              const isCurrent = num === currentSector;
              const isBlockerSq = mainQuest?.blockerLocation === num;
              return (
                <button
                  key={num}
                  disabled={impassable}
                  onClick={() => setSelectedSquare(num)}
                  className={`aspect-square flex flex-col items-center justify-center border text-[10px] relative
                    ${impassable ? 'opacity-20 bg-black' : 'cursor-pointer'}
                    ${isCurrent ? 'bg-[#14FF00] text-black font-bold' : ''}
                    ${selectedSquare === num ? 'bg-[#14FF00]/60 text-black font-bold' : ''}
                    ${adjacent && selectedSquare !== num ? 'border-[#14FF00] animate-pulse' : 'border-[#14FF00]/30'}
                    ${!info?.explored && !impassable ? 'border-dashed' : ''}`}
                >
                  {num === VAULT_SQUARE ? 'VAULT' : impassable ? 'X' : num}
                  {isBlockerSq && <span className="absolute top-0 right-0 text-red-500 font-bold">!</span>}
                  {sideQuests.some(q => q.status === 'Active' && q.location === num) && (
                    <span className="absolute top-0 left-0.5 text-amber-400 font-bold">?</span>
                  )}
                  {info?.isSettlement && <span className="text-[8px]">⌂</span>}
                </button>
              );
            })}
          </div>
          {selectedSquare && (
            <div className="border border-[#14FF00] p-3 bg-[#051a05] space-y-2">
              <div className="text-sm">
                <span className="text-white font-bold">Square {selectedSquare}</span>
                {sectorData[selectedSquare]?.explored
                  ? <span className="opacity-70"> — {sectorData[selectedSquare]?.isSettlement ? `Settlement (${sectorData[selectedSquare]?.faction}, ${sectorData[selectedSquare]?.reputation})` : 'Wasteland'}, {sectorData[selectedSquare]?.icon}</span>
                  : <span className="opacity-70"> — UNEXPLORED</span>}
                {sectorData[selectedSquare]?.truths && sectorData[selectedSquare]!.truths!.length > 0 && (
                  <div className="text-xs opacity-60 normal-case mt-1">{sectorData[selectedSquare]!.truths!.join(' • ')}</div>
                )}
              </div>

              {adjacentSquares.includes(selectedSquare) && (
                <button onClick={handleTravel} className="w-full border-2 border-[#14FF00] p-2 font-bold hover:bg-[#14FF00] hover:text-black">
                  Travel ({supplies >= 1 ? '-1 Supply' : '-2 HP!'})
                </button>
              )}

              {selectedSquare !== VAULT_SQUARE && (
                <div className="flex gap-1">
                  <button
                    onClick={() => generateLocationAt(selectedSquare, 'settlement')}
                    className="flex-1 border border-amber-400/70 text-amber-400 p-1.5 text-xs hover:bg-amber-400 hover:text-black"
                  >
                    {sectorData[selectedSquare]?.explored ? 'Convert to' : 'Generate'} Settlement ⌂
                  </button>
                  <button
                    onClick={() => generateLocationAt(selectedSquare, 'wasteland')}
                    className="flex-1 border border-amber-400/70 text-amber-400 p-1.5 text-xs hover:bg-amber-400 hover:text-black"
                  >
                    {sectorData[selectedSquare]?.explored ? 'Re-roll as' : 'Generate'} Wasteland
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ ENCOUNTER ============ */}
      {stage === 'encounter' && !currentEncounter && (
        <div className="text-center opacity-60 animate-pulse p-8">GENERATING ENCOUNTER…</div>
      )}
      {stage === 'encounter' && currentEncounter && (() => {
        const enc = currentEncounter;
        const autoDanger = dangerChecks[0];
        const danger = dangerOverride ?? autoDanger;
        return (
          <div className="space-y-3">
            <div className={`border-2 p-3 space-y-2 ${enc.type === 'blocker' ? 'border-red-500' : 'border-[#14FF00]'} bg-[#051a05]`}>
              <h3 className={`font-bold ${enc.type === 'blocker' ? 'text-red-500' : 'text-white'}`}>{enc.title}</h3>
              <p className="text-sm normal-case opacity-90 whitespace-pre-line">{enc.description}</p>
              {enc.question && (
                <p className="text-xs normal-case text-amber-400 border-t border-[#14FF00]/30 pt-2">
                  Journal prompt: {enc.question}
                </p>
              )}
            </div>

            {extras.map((e, i) => (
              <div key={i} className="border border-[#14FF00]/60 p-2 text-xs normal-case bg-[#051a05]">{e}</div>
            ))}

            {/* ---- Auto danger verdict (one-tap override) ---- */}
            <div className={`border-2 rounded-sm p-3 flex items-center gap-3 ${danger ? 'border-red-500 bg-[#1a0505]' : 'border-[#14FF00] bg-[#051a05]'}`}>
              {danger ? <AlertTriangle size={22} className="text-red-500 shrink-0" /> : <ShieldCheck size={22} className="text-[#14FF00] shrink-0" />}
              <div className="flex-1">
                <div className={`font-bold ${danger ? 'text-red-500' : 'text-[#14FF00]'}`}>
                  {danger ? 'YOU ARE IN DANGER' : 'LOOKS SAFE'}
                </div>
                <div className="text-[11px] normal-case opacity-70">
                  {danger
                    ? (autoDanger && dangerOverride === null ? 'Threats auto-detected in this scene.' : 'You judged this a threat.')
                    : 'No immediate threat detected.'}
                </div>
              </div>
              <button
                onClick={() => setDangerOverride(!danger)}
                className={`shrink-0 border rounded-sm px-2 py-1 text-[10px] uppercase ${danger ? 'border-[#14FF00] text-[#14FF00] hover:bg-[#14FF00] hover:text-black' : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black'}`}
              >
                {danger ? "It's safe" : 'Dangerous'}
              </button>
            </div>

            {/* ---- Add to scene (GM tools, tucked away) ---- */}
            <div className="border border-[#14FF00]/40 rounded-sm">
              <button onClick={() => setSceneMenuOpen(!sceneMenuOpen)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold hover:bg-[#14FF00]/10">
                <span className="flex items-center gap-2"><PlusCircle size={14} /> Add to scene</span>
                <ChevronRight size={14} className={sceneMenuOpen ? 'rotate-90 transition-transform' : 'transition-transform'} />
              </button>
              {sceneMenuOpen && (
                <div className="grid grid-cols-2 gap-2 p-2 border-t border-[#14FF00]/30">
                  <button onClick={addFoes} className="border border-[#14FF00] rounded-sm p-2 text-xs hover:bg-[#14FF00] hover:text-black">Generate Foes</button>
                  <button onClick={addNpcToScene} className="border border-[#14FF00] rounded-sm p-2 text-xs hover:bg-[#14FF00] hover:text-black">Generate NPC (+1 XP)</button>
                  <button onClick={addDangerousNpc} className="border border-[#14FF00] rounded-sm p-2 text-xs hover:bg-[#14FF00] hover:text-black">Dangerous NPC</button>
                  <button onClick={playTheOdds} disabled={luck < 1} className="border border-amber-400 text-amber-400 rounded-sm p-2 text-xs hover:bg-amber-400 hover:text-black disabled:opacity-30">Play the Odds (1 LP)</button>
                </div>
              )}
            </div>

            {/* ---- What do you do? ---- */}
            {danger ? (
              <div className="space-y-2">
                <button
                  onClick={() => startCombatWithMode('Oppose')}
                  className="w-full border-2 border-red-500 text-red-500 rounded-sm p-3 font-bold hover:bg-red-500 hover:text-black animate-pulse flex items-center justify-center gap-2"
                >
                  <Swords size={18} /> Fight{encounterFoes.length > 0 ? ` — ${encounterFoes.map(f => f.name).join(', ')}` : ''}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => startCombatWithMode('De-escalate')} className="border border-[#14FF00] rounded-sm py-2 flex flex-col items-center gap-1 text-[10px] font-bold hover:bg-[#14FF00] hover:text-black">
                    <MessageCircle size={16} /> Talk Down
                  </button>
                  <button onClick={() => startCombatWithMode('Outwit')} className="border border-[#14FF00] rounded-sm py-2 flex flex-col items-center gap-1 text-[10px] font-bold hover:bg-[#14FF00] hover:text-black">
                    <Brain size={16} /> Outwit
                  </button>
                  <button onClick={() => startCombatWithMode('Retreat')} className="border border-[#14FF00] rounded-sm py-2 flex flex-col items-center gap-1 text-[10px] font-bold hover:bg-[#14FF00] hover:text-black">
                    <Wind size={16} /> Flee
                  </button>
                </div>
                <button onClick={() => proceedToAction(true)} className="w-full border border-[#14FF00]/50 rounded-sm p-2 text-xs hover:bg-[#14FF00] hover:text-black">
                  Other actions (Scavenge, Meet, …) →
                </button>
              </div>
            ) : (
              <button
                onClick={() => proceedToAction(false)}
                className="w-full border-2 border-[#14FF00] rounded-sm p-3 font-bold hover:bg-[#14FF00] hover:text-black"
              >
                Proceed — it's Safe →
              </button>
            )}
          </div>
        );
      })()}

      {/* ============ ACTION ============ */}
      {stage === 'action' && (
        <div className="space-y-3">
          {inDanger && (
            <div className="border-2 border-red-500 text-red-500 p-2 text-center font-bold animate-pulse">
              ⚠ IN DANGER — resolve the threat (De-escalate, Oppose, Outwit, Slaughter, or Retreat)
            </div>
          )}

          {inDanger && !activeAction && (
            <button
              onClick={beginCombat}
              className="w-full border-2 border-red-500 text-red-500 p-2 font-bold hover:bg-red-500 hover:text-black"
            >
              ⚔ Open Combat Tracker{encounterFoes.length > 0 ? ` (${encounterFoes.length} foe${encounterFoes.length > 1 ? 's' : ''} waiting)` : ''}
            </button>
          )}

          {activeAction ? (
            <ActionResolver
              action={activeAction}
              onDone={() => setActiveAction(null)}
              onFoes={(foes) => setEncounterFoes(prev => [...prev, ...foes])}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {availableActions.map(a => {
                  if (a.name === 'Level Up') {
                    return (
                      <button key={a.name} onClick={() => setShowLevelUp(true)}
                        className="border border-amber-400 text-amber-400 p-2 text-sm hover:bg-amber-400 hover:text-black text-left">
                        <div className="font-bold">{a.name}</div>
                        <div className="text-[10px] opacity-70">{xp} XP ready to spend</div>
                      </button>
                    );
                  }
                  const onClick = DANGER_MODE[a.name]
                    ? () => startCombatWithMode(DANGER_MODE[a.name])
                    : () => setActiveAction(a);
                  return (
                    <button key={a.name} onClick={onClick}
                      className="border border-[#14FF00] p-2 text-sm hover:bg-[#14FF00] hover:text-black text-left">
                      <div className="font-bold">{a.name}</div>
                      <div className="text-[10px] opacity-60 normal-case">{a.quote.slice(0, 40)}…</div>
                    </button>
                  );
                })}
              </div>

              {atBlocker && !inDanger && (
                <button onClick={clearBlocker}
                  className="w-full border-2 border-red-500/80 text-red-500 p-2 font-bold hover:bg-red-500 hover:text-black text-left">
                  Clear Main Quest Blocker
                  <span className="block text-[10px] font-normal opacity-70">d20 + Level on the Clear Blocker table</span>
                </button>
              )}

              {sideQuests.some(q => q.status === 'Active') && (
                <div className="border border-amber-400/60 p-2 space-y-1">
                  <div className="text-xs font-bold text-amber-400">ACTIVE SIDE QUESTS:</div>
                  {sideQuests.map((q, i) => q.status === 'Active' && (
                    <div key={i} className="text-xs normal-case border-b border-amber-400/20 pb-1.5 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span>
                          <span className="text-amber-400">[Sq.{q.location}]</span> {q.goal}
                          <span className="opacity-60"> — {q.reward}{q.giver ? ` (for ${q.giver})` : ''}</span>
                        </span>
                        <button
                          onClick={() => completeSideQuest(i)}
                          className="border border-amber-400 text-amber-400 px-2 py-0.5 shrink-0 hover:bg-amber-400 hover:text-black uppercase"
                        >
                          Complete
                        </button>
                      </div>
                      {!q.renegotiated && (
                        <div className="flex items-center gap-1 opacity-80">
                          <span className="opacity-60">Reward not fitting?</span>
                          <button
                            onClick={() => renegotiateReward(i, 'luck')}
                            disabled={luck < 1}
                            className="border border-amber-400/60 text-amber-400 px-1.5 py-0.5 hover:bg-amber-400 hover:text-black disabled:opacity-30 uppercase"
                          >⟳ 1 LP</button>
                          <button
                            onClick={() => renegotiateReward(i, 'barter')}
                            className="border border-amber-400/60 text-amber-400 px-1.5 py-0.5 hover:bg-amber-400 hover:text-black uppercase"
                          >⟳ Barter (diff 2)</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mainQuest?.status !== 'Completed' && atBlocker && (
                <button onClick={completeMainQuest} className="w-full border-2 border-amber-400 text-amber-400 p-2 font-bold hover:bg-amber-400 hover:text-black">
                  Complete Main Quest (+3 XP, write your Epilogue)
                </button>
              )}

              <button
                onClick={() => setStage('journal')}
                disabled={inDanger}
                className="w-full border-2 border-[#14FF00] p-3 font-bold hover:bg-[#14FF00] hover:text-black disabled:opacity-40"
              >
                {inDanger ? 'Resolve the Danger first…' : 'End Actions → Journal'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ============ JOURNAL ============ */}
      {stage === 'journal' && (
        <div className="space-y-3">
          <div className="text-sm font-bold">=== Round {round} — {gameDate(day)} ===</div>
          {currentEncounter?.question && (
            <div className="text-xs normal-case text-amber-400 border border-amber-400/50 p-2">
              Prompt: {currentEncounter.question}
            </div>
          )}
          <textarea
            value={journalDraft}
            onChange={e => setJournalDraft(e.target.value)}
            placeholder="WHAT HAPPENED THIS ROUND? HOW DID IT CHANGE YOU?"
            className="w-full h-40 bg-transparent border border-[#14FF00] p-3 text-white outline-none focus:bg-[#051a05] normal-case placeholder:text-[#14FF00]/30"
            spellCheck="false"
          />
          <button onClick={finishRound} className="w-full border-2 border-[#14FF00] p-3 font-bold hover:bg-[#14FF00] hover:text-black animate-pulse">
            Complete Round {round} → Begin Round {round + 1}
          </button>
        </div>
      )}

      {showLevelUp && <LevelUpModal onClose={() => setShowLevelUp(false)} />}
    </div>
  );
}
