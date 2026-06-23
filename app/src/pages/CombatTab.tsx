import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../store/gameState';
import type { Special } from '../store/gameState';
import { getRandomFoe, getFoeByName, resolveVariant, BESTIARY } from '../data/bestiary';
import { rollCombatStateEntry } from '../data/encounters';
import { rollInjury } from '../data/characterTables';
import { runSkillTest } from '../utils/skillTest';
import { resolveFoeTurn, resolveDefeat, lootFoe } from '../utils/combatEngine';
import type { CombatFoeState, TurnEffect, PlayerDamage } from '../utils/combatEngine';
import { Skull, Swords, PlusCircle, Shield, ShieldAlert } from 'lucide-react';
import { sfx } from '../utils/sound';

type PlayerCombatAction = 'Oppose' | 'Slaughter' | 'Outwit' | 'De-escalate' | 'Retreat';

const WEAPON_SOLUTIONS: { label: string; attr: keyof Special; skill: string }[] = [
  { label: 'Thrown Weapon', attr: 'A', skill: 'Throwing' },
  { label: 'Small Guns', attr: 'A', skill: 'Small Guns' },
  { label: 'Energy Weapons', attr: 'P', skill: 'Energy Weapons' },
  { label: 'Big Guns', attr: 'E', skill: 'Big Guns' },
  { label: 'Melee Weapons', attr: 'S', skill: 'Melee Weapons' },
  { label: 'Unarmed', attr: 'S', skill: 'Unarmed' }
];

const ACTION_SOLUTIONS: Record<Exclude<PlayerCombatAction, 'Oppose' | 'Slaughter'>, { label: string; attr: keyof Special; skill: string }[]> = {
  'Outwit': [
    { label: 'Trick foes (Speech)', attr: 'C', skill: 'Speech' },
    { label: 'Shove/Athletics', attr: 'S', skill: 'Athletics' },
    { label: 'Hack (Science)', attr: 'I', skill: 'Science' },
    { label: 'Trick shot (Small Guns)', attr: 'A', skill: 'Small Guns' }
  ],
  'De-escalate': [
    { label: 'Tame a Creature (Speech)', attr: 'C', skill: 'Speech' },
    { label: 'Talk it down (Athletics)', attr: 'S', skill: 'Athletics' },
    { label: 'Buy your way out (Barter)', attr: 'C', skill: 'Barter' },
    { label: 'Scare them (Speech)', attr: 'S', skill: 'Speech' }
  ],
  'Retreat': [
    { label: 'Sneak away', attr: 'A', skill: 'Sneak' },
    { label: 'Run away', attr: 'S', skill: 'Athletics' }
  ]
};

const ENDURE_SOLUTIONS = [
  { label: 'Roll with the blast (END/Explosives)', attr: 'E' as keyof Special, skill: 'Explosives' },
  { label: 'Roll with the hit (END/Athletics)', attr: 'E' as keyof Special, skill: 'Athletics' },
  { label: 'Avoid gunfire (AGI/Athletics)', attr: 'A' as keyof Special, skill: 'Athletics' },
  { label: 'Parry (AGI/Melee Weapons)', attr: 'A' as keyof Special, skill: 'Melee Weapons' }
];

export default function CombatTab() {
  const {
    combatActive, activeFoes, combatLog, combatState, hp, maxHp, rads, ap, luck, gear, special, skills,
    startCombat, endCombat, addCombatLog, updateFoeThreat, updateHp, updateRads, updateAp, addFoe,
    removeFoe, setFoeBuffs, setCombatState, addGear, appendJournal, addInjury, setDanger, setStage
  } = useGameState();
  const navigate = useNavigate();

  const solutionTn = (s: { attr: keyof Special; skill: string }) =>
    special[s.attr] + (skills.find(k => k.name === s.skill)?.rank ?? 0);
  // Default to the player's best weapon skill.
  const bestWeaponIdx = WEAPON_SOLUTIONS.reduce(
    (best, s, i) => (solutionTn(s) > solutionTn(WEAPON_SOLUTIONS[best]) ? i : best), 0);

  const [selectedAction, setSelectedAction] = useState<PlayerCombatAction>('Oppose');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [solutionIdx, setSolutionIdx] = useState(bestWeaponIdx);
  /** A rolled complication awaiting the player's choice of what goes wrong. */
  const [pendingComplication, setPendingComplication] = useState<string[] | null>(null);
  const [pendingDamage, setPendingDamage] = useState<{ dmg: PlayerDamage; source: string; queue: TurnEffect[]; queueFoeId: string } | null>(null);
  const [endureSolution, setEndureSolution] = useState(0);
  const [foePicker, setFoePicker] = useState(false);
  const turnPointer = useRef(0);

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLog]);

  const equippedArmor = gear.find(g => g.equipped && g.type === 'Armor');
  const isPowerArmor = !!equippedArmor?.name.toLowerCase().includes('power armor');
  const isHeavyArmor = isPowerArmor || !!equippedArmor?.name.match(/Combat Armor|Metal Armor|Scrap Armor/i);

  const stateName = combatState?.split(':')[0] ?? '';
  const deadEnd = stateName.includes('Dead End');
  const radiationState = stateName.includes('Radiation');
  const lowMorale = stateName.includes('Low Morale');

  // ================= DAMAGE & INJURY =================
  const applyDamageToPlayer = (dmg: PlayerDamage, source: string, endured: boolean) => {
    let amount = dmg.amount;
    if (endured) {
      amount = isPowerArmor ? 0 : 1;
      addCombatLog(`ENDURED! ${source}'s hit reduced to ${amount} Damage${isPowerArmor ? ' (Power Armor!)' : ''}.`);
    }
    if (amount <= 0) return;

    const hpBefore = hp;
    if (dmg.type === 'Radiation') {
      updateRads(1);
      sfx.geiger(3);
      addCombatLog(`Radiation sears you (+1 Rad, max HP reduced).`);
    }
    sfx.damage();
    updateHp(-amount);
    addCombatLog(`You take ${amount} ${dmg.type} Damage from ${source}.`);

    const newHp = Math.max(0, hpBefore - amount);
    if (newHp === 0) {
      const overkill = amount - hpBefore;
      const injury = rollInjury(Math.max(0, overkill));
      addInjury(injury.description);
      addCombatLog(`INJURY: ${injury.description}${overkill > 0 ? ` (overkill +${overkill})` : ''}`);
      if (endured) {
        // Endure failure rule (pg.126): injury, then heal half max HP (round up).
        const heal = Math.ceil(Math.max(1, maxHp - rads) / 2);
        updateHp(heal);
        addCombatLog(`You grit through it — back up with ${heal} HP.`);
      }
    } else if (dmg.causesInjury) {
      const injury = rollInjury();
      addInjury(injury.description);
      addCombatLog(`The precise hit leaves an INJURY: ${injury.description}`);
    }
  };

  const promptEndure = (dmg: PlayerDamage, source: string, queue: TurnEffect[], queueFoeId: string) => {
    if (!dmg.canEndure) {
      applyDamageToPlayer(dmg, source, false);
      processEffects(queue, queueFoeId);
      return;
    }
    setPendingDamage({ dmg, source, queue, queueFoeId });
  };

  const resolveEndure = (attempt: boolean) => {
    if (!pendingDamage) return;
    const { dmg, source, queue, queueFoeId } = pendingDamage;
    setPendingDamage(null);
    if (!attempt) {
      applyDamageToPlayer(dmg, source, false);
    } else {
      const sol = ENDURE_SOLUTIONS[endureSolution];
      const outcome = runSkillTest(special, skills, {
        attribute: sol.attr, skillName: sol.skill, difficulty: dmg.amount
      }, special.L);
      addCombatLog(`ENDURE (${sol.skill}, diff ${dmg.amount}): rolled ${outcome.rolls.join(', ')} → ${outcome.passed ? 'SUCCESS' : 'FAILURE'}`);
      if (outcome.excess > 0) updateAp(1);
      if (outcome.complications > 0) {
        const injury = rollInjury();
        addInjury(injury.description);
        addCombatLog(`Complication while enduring — INJURY: ${injury.description}`);
      }
      // Heavy Armor: an endured hit cannot reduce you to 0 HP.
      if (outcome.passed && isHeavyArmor && !isPowerArmor && hp <= 1) {
        addCombatLog('Your Heavy Armor holds — you cannot be dropped by this hit.');
      }
      applyDamageToPlayer(dmg, source, outcome.passed);
    }
    processEffects(queue, queueFoeId);
  };

  // ================= EFFECT PROCESSOR =================
  const processEffects = (effects: TurnEffect[], foeId: string) => {
    const queue = [...effects];
    while (queue.length > 0) {
      const fx = queue.shift()!;
      if (fx.log) addCombatLog(fx.log);

      if (fx.addBuffs?.length || fx.removeBuffs?.length) {
        const foe = useGameState.getState().activeFoes.find(f => f.id === foeId);
        if (foe) {
          let buffs = [...foe.buffs];
          fx.removeBuffs?.forEach(b => {
            const i = buffs.indexOf(b);
            if (i >= 0) buffs.splice(i, 1);
          });
          buffs = [...buffs, ...(fx.addBuffs ?? [])];
          setFoeBuffs(foeId, buffs);
        }
      }
      if (fx.threatDelta) updateFoeThreat(foeId, fx.threatDelta);
      if (fx.spawn?.length) {
        fx.spawn.forEach(name => {
          const template = getFoeByName(name);
          if (template) addFoe(resolveVariant(template));
        });
      }
      if (fx.removeFoeId) removeFoe(fx.removeFoeId);
      if (fx.selfDefeat) removeFoe(foeId);
      if (fx.chain) {
        const allies = useGameState.getState().activeFoes
          .filter(f => f.id !== foeId && f.template.category === fx.chain!.category)
          .slice(0, fx.chain.limit ?? 99);
        allies.forEach(ally => {
          const allyEffects = resolveFoeTurn(ally as CombatFoeState, otherFoes(ally.id), special.L)
            .map(e => ({ ...e, chain: undefined })); // no nested chains
          // process synchronously (no further interrupts queued behind damage)
          processEffects(allyEffects, ally.id);
        });
      }
      if (fx.playerDamage) {
        promptEndure(fx.playerDamage, fx.log.split(']')[1]?.split(':')[0]?.trim() || 'the enemy', queue, foeId);
        return; // remaining queue resumes after Endure resolution
      }
    }
  };

  const otherFoes = (excludeId: string) =>
    useGameState.getState().activeFoes.filter(f => f.id !== excludeId) as CombatFoeState[];

  // ================= FOE TURN =================
  const runFoeTurn = () => {
    const foes = useGameState.getState().activeFoes;
    if (foes.length === 0) return;
    // Threat order: highest first, cycling down (pg.98).
    const ordered = [...foes].sort((a, b) => b.currentThreat - a.currentThreat);
    const actor = ordered[turnPointer.current % ordered.length];
    turnPointer.current += 1;

    addCombatLog(`--- ${actor.template.name}'s Turn ---`);
    const acts = actor.buffs.includes('Jet') ? 2 : 1;
    for (let i = 0; i < acts; i++) {
      const effects = resolveFoeTurn(actor as CombatFoeState, otherFoes(actor.id), special.L);
      processEffects(effects, actor.id);
    }

    if (radiationState) {
      useGameState.getState().activeFoes.forEach(f => {
        const immune = (f.template.specialRules as string[] | undefined)?.some(r => r.includes('Immunity') && r.includes('Radiation'));
        if (!immune) updateFoeThreat(f.id, -1);
      });
      addCombatLog('Ambient radiation gnaws at everything not immune. (Foes -1 Threat)');
    }
  };

  // ================= PLAYER ACTIONS =================
  const afterPlayerAction = () => {
    if (radiationState) {
      updateRads(1);
      addCombatLog('The radiation state burns you. (+1 Rad)');
    }
    const remaining = useGameState.getState().activeFoes;
    if (remaining.length > 0) {
      runFoeTurn();
    } else {
      victory();
    }
  };

  // Combat over → return to the Round loop automatically.
  const exitCombat = (toStage: 'action' | 'journal' = 'action') => {
    endCombat();
    setDanger(false);
    setStage(toStage);
    navigate('/round');
  };

  const victory = () => {
    sfx.levelUp();
    addCombatLog('All foes defeated! The dust settles.');
    appendJournal('Combat won — every foe defeated or driven off.');
    setTimeout(() => exitCombat('action'), 1200);
  };

  const defeatFoe = (foe: CombatFoeState, byRanged: boolean) => {
    const { defeated, redirectedTo, effects } = resolveDefeat(foe, otherFoes(foe.id), special.L, byRanged);
    processEffects(effects, foe.id);
    if (redirectedTo) {
      removeFoe(redirectedTo.id);
      return;
    }
    if (!defeated) {
      // Extremely Tough: mark and let it act.
      setFoeBuffs(foe.id, [...foe.buffs, 'Tough Used']);
      const fx = resolveFoeTurn(foe, otherFoes(foe.id), special.L);
      processEffects(fx, foe.id);
      return;
    }
    sfx.defeat();
    const loot = lootFoe(foe.template);
    loot.items.forEach(addGear);
    addCombatLog(loot.log);
    removeFoe(foe.id);

    if (lowMorale) {
      addCombatLog('LOW MORALE: the remaining foes break and flee!');
      useGameState.getState().activeFoes.forEach(f => removeFoe(f.id));
    }
  };

  const performAction = () => {
    const foes = useGameState.getState().activeFoes as CombatFoeState[];
    if (foes.length === 0) return;
    const target = foes.find(f => f.id === targetId) ?? foes[0];

    let difficulty = 0;
    let sol: { label: string; attr: keyof Special; skill: string };
    const isRangedSolution = (s: { skill: string }) =>
      ['Small Guns', 'Energy Weapons', 'Big Guns', 'Throwing'].includes(s.skill);

    if (selectedAction === 'Oppose') {
      sol = WEAPON_SOLUTIONS[solutionIdx];
      difficulty = target.currentThreat;
      if (target.buffs.includes('In Cover') && isRangedSolution(sol)) {
        addCombatLog(`${target.template.name} is in cover — it cannot be Opposed by Ranged Weapons this turn!`);
        return;
      }
      if (target.buffs.includes('Burrowed') && sol.skill !== 'Explosives') {
        difficulty += 2;
        addCombatLog('Target is burrowed: +2 Difficulty (explosives ignore this).');
      }
      if (target.buffs.includes('Invisible')) {
        difficulty += 2;
        addCombatLog('Target is cloaked: +2 Difficulty.');
      }
      if (target.buffs.includes('Airborne') && ['Melee Weapons', 'Unarmed'].includes(sol.skill)) {
        addCombatLog(`${target.template.name} is out of melee reach this turn!`);
        return;
      }
    } else if (selectedAction === 'Slaughter') {
      sol = WEAPON_SOLUTIONS[solutionIdx];
      difficulty = Math.max(...foes.map(f => f.currentThreat)) + foes.length;
    } else {
      const sols = ACTION_SOLUTIONS[selectedAction];
      sol = sols[Math.min(solutionIdx, sols.length - 1)];
      if (selectedAction === 'Retreat') {
        if (deadEnd) {
          addCombatLog('DEAD END — Retreat is impossible!');
          return;
        }
        difficulty = foes.length;
      } else {
        difficulty = 2;
      }
      if (selectedAction === 'De-escalate') {
        const feral = foes.some(f => (f.template.specialRules as string[] | undefined)?.some(r => r.startsWith('Feral') || r.startsWith('Immoveable Orders')));
        if (feral) {
          addCombatLog('These foes cannot be De-escalated (Feral / Immoveable Orders)!');
          return;
        }
      }
      if (stateName.includes('Moment of Silence') && (selectedAction === 'De-escalate' || selectedAction === 'Retreat')) {
        difficulty = Math.max(0, difficulty - 1);
      }
    }

    const outcome = runSkillTest(special, skills, { attribute: sol.attr, skillName: sol.skill, difficulty }, special.L);
    addCombatLog(`${selectedAction} (${sol.skill}, diff ${difficulty}): rolled ${outcome.rolls.join(', ')} → ${outcome.passed ? 'SUCCESS' : 'FAILURE'} (${outcome.successes}/${difficulty})`);
    if (outcome.excess > 0) {
      updateAp(1);
      addCombatLog('+1 AP (extra successes).');
    }

    // Complications: under Traps the book overrides any choice (2 Damage);
    // otherwise YOU pick what goes wrong after the action resolves.
    let complicationOptions: string[] | null = null;
    if (outcome.complications > 0) {
      if (stateName.includes('Traps')) {
        addCombatLog('COMPLICATION + Traps: you stumble into one! (2 Damage)');
        applyDamageToPlayer({ amount: 2, type: 'Physical', canEndure: false }, 'a trap', false);
      } else {
        const usingRanged = isRangedSolution(sol);
        switch (selectedAction) {
          case 'Oppose':
            complicationOptions = [
              'A Foe gets a free Turn',
              ...(usingRanged ? ['Your weapon runs out of ammunition'] : []),
              'Your weapon breaks or gains a negative Truth',
              'The Combat State changes'
            ];
            break;
          case 'Slaughter':
            complicationOptions = [
              'Your weapon gains the Broken Condition',
              ...(usingRanged ? ['You run out of ammunition'] : ['A Foe gets a free Turn'])
            ];
            break;
          case 'Outwit':
            complicationOptions = ['You suffer 1 Damage in the attempt', 'The Combat State changes'];
            break;
          case 'De-escalate':
            complicationOptions = ['The Combat State changes', 'They mock you — stories of cowardice may spread if you Retreat'];
            break;
          case 'Retreat':
            complicationOptions = ['One Foe follows you into the next Location'];
            break;
        }
      }
    }

    // Resolve outcome by action
    if (selectedAction === 'Oppose') {
      if (outcome.passed) {
        addCombatLog(`${target.template.name} is DEFEATED!`);
        defeatFoe(target, isRangedSolution(sol));
      } else {
        updateFoeThreat(target.id, target.currentThreat > 1 ? -1 : 0);
        addCombatLog(`You wound ${target.template.name} (Threat -1, min 1).`);
      }
    } else if (selectedAction === 'Slaughter') {
      if (outcome.passed) {
        addCombatLog('SLAUGHTER! Every foe falls!');
        [...foes].forEach(f => defeatFoe(f, isRangedSolution(sol)));
      } else {
        const shortfall = difficulty - outcome.successes;
        addCombatLog(`The melee turns against you — suffer ${shortfall} Damage (the shortfall).`);
        applyDamageToPlayer({ amount: shortfall, type: 'Physical', canEndure: true }, 'the horde', false);
      }
    } else if (selectedAction === 'De-escalate') {
      if (outcome.passed) {
        addCombatLog('You talk them down. The encounter is Safe — foes are unfriendly, but not hostile.');
        appendJournal('De-escalated a fight without bloodshed.');
        exitCombat('action');
        return;
      }
      addCombatLog('They are NOT in the mood to talk — two foes act!');
      runFoeTurn();
    } else if (selectedAction === 'Outwit') {
      if (outcome.passed) {
        addCombatLog(`Your plan works! Choose: defeat ${target.template.name}, or -1 Difficulty on your next test.`);
        defeatFoe(target, false);
      }
    } else if (selectedAction === 'Retreat') {
      if (outcome.passed) {
        addCombatLog('You slip away! Journal the round, then travel on.');
        appendJournal('Retreated from combat, living to fight another day.');
        exitCombat('journal');
        return;
      }
      addCombatLog('Caught! ALL foes act before you break free…');
      foes.forEach(() => runFoeTurn());
      addCombatLog('Battered but alive, you finally escape.');
      appendJournal('Retreated from combat — barely.');
      exitCombat('journal');
      return;
    }

    // If a complication was rolled, the player chooses what goes wrong before
    // the foes respond.
    if (complicationOptions && complicationOptions.length > 0) {
      setPendingComplication(complicationOptions);
      return;
    }
    afterPlayerAction();
  };

  /** Applies the chosen complication, then lets the foes act. */
  const applyComplication = (option: string) => {
    setPendingComplication(null);
    addCombatLog(`COMPLICATION — ${option}`);

    if (option.includes('free Turn')) {
      runFoeTurn();
    } else if (option.toLowerCase().includes('ammunition')) {
      const ammoBox = gear.find(g => g.type === 'Ammo');
      if (ammoBox) {
        useGameState.getState().removeGear(ammoBox.id);
        addCombatLog('You crack open an Ammo Box and keep firing!');
      } else {
        const weapon = gear.find(g => g.equipped && g.type === 'Weapon');
        if (weapon) {
          useGameState.setState(s => ({
            gear: s.gear.map(g => g.id === weapon.id ? { ...g, condition: 'Out of Ammo' } : g)
          }));
          addCombatLog(`${weapon.name} is OUT OF AMMO — clear it with an Ammo Box or Mod & Repair.`);
        } else {
          addCombatLog('Your weapon clicks empty.');
        }
      }
    } else if (option.includes('breaks') || option.includes('Broken')) {
      const weapon = gear.find(g => g.equipped && g.type === 'Weapon');
      if (weapon) {
        useGameState.setState(s => ({
          gear: s.gear.map(g => g.id === weapon.id ? { ...g, condition: 'Broken' } : g)
        }));
        addCombatLog(`${weapon.name} is BROKEN — Mod & Repair can fix it.`);
      } else {
        addCombatLog('Your improvised weapon falls apart.');
      }
    } else if (option.includes('Combat State')) {
      const st = rollCombatStateEntry();
      setCombatState(`${st.name}: ${st.description}`);
      addCombatLog(`The battlefield shifts — new Combat State: ${st.name}.`);
    } else if (option.includes('suffer 1 Damage')) {
      applyDamageToPlayer({ amount: 1, type: 'Physical', canEndure: false }, 'your own gambit', false);
    }
    // High Morale (pg.166): after any Complication, a foe also acts.
    if (stateName.includes('High Morale')) {
      addCombatLog('HIGH MORALE: a foe seizes the moment!');
      runFoeTurn();
    }
    afterPlayerAction();
  };

  // ================= COMBAT SETUP =================
  const handleStartRandomEncounter = () => {
    const numFoes = Math.floor(Math.random() * 3) + 1;
    const foes = Array.from({ length: numFoes }).map(() => getRandomFoe());
    startCombat(foes);
    const state = rollCombatStateEntry();
    setCombatState(`${state.name}: ${state.description}`);
    turnPointer.current = 0;
    setDanger(true);
  };

  const solutions = selectedAction === 'Oppose' || selectedAction === 'Slaughter'
    ? WEAPON_SOLUTIONS
    : ACTION_SOLUTIONS[selectedAction];

  // ================= RENDER =================
  if (!combatActive) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full space-y-6">
        <h2 className="text-2xl uppercase font-bold text-center border-b border-[#14FF00] pb-2">Wasteland Encounters</h2>
        <p className="text-center opacity-80">The Wasteland is quiet... for now.</p>
        <button
          onClick={handleStartRandomEncounter}
          className="border-2 border-[#14FF00] p-4 uppercase hover:bg-[#14FF00] hover:text-black transition-colors font-bold text-lg flex items-center gap-2"
        >
          <Skull /> Trigger Random Encounter
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full uppercase">
      <div className="flex justify-between items-center border-b-2 border-[#14FF00] pb-2 mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2 animate-pulse text-red-500">
          <Swords /> COMBAT
        </h2>
        <div className="text-sm">HP <span className={hp <= 3 ? 'text-red-500 font-bold' : 'text-white'}>{hp}</span> • AP {ap} • LP {luck}</div>
      </div>

      {combatState && (
        <div className="border border-amber-400/60 text-amber-400 p-2 mb-2 text-xs normal-case">
          <span className="font-bold uppercase">Combat State — </span>{combatState}
        </div>
      )}

      {/* Foes */}
      <div className="space-y-1 mb-3 max-h-48 overflow-y-auto custom-scrollbar">
        {activeFoes.map(foe => (
          <button
            key={foe.id}
            onClick={() => setTargetId(foe.id)}
            className={`w-full border p-2 flex justify-between items-center text-left ${targetId === foe.id ? 'border-red-500 bg-red-500/10' : 'border-[#14FF00]/60'}`}
          >
            <div>
              <span className="font-bold text-white text-sm">{foe.template.name}</span>
              <span className="text-xs ml-2 opacity-70">Threat {foe.currentThreat}</span>
              {foe.buffs.length > 0 && (
                <div className="text-[10px] text-amber-400">{foe.buffs.join(' • ')}</div>
              )}
            </div>
            {targetId === foe.id && <span className="text-red-500 text-xs font-bold">TARGET</span>}
          </button>
        ))}
        <div className="flex gap-1">
          <button onClick={() => addFoe(getRandomFoe())} className="flex-1 text-xs border border-[#14FF00]/50 px-2 py-1 flex items-center justify-center gap-1 hover:bg-[#14FF00] hover:text-black">
            <PlusCircle size={12} /> Random Foe
          </button>
          <button onClick={() => setFoePicker(!foePicker)} className="flex-1 text-xs border border-[#14FF00]/50 px-2 py-1 hover:bg-[#14FF00] hover:text-black">
            Pick Foe…
          </button>
        </div>
        {foePicker && (
          <div className="border border-[#14FF00] max-h-36 overflow-y-auto custom-scrollbar">
            {BESTIARY.map(f => (
              <button key={f.name} onClick={() => { addFoe(resolveVariant(f)); setFoePicker(false); }}
                className="block w-full text-left text-xs p-1.5 border-b border-[#14FF00]/20 hover:bg-[#14FF00]/10">
                {f.name} <span className="opacity-60">(T{f.threat}, {f.category})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Endure interrupt */}
      {pendingDamage ? (
        <div className="border-2 border-red-500 p-3 space-y-2 bg-[#1a0505]">
          <div className="font-bold text-red-500 flex items-center gap-2">
            <ShieldAlert size={18} /> INCOMING: {pendingDamage.dmg.amount} {pendingDamage.dmg.type} Damage!
          </div>
          <div className="text-xs normal-case opacity-80">Endure Reaction (difficulty {pendingDamage.dmg.amount}): success = 1 Damage{isPowerArmor ? ' (0 in Power Armor)' : ''}.</div>
          {ENDURE_SOLUTIONS.map((s, i) => (
            <button key={i} onClick={() => setEndureSolution(i)}
              className={`block w-full text-left text-xs border p-1.5 ${endureSolution === i ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00]/40'}`}>
              {s.label}
            </button>
          ))}
          <div className="flex gap-2">
            <button onClick={() => resolveEndure(false)} className="flex-1 border border-red-500 text-red-500 p-2 text-sm hover:bg-red-500 hover:text-black">
              Take it ({pendingDamage.dmg.amount} dmg)
            </button>
            <button onClick={() => resolveEndure(true)} className="flex-1 border-2 border-[#14FF00] p-2 text-sm font-bold hover:bg-[#14FF00] hover:text-black animate-pulse">
              ENDURE!
            </button>
          </div>
        </div>
      ) : pendingComplication ? (
        <div className="border-2 border-red-500 p-3 space-y-2 bg-[#1a0505]">
          <div className="font-bold text-red-500">⚠ COMPLICATION! Choose what goes wrong:</div>
          {pendingComplication.map(option => (
            <button
              key={option}
              onClick={() => applyComplication(option)}
              className="block w-full text-left text-sm border border-red-500/50 p-2 hover:bg-red-500 hover:text-black normal-case"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Player action picker */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {(['Oppose', 'Slaughter', 'Outwit', 'De-escalate', 'Retreat'] as PlayerCombatAction[]).map(a => (
              <button key={a} onClick={() => { setSelectedAction(a); setSolutionIdx(a === 'Oppose' || a === 'Slaughter' ? bestWeaponIdx : 0); }}
                className={`border p-1.5 text-[10px] font-bold ${selectedAction === a ? 'bg-[#14FF00] text-black border-[#14FF00]' : 'border-[#14FF00]/50 hover:border-[#14FF00]'} ${a === 'Retreat' && deadEnd ? 'opacity-30' : ''}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {solutions.map((s, i) => (
              <button key={i} onClick={() => setSolutionIdx(i)}
                className={`border px-2 py-1 text-[10px] ${solutionIdx === i ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00]/40'}`}>
                {s.label} · TN {solutionTn(s)}
              </button>
            ))}
          </div>
          {activeFoes.length > 0 ? (
            <button onClick={performAction}
              className="w-full border-2 border-[#14FF00] p-2 font-bold hover:bg-[#14FF00] hover:text-black mb-2">
              {selectedAction}{selectedAction === 'Oppose' ? ` → ${(activeFoes.find(f => f.id === targetId) ?? activeFoes[0]).template.name}` : ''} (then foe acts)
            </button>
          ) : (
            <button onClick={() => exitCombat('action')}
              className="w-full border-2 border-[#14FF00] p-2 font-bold hover:bg-[#14FF00] hover:text-black mb-2">
              Victory — Back to the Round
            </button>
          )}
        </>
      )}

      {/* Log */}
      <div className="mt-2 flex-1 border border-[#14FF00] bg-[#051a05] flex flex-col overflow-hidden min-h-32">
        <div className="p-1.5 border-b border-[#14FF00]/50 font-bold opacity-80 text-xs bg-[#14FF00]/10 flex justify-between">
          <span>COMBAT LOG</span>
          <button onClick={() => exitCombat('action')} className="hover:text-white flex items-center gap-1">
            <Shield size={12} /> END COMBAT
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto text-xs space-y-1 custom-scrollbar normal-case">
          {combatLog.map((log, idx) => (
            <div key={idx} className={`${log.includes('Damage') || log.includes('INJURY') ? 'text-red-400' : log.includes('DEFEATED') || log.includes('SUCCESS') ? 'text-[#14FF00]' : 'text-[#14FF00]/80'}`}>
              &gt; {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
