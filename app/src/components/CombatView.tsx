import { useRef, useEffect, useState } from 'react';
import { useGameState } from '../store/gameState';
import type { Special } from '../store/gameState';
import { getFoeByName, resolveVariant } from '../data/bestiary';
import type { FoeTemplate } from '../data/bestiary';
import { rollCombatStateEntry } from '../data/encounters';
import { rollInjury } from '../data/characterTables';
import { runSkillTest, rerollWorstDie } from '../utils/skillTest';
import type { TestOutcome } from '../utils/skillTest';
import { resolveFoeTurn, resolveDefeat, lootFoe } from '../utils/combatEngine';
import type { CombatFoeState, TurnEffect, PlayerDamage } from '../utils/combatEngine';
import {
  Swords, ShieldAlert, Shield, Heart, Zap, Sparkles, Crosshair, MessageCircle,
  Brain, Wind, Flame, ChevronDown, RotateCcw, Trophy, Dices
} from 'lucide-react';
import { sfx } from '../utils/sound';

export type PlayerCombatAction = 'Oppose' | 'Slaughter' | 'Outwit' | 'De-escalate' | 'Retreat';

/** Display metadata for each combat action mode (the "equal billing" row). */
const ACTION_META: Record<PlayerCombatAction, { label: string; icon: typeof Swords; hint: string }> = {
  Oppose: { label: 'Attack', icon: Crosshair, hint: 'Tap a foe to strike it.' },
  Slaughter: { label: 'Slaughter', icon: Flame, hint: 'Try to fell every foe at once — high risk.' },
  Outwit: { label: 'Outwit', icon: Brain, hint: 'Beat one foe with a clever trick.' },
  'De-escalate': { label: 'Talk Down', icon: MessageCircle, hint: 'End the fight without bloodshed.' },
  Retreat: { label: 'Flee', icon: Wind, hint: 'Break away and live to fight another day.' }
};

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

type CombatSolution = { label: string; attr: keyof Special; skill: string };
type PhaseKind = 'choose' | 'reveal' | 'enemyTurn';
type EndKind = 'victory' | 'talk' | 'flee';

interface PendingRoll {
  outcome: TestOutcome;
  action: PlayerCombatAction;
  targetId: string | null;
  sol: CombatSolution;
  difficulty: number;
  rerolled: boolean;
}

interface CombatViewProps {
  /** Called when the fight is fully resolved and the player taps Continue. */
  onExit: (toStage: 'action' | 'journal') => void;
  /** Which action mode to preselect (e.g. entering via Talk Down / Flee). */
  initialAction?: PlayerCombatAction;
}

export default function CombatView({ onExit, initialAction = 'Oppose' }: CombatViewProps) {
  const {
    activeFoes, combatLog, combatState, hp, maxHp, rads, ap, luck, gear, special, skills,
    endCombat, addCombatLog, updateFoeThreat, updateHp, updateRads, updateAp, updateLuck,
    addFoe, removeFoe, setFoeBuffs, setCombatState, addGear, appendJournal, addInjury,
    setDanger
  } = useGameState();

  const solutionTn = (s: CombatSolution) =>
    special[s.attr] + (skills.find(k => k.name === s.skill)?.rank ?? 0);
  const bestWeaponIdx = WEAPON_SOLUTIONS.reduce(
    (best, s, i) => (solutionTn(s) > solutionTn(WEAPON_SOLUTIONS[best]) ? i : best), 0);

  const [selectedAction, setSelectedAction] = useState<PlayerCombatAction>(initialAction);
  const [weaponIdx, setWeaponIdx] = useState(bestWeaponIdx);
  const [solutionIdx, setSolutionIdx] = useState(0);
  const [weaponPicker, setWeaponPicker] = useState(false);
  const [phase, setPhase] = useState<PhaseKind>('choose');
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [pendingComplication, setPendingComplication] = useState<string[] | null>(null);
  const [pendingDamage, setPendingDamage] = useState<{ dmg: PlayerDamage; source: string; queue: TurnEffect[]; queueFoeId: string } | null>(null);
  const [endureSolution, setEndureSolution] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [flashFoeId, setFlashFoeId] = useState<string | null>(null);
  const [playerHurt, setPlayerHurt] = useState(false);
  // Pre-roll boost: Try Your Luck (AP re-roll is offered after the roll).
  const [tryLuck, setTryLuck] = useState(false);
  // End-of-fight summary.
  const [endState, setEndState] = useState<{ kind: EndKind; toStage: 'action' | 'journal' } | null>(null);
  const spoils = useRef<string[]>([]);
  const startInjuries = useRef(useGameState.getState().injuries.length);
  const startHp = useRef(hp);
  // Foes defeated this fight — looted once at the end (pg.99: loot once you are
  // no longer In Danger), not at the moment of each defeat.
  const defeatedFoes = useRef<FoeTemplate[]>([]);
  // Oppose Additional-Success spends (pg.138), offered after a winning Oppose.
  const [pendingAdditional, setPendingAdditional] = useState<{ targetThreat: number; explosive: boolean } | null>(null);
  const [addClaimed, setAddClaimed] = useState<string[]>([]);
  const [choosingNext, setChoosingNext] = useState(false);
  /** Foe forced to act next by the "choose which Foe acts next" Additional Success. */
  const forcedNextActor = useRef<string | null>(null);

  const turnPointer = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logOpen) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLog, logOpen]);

  // Reveal the pass/fail verdict a beat after the dice appear.
  useEffect(() => {
    if (phase === 'reveal') {
      setShowVerdict(false);
      const t = setTimeout(() => setShowVerdict(true), 550);
      return () => clearTimeout(t);
    }
  }, [phase, pendingRoll]);

  const equippedWeapon = gear.find(g => g.equipped && g.type === 'Weapon');
  const equippedArmor = gear.find(g => g.equipped && g.type === 'Armor');
  const isPowerArmor = !!equippedArmor?.name.toLowerCase().includes('power armor');
  const isHeavyArmor = isPowerArmor || !!equippedArmor?.name.match(/Combat Armor|Metal Armor|Scrap Armor/i);

  const stateName = combatState?.split(':')[0] ?? '';
  const deadEnd = stateName.includes('Dead End');
  const radiationState = stateName.includes('Radiation');
  const lowMorale = stateName.includes('Low Morale');

  const flashHit = (foeId: string) => {
    setFlashFoeId(foeId);
    setTimeout(() => setFlashFoeId(null), 350);
  };

  // ================= DAMAGE & INJURY =================
  const applyDamageToPlayer = (dmg: PlayerDamage, source: string, endured: boolean) => {
    let amount = dmg.amount;
    if (endured) {
      amount = isPowerArmor ? 0 : 1;
      addCombatLog(`ENDURED! ${source}'s hit reduced to ${amount} Damage${isPowerArmor ? ' (Power Armor!)' : ''}.`);
    }
    if (amount <= 0) return;

    const hpBefore = hp;
    // Endure + Heavy (non-Power) Armor: the hit cannot drop you to 0 HP (pg.126).
    if (endured && isHeavyArmor && !isPowerArmor) {
      const survivable = Math.max(0, hpBefore - 1);
      if (amount > survivable) {
        amount = survivable;
        addCombatLog('Your Heavy Armor holds — the blow cannot drop you below 1 HP.');
      }
      if (amount <= 0) return;
    }
    if (dmg.type === 'Radiation') {
      updateRads(1);
      sfx.geiger(3);
      addCombatLog(`Radiation sears you (+1 Rad, max HP reduced).`);
    }
    sfx.damage();
    setPlayerHurt(true);
    setTimeout(() => setPlayerHurt(false), 400);
    updateHp(-amount);
    addCombatLog(`You take ${amount} ${dmg.type} Damage from ${source}.`);

    const newHp = Math.max(0, hpBefore - amount);
    if (newHp === 0) {
      const overkill = amount - hpBefore;
      const injury = rollInjury(Math.max(0, overkill));
      addInjury(injury.description);
      addCombatLog(`INJURY: ${injury.description}${overkill > 0 ? ` (overkill +${overkill})` : ''}`);
      if (endured) {
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
            .map(e => ({ ...e, chain: undefined }));
          processEffects(allyEffects, ally.id);
        });
      }
      if (fx.playerDamage) {
        promptEndure(fx.playerDamage, fx.log.split(']')[1]?.split(':')[0]?.trim() || 'the enemy', queue, foeId);
        return;
      }
    }
  };

  const otherFoes = (excludeId: string) =>
    useGameState.getState().activeFoes.filter(f => f.id !== excludeId) as CombatFoeState[];

  // ================= FOE TURN =================
  const runFoeTurn = () => {
    const foes = useGameState.getState().activeFoes;
    if (foes.length === 0) return;
    // Threat order, highest first; ties broken randomly (pg.98) via each foe's
    // random id, which gives a stable random order for the fight.
    let actor = foes.find(f => f.id === forcedNextActor.current);
    if (actor) {
      forcedNextActor.current = null;
    } else {
      const ordered = [...foes].sort((a, b) => b.currentThreat - a.currentThreat || a.id.localeCompare(b.id));
      actor = ordered[turnPointer.current % ordered.length];
      turnPointer.current += 1;
    }

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

  /** After the player's move resolves: radiation tick, then either win or a
   *  short "enemy turn" beat before one foe acts. */
  const concludePlayerTurn = (foeActions = 1) => {
    if (radiationState) {
      updateRads(1);
      addCombatLog('The radiation state burns you. (+1 Rad)');
    }
    if (useGameState.getState().activeFoes.length === 0) {
      showVictory();
      return;
    }
    setPhase('enemyTurn');
    setTimeout(() => {
      for (let i = 0; i < foeActions && useGameState.getState().activeFoes.length > 0; i++) {
        runFoeTurn();
      }
      if (useGameState.getState().activeFoes.length === 0) {
        showVictory();
      } else {
        setPhase('choose');
      }
    }, 950);
  };

  // ================= END OF FIGHT =================
  /** Loot every foe defeated this fight, once, now that you are no longer In
   *  Danger (pg.99), then show the summary. */
  const finishCombat = (kind: EndKind, toStage: 'action' | 'journal') => {
    defeatedFoes.current.forEach(t => {
      const loot = lootFoe(t);
      loot.items.forEach(item => {
        addGear(item);
        spoils.current.push(`${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.name}`);
      });
      addCombatLog(loot.log);
    });
    defeatedFoes.current = [];
    setEndState({ kind, toStage });
  };

  const showVictory = () => {
    sfx.levelUp();
    addCombatLog('All foes defeated! The dust settles.');
    appendJournal('Combat won — every foe defeated or driven off.');
    setPhase('choose');
    finishCombat('victory', 'action');
  };

  const finishExit = () => {
    if (!endState) return;
    endCombat();
    setDanger(false);
    onExit(endState.toStage);
  };

  // ================= DEFEAT A FOE =================
  const defeatFoe = (foe: CombatFoeState, byRanged: boolean) => {
    const { defeated, redirectedTo, effects } = resolveDefeat(foe, otherFoes(foe.id), special.L, byRanged);
    processEffects(effects, foe.id);
    if (redirectedTo) {
      removeFoe(redirectedTo.id);
      return;
    }
    if (!defeated) {
      setFoeBuffs(foe.id, [...foe.buffs, 'Tough Used']);
      const fx = resolveFoeTurn(foe, otherFoes(foe.id), special.L);
      processEffects(fx, foe.id);
      return;
    }
    sfx.defeat();
    defeatedFoes.current.push(foe.template);
    addCombatLog(`${foe.template.name} is defeated.`);
    removeFoe(foe.id);

    if (lowMorale) {
      addCombatLog('LOW MORALE: the remaining foes break and flee!');
      useGameState.getState().activeFoes.forEach(f => removeFoe(f.id));
    }
  };

  // ================= COMMIT AN ACTION =================
  const isRangedSolution = (s: { skill: string }) =>
    ['Small Guns', 'Energy Weapons', 'Big Guns', 'Throwing'].includes(s.skill);

  /** Validates + rolls, then shows the dice reveal. Returns silently (with a
   *  log line) if the action is illegal this turn. */
  const beginAction = (action: PlayerCombatAction, explicitTargetId?: string) => {
    if (phase !== 'choose' || endState) return;
    const foes = useGameState.getState().activeFoes as CombatFoeState[];
    if (foes.length === 0) return;
    const targetId = explicitTargetId ?? foes[0].id;
    const target = foes.find(f => f.id === targetId) ?? foes[0];

    let difficulty = 0;
    const sol = action === 'Oppose' || action === 'Slaughter'
      ? WEAPON_SOLUTIONS[weaponIdx]
      : ACTION_SOLUTIONS[action][Math.min(solutionIdx, ACTION_SOLUTIONS[action].length - 1)];

    if (action === 'Oppose') {
      difficulty = target.currentThreat;
      if (target.buffs.includes('In Cover') && isRangedSolution(sol)) {
        // Oppose modifier (pg.98): a target in cover is +1 Difficulty.
        difficulty += 1;
        addCombatLog(`${target.template.name} is in cover: +1 Difficulty to your ranged attack.`);
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
    } else if (action === 'Slaughter') {
      difficulty = Math.max(...foes.map(f => f.currentThreat)) + foes.length;
    } else if (action === 'Retreat') {
      if (deadEnd) {
        addCombatLog('DEAD END — Retreat is impossible!');
        return;
      }
      difficulty = foes.length;
    } else {
      difficulty = 2;
      if (action === 'De-escalate') {
        const feral = foes.some(f => (f.template.specialRules as string[] | undefined)?.some(r => r.startsWith('Feral') || r.startsWith('Immoveable Orders')));
        if (feral) {
          addCombatLog('These foes cannot be De-escalated (Feral / Immoveable Orders)!');
          return;
        }
      }
    }
    if (stateName.includes('Moment of Silence') && (action === 'De-escalate' || action === 'Retreat')) {
      difficulty = Math.max(0, difficulty - 1);
    }

    // Try Your Luck (1 LP) is the only pre-roll spend; AP re-roll comes after.
    let usingLuck = false;
    if (tryLuck && luck >= 1) {
      usingLuck = true;
      updateLuck(-1);
    }

    sfx.diceRoll();
    const outcome = runSkillTest(
      special, skills,
      { attribute: sol.attr, skillName: sol.skill, difficulty, tryLuck: usingLuck },
      special.L
    );
    setTryLuck(false);
    setPendingRoll({ outcome, action, targetId, sol, difficulty, rerolled: false });
    setPhase('reveal');
  };

  const rerollAttack = () => {
    if (!pendingRoll || pendingRoll.rerolled || ap < 1) return;
    updateAp(-1);
    const next = rerollWorstDie(pendingRoll.outcome, pendingRoll.difficulty);
    addCombatLog(`Re-rolled worst die (1 AP): ${next.rolls.join(', ')} → ${next.passed ? 'PASSED' : 'FAILED'}`);
    setPendingRoll({ ...pendingRoll, outcome: next, rerolled: true });
  };

  /** Applies the revealed roll's consequences, then hands off to foes. */
  const applyRoll = () => {
    if (!pendingRoll) return;
    const { outcome, action, targetId, sol, difficulty } = pendingRoll;
    const foes = useGameState.getState().activeFoes as CombatFoeState[];
    const target = foes.find(f => f.id === targetId) ?? foes[0];
    setPendingRoll(null);

    addCombatLog(`${ACTION_META[action].label} (${sol.skill}, diff ${difficulty}): rolled ${outcome.rolls.join(', ')} → ${outcome.passed ? 'SUCCESS' : 'FAILURE'} (${outcome.successes}/${difficulty})`);
    if (outcome.passed) sfx.success(); else sfx.failure();
    if (outcome.excess > 0) {
      updateAp(1);
      addCombatLog('+1 AP (extra successes).');
    }

    // Complication options (YOU choose what goes wrong), unless Traps overrides.
    let complicationOptions: string[] | null = null;
    if (outcome.complications > 0) {
      if (stateName.includes('Traps')) {
        addCombatLog('COMPLICATION + Traps: you stumble into one! (2 Damage)');
        applyDamageToPlayer({ amount: 2, type: 'Physical', canEndure: false }, 'a trap', false);
      } else {
        const usingRanged = isRangedSolution(sol);
        switch (action) {
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

    // Resolve by action.
    if (action === 'Oppose') {
      if (outcome.passed) {
        addCombatLog(`${target.template.name} is DEFEATED!`);
        flashHit(target.id);
        defeatFoe(target, isRangedSolution(sol));
      } else {
        flashHit(target.id);
        updateFoeThreat(target.id, target.currentThreat > 1 ? -1 : 0);
        addCombatLog(`You wound ${target.template.name} (Threat -1, min 1).`);
      }
    } else if (action === 'Slaughter') {
      if (outcome.passed) {
        addCombatLog('SLAUGHTER! Every foe falls!');
        [...foes].forEach(f => defeatFoe(f, isRangedSolution(sol)));
      } else {
        const shortfall = difficulty - outcome.successes;
        addCombatLog(`The melee turns against you — suffer ${shortfall} Damage (the shortfall).`);
        applyDamageToPlayer({ amount: shortfall, type: 'Physical', canEndure: true }, 'the horde', false);
      }
    } else if (action === 'De-escalate') {
      if (outcome.passed) {
        addCombatLog('You talk them down. The encounter is Safe — foes are unfriendly, but not hostile.');
        appendJournal('De-escalated a fight without bloodshed.');
        finishCombat('talk', 'action');
        return;
      }
      addCombatLog('They are NOT in the mood to talk — TWO foes act!');
      if (complicationOptions) { setPendingComplication(complicationOptions); return; }
      concludePlayerTurn(2);
      return;
    } else if (action === 'Outwit') {
      if (outcome.passed) {
        addCombatLog(`Your plan works! ${target.template.name} is taken out of the fight.`);
        flashHit(target.id);
        defeatFoe(target, false);
      } else {
        addCombatLog('Your gambit backfires — TWO foes seize the moment!');
        if (complicationOptions) { setPendingComplication(complicationOptions); return; }
        concludePlayerTurn(2);
        return;
      }
    } else if (action === 'Retreat') {
      if (outcome.passed) {
        addCombatLog('You slip away! Journal the round, then travel on.');
        appendJournal('Retreated from combat, living to fight another day.');
        finishCombat('flee', 'journal');
        return;
      }
      addCombatLog('Caught! Foes act before you break free…');
      foes.forEach(() => runFoeTurn());
      addCombatLog('Battered but alive, you finally escape.');
      appendJournal('Retreated from combat — barely.');
      finishCombat('flee', 'journal');
      return;
    }

    if (complicationOptions && complicationOptions.length > 0) {
      setPendingComplication(complicationOptions);
      return;
    }
    // A winning Oppose with foes still standing and AP to spend: offer the
    // action's Additional Successes (pg.138) before the foes act.
    if (action === 'Oppose' && outcome.passed &&
        useGameState.getState().activeFoes.length > 0 && useGameState.getState().ap >= 1) {
      setAddClaimed([]);
      setChoosingNext(false);
      setPendingAdditional({ targetThreat: difficulty, explosive: ['Big Guns', 'Throwing'].includes(sol.skill) });
      return;
    }
    concludePlayerTurn();
  };

  // ================= OPPOSE ADDITIONAL SUCCESSES (pg.138) =================
  const additionalReduceThreat = () => {
    if (ap < 1 || addClaimed.includes('threat')) return;
    const others = [...useGameState.getState().activeFoes].sort((a, b) => b.currentThreat - a.currentThreat);
    const target = others[0];
    if (!target) return;
    updateAp(-1);
    updateFoeThreat(target.id, target.currentThreat > 1 ? -1 : 0);
    addCombatLog(`Additional Success: ${target.template.name}'s Threat is reduced by 1 (min 1).`);
    setAddClaimed(c => [...c, 'threat']);
  };
  const additionalCombatState = () => {
    if (ap < 1 || addClaimed.includes('state')) return;
    updateAp(-1);
    const st = rollCombatStateEntry();
    setCombatState(`${st.name}: ${st.description}`);
    addCombatLog(`Additional Success: a new Combat State — ${st.name}.`);
    setAddClaimed(c => [...c, 'state']);
  };
  const additionalChooseNext = () => {
    if (ap < 1 || addClaimed.includes('next')) return;
    updateAp(-1);
    setChoosingNext(true);
    setAddClaimed(c => [...c, 'next']);
    addCombatLog('Additional Success: tap a foe to make it act next.');
  };
  const additionalExplosiveDefeat = () => {
    if (!pendingAdditional || ap < 1) return;
    const victim = [...useGameState.getState().activeFoes]
      .filter(f => f.currentThreat < pendingAdditional.targetThreat)
      .sort((a, b) => b.currentThreat - a.currentThreat)[0];
    if (!victim) return;
    updateAp(-1);
    addCombatLog(`Additional Success (Explosive): ${victim.template.name} is caught in the blast and Defeated.`);
    defeatFoe(victim as CombatFoeState, true);
  };
  const doneAdditional = () => {
    setPendingAdditional(null);
    setChoosingNext(false);
    if (useGameState.getState().activeFoes.length === 0) { showVictory(); return; }
    concludePlayerTurn();
  };
  const pickNextFoe = (id: string) => {
    forcedNextActor.current = id;
    setChoosingNext(false);
    const f = useGameState.getState().activeFoes.find(x => x.id === id);
    if (f) addCombatLog(`${f.template.name} will act next.`);
  };

  const applyComplication = (option: string) => {
    setPendingComplication(null);
    addCombatLog(`COMPLICATION — ${option}`);

    if (option.includes('free Turn')) {
      // Handled as part of the upcoming enemy beat; note and continue.
    } else if (option.toLowerCase().includes('ammunition')) {
      const ammoBox = gear.find(g => g.type === 'Ammo');
      if (ammoBox) {
        useGameState.getState().removeGear(ammoBox.id);
        addCombatLog('You crack open an Ammo Box and keep firing!');
      } else if (equippedWeapon) {
        useGameState.setState(s => ({
          gear: s.gear.map(g => g.id === equippedWeapon.id ? { ...g, condition: 'Out of Ammo' } : g)
        }));
        addCombatLog(`${equippedWeapon.name} is OUT OF AMMO — clear it with an Ammo Box or Mod & Repair.`);
      } else {
        addCombatLog('Your weapon clicks empty.');
      }
    } else if (option.includes('breaks') || option.includes('Broken')) {
      if (equippedWeapon) {
        useGameState.setState(s => ({
          gear: s.gear.map(g => g.id === equippedWeapon.id ? { ...g, condition: 'Broken' } : g)
        }));
        addCombatLog(`${equippedWeapon.name} is BROKEN — Mod & Repair can fix it.`);
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
    if (stateName.includes('High Morale')) {
      addCombatLog('HIGH MORALE: a foe seizes the moment!');
    }
    concludePlayerTurn();
  };

  // ================= RENDER HELPERS =================
  const effMaxHp = Math.max(1, maxHp - rads);
  const hpPct = Math.max(0, Math.min(100, (hp / effMaxHp) * 100));
  const foes = activeFoes;
  const modeSolutions = selectedAction === 'Oppose' || selectedAction === 'Slaughter'
    ? WEAPON_SOLUTIONS : ACTION_SOLUTIONS[selectedAction];

  // ================= RENDER =================
  return (
    <div className="relative flex flex-col gap-3 uppercase">
      {/* ---------- HUD ---------- */}
      <div className={`border-2 rounded-sm p-3 bg-[#051a05] transition-colors ${playerHurt ? 'border-red-500' : 'border-[#14FF00]'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 font-bold text-red-500 animate-pulse"><Swords size={18} /> Combat</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Zap size={14} className="text-amber-400" /> {ap} AP</span>
            <span className="flex items-center gap-1"><Sparkles size={14} className="text-amber-400" /> {luck} LP</span>
          </div>
        </div>
        {/* HP bar */}
        <div className="flex items-center gap-2">
          <Heart size={16} className={hp <= 3 ? 'text-red-500' : 'text-[#14FF00]'} />
          <div className="flex-1 h-4 border border-[#14FF00]/60 bg-black overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${hp <= 3 ? 'bg-red-500' : 'bg-[#14FF00]'}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${hp <= 3 ? 'text-red-500' : 'text-white'}`}>{hp}/{effMaxHp}</span>
        </div>
        {/* Loadout */}
        <div className="flex items-center gap-3 mt-2 text-[11px] normal-case opacity-80">
          <span className="flex items-center gap-1"><Crosshair size={12} />{equippedWeapon ? equippedWeapon.name : 'Fists'}{equippedWeapon?.condition ? ` [${equippedWeapon.condition.split(',')[0]}]` : ''}</span>
          <span className="flex items-center gap-1"><Shield size={12} />{equippedArmor ? equippedArmor.name : 'No armor'}</span>
        </div>
      </div>

      {/* ---------- COMBAT STATE ---------- */}
      {combatState && (
        <div className="border border-amber-400/60 text-amber-400 p-2 text-xs normal-case flex gap-1">
          <span className="font-bold uppercase shrink-0">State —</span>
          <span>{combatState}</span>
        </div>
      )}

      {/* ---------- FOES ---------- */}
      <div className="space-y-1.5">
        {foes.map(foe => {
          const isTargetable = phase === 'choose' && !endState && !pendingAdditional && selectedAction === 'Oppose';
          const tappable = isTargetable || choosingNext;
          return (
            <button
              key={foe.id}
              disabled={!tappable}
              onClick={() => choosingNext ? pickNextFoe(foe.id) : beginAction('Oppose', foe.id)}
              className={`w-full border rounded-sm p-2.5 flex justify-between items-center text-left transition-all
                ${flashFoeId === foe.id ? 'border-red-500 bg-red-500/30' : choosingNext ? 'border-amber-400/70' : 'border-[#14FF00]/60'}
                ${tappable ? 'hover:border-red-500 hover:bg-red-500/10 cursor-pointer active:scale-[0.99]' : 'opacity-90'}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{foe.template.name}</span>
                  {isTargetable && <Crosshair size={13} className="text-red-500 shrink-0" />}
                  {choosingNext && <span className="text-[10px] text-amber-400 shrink-0">act next?</span>}
                </div>
                {foe.buffs.length > 0 && (
                  <div className="text-[10px] text-amber-400 normal-case mt-0.5">{foe.buffs.join(' • ')}</div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-[10px] opacity-60">THREAT</span>
                <span className="text-lg font-bold text-red-400 leading-none">{foe.currentThreat}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ---------- CHOOSE PANEL ---------- */}
      {phase === 'choose' && !endState && foes.length > 0 && (
        <div className="border border-[#14FF00]/50 rounded-sm p-3 space-y-3 bg-[#051a05]">
          {/* Action modes — equal billing */}
          <div className="grid grid-cols-5 gap-1">
            {(['Oppose', 'Slaughter', 'Outwit', 'De-escalate', 'Retreat'] as PlayerCombatAction[]).map(a => {
              const M = ACTION_META[a];
              const disabled = a === 'Retreat' && deadEnd;
              return (
                <button
                  key={a}
                  disabled={disabled}
                  onClick={() => { setSelectedAction(a); setSolutionIdx(0); setWeaponPicker(false); }}
                  className={`flex flex-col items-center gap-1 py-2 border rounded-sm text-[10px] font-bold transition-colors
                    ${selectedAction === a ? 'bg-[#14FF00] text-black border-[#14FF00]' : 'border-[#14FF00]/40 hover:border-[#14FF00]'}
                    ${disabled ? 'opacity-25' : ''}`}
                >
                  <M.icon size={16} />
                  {M.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] normal-case opacity-70">{ACTION_META[selectedAction].hint}</p>

          {/* Weapon chip (attack modes) */}
          {(selectedAction === 'Oppose' || selectedAction === 'Slaughter') && (
            <div>
              <button
                onClick={() => setWeaponPicker(!weaponPicker)}
                className="w-full flex items-center justify-between border border-[#14FF00]/50 rounded-sm px-3 py-2 text-xs hover:border-[#14FF00]"
              >
                <span>Weapon: <span className="font-bold text-white">{WEAPON_SOLUTIONS[weaponIdx].label}</span> · TN {solutionTn(WEAPON_SOLUTIONS[weaponIdx])}</span>
                <ChevronDown size={14} className={weaponPicker ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {weaponPicker && (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {WEAPON_SOLUTIONS.map((s, i) => (
                    <button key={i} onClick={() => { setWeaponIdx(i); setWeaponPicker(false); }}
                      className={`border rounded-sm px-2 py-1.5 text-[11px] text-left ${weaponIdx === i ? 'bg-[#14FF00]/20 border-[#14FF00]' : 'border-[#14FF00]/30'}`}>
                      {s.label} · TN {solutionTn(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Solution chips (non-attack modes) */}
          {selectedAction !== 'Oppose' && selectedAction !== 'Slaughter' && (
            <div className="grid grid-cols-2 gap-1">
              {(modeSolutions as CombatSolution[]).map((s, i) => (
                <button key={i} onClick={() => setSolutionIdx(i)}
                  className={`border rounded-sm px-2 py-1.5 text-[11px] text-left ${solutionIdx === i ? 'bg-[#14FF00]/20 border-[#14FF00]' : 'border-[#14FF00]/30'}`}>
                  {s.label} · TN {solutionTn(s)}
                </button>
              ))}
            </div>
          )}

          {/* Pre-roll boost: Try Your Luck (1 LP). AP is spent only on the
              post-roll re-roll or on Additional Successes, per the rules. */}
          <div className="flex items-center gap-2 border-y border-[#14FF00]/30 py-2 text-[11px] normal-case">
            <label className={`flex items-center gap-1 ${luck < 1 ? 'opacity-30' : ''}`}>
              <input type="checkbox" checked={tryLuck} disabled={luck < 1} onChange={e => setTryLuck(e.target.checked)} />
              Try Your Luck (1 LP — roll vs Luck {special.L})
            </label>
          </div>

          {/* Commit button (all modes except single-target Attack, which is tap-a-foe) */}
          {selectedAction === 'Oppose' ? (
            <div className="text-center text-xs text-red-400 animate-pulse py-1 flex items-center justify-center gap-2">
              <Crosshair size={14} /> Tap a foe above to attack
            </div>
          ) : (
            <button
              onClick={() => beginAction(selectedAction)}
              className="w-full border-2 border-[#14FF00] rounded-sm p-3 font-bold hover:bg-[#14FF00] hover:text-black flex items-center justify-center gap-2"
            >
              <Dices size={16} /> {ACTION_META[selectedAction].label}
              {selectedAction === 'Slaughter' && ` (diff ${Math.max(...foes.map(f => f.currentThreat)) + foes.length})`}
            </button>
          )}
        </div>
      )}

      {/* ---------- OPPOSE ADDITIONAL SUCCESSES (pg.138) ---------- */}
      {pendingAdditional && (
        <div className="border border-amber-400/60 rounded-sm p-3 space-y-2 bg-[#051a05]">
          <div className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Sparkles size={16} /> Additional Successes — spend AP ({ap} left)
          </div>
          {choosingNext ? (
            <div className="text-xs normal-case text-amber-400 animate-pulse">Tap a foe above to make it act next…</div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              <button onClick={additionalReduceThreat} disabled={ap < 1 || addClaimed.includes('threat') || foes.length < 2}
                className="text-left text-xs border border-amber-400/40 rounded-sm p-2 hover:bg-amber-400 hover:text-black disabled:opacity-30 normal-case">
                {addClaimed.includes('threat') ? '✓ ' : ''}Reduce a nearby foe's Threat by 1 (1 AP)
              </button>
              <button onClick={additionalCombatState} disabled={ap < 1 || addClaimed.includes('state')}
                className="text-left text-xs border border-amber-400/40 rounded-sm p-2 hover:bg-amber-400 hover:text-black disabled:opacity-30 normal-case">
                {addClaimed.includes('state') ? '✓ ' : ''}Gain a new Combat State (1 AP)
              </button>
              <button onClick={additionalChooseNext} disabled={ap < 1 || addClaimed.includes('next') || foes.length < 2}
                className="text-left text-xs border border-amber-400/40 rounded-sm p-2 hover:bg-amber-400 hover:text-black disabled:opacity-30 normal-case">
                {addClaimed.includes('next') ? '✓ ' : ''}Choose which foe acts next (1 AP)
              </button>
              {pendingAdditional.explosive && foes.some(f => f.currentThreat < pendingAdditional.targetThreat) && (
                <button onClick={additionalExplosiveDefeat} disabled={ap < 1}
                  className="text-left text-xs border border-amber-400/40 rounded-sm p-2 hover:bg-amber-400 hover:text-black disabled:opacity-30 normal-case">
                  Explosive: defeat a lower-Threat foe (1 AP each)
                </button>
              )}
            </div>
          )}
          {!choosingNext && (
            <button onClick={doneAdditional} className="w-full border-2 border-[#14FF00] rounded-sm p-2 font-bold hover:bg-[#14FF00] hover:text-black">
              Done — foes act
            </button>
          )}
        </div>
      )}

      {/* ---------- ENEMY TURN BEAT ---------- */}
      {phase === 'enemyTurn' && (
        <div className="border-2 border-red-500 rounded-sm p-4 text-center bg-[#1a0505] animate-pulse">
          <div className="text-red-500 font-bold text-lg flex items-center justify-center gap-2">
            <Swords size={20} /> ENEMY TURN
          </div>
          <div className="text-xs normal-case opacity-70 mt-1">The wasteland strikes back…</div>
        </div>
      )}

      {/* ---------- LOG (collapsible) ---------- */}
      <div className="border border-[#14FF00]/50 rounded-sm bg-[#051a05]">
        <button onClick={() => setLogOpen(!logOpen)} className="w-full flex justify-between items-center px-3 py-2 text-xs font-bold hover:bg-[#14FF00]/10">
          <span>COMBAT LOG</span>
          <ChevronDown size={14} className={logOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {logOpen && (
          <div className="max-h-40 overflow-y-auto px-3 pb-2 text-xs space-y-1 custom-scrollbar normal-case border-t border-[#14FF00]/30 pt-2">
            {combatLog.map((log, idx) => (
              <div key={idx} className={log.includes('Damage') || log.includes('INJURY') ? 'text-red-400' : log.includes('DEFEATED') || log.includes('SUCCESS') ? 'text-[#14FF00]' : 'text-[#14FF00]/80'}>
                &gt; {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {/* ================= OVERLAYS ================= */}

      {/* Dice reveal */}
      {phase === 'reveal' && pendingRoll && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
          <div className="border-2 border-[#14FF00] bg-[#051a05] rounded-sm p-5 w-full max-w-sm text-center space-y-4">
            <div className="text-xs uppercase opacity-70">{ACTION_META[pendingRoll.action].label} · diff {pendingRoll.difficulty} · {pendingRoll.sol.skill}</div>
            <div className="flex justify-center gap-3">
              {pendingRoll.outcome.rolls.map((r, i) => {
                const crit = !pendingRoll.outcome.tryLuck && r <= pendingRoll.outcome.critThreshold;
                const hit = pendingRoll.outcome.tryLuck ? r <= pendingRoll.outcome.targetNumber : r <= pendingRoll.outcome.targetNumber;
                const comp = pendingRoll.outcome.tryLuck ? r > pendingRoll.outcome.targetNumber : r === 20;
                return (
                  <div key={i}
                    className={`w-16 h-16 border-2 rounded-sm flex items-center justify-center text-3xl font-bold animate-[spin_0.4s_ease-out]
                      ${comp ? 'border-red-500 text-red-500' : crit ? 'border-amber-400 text-amber-400' : hit ? 'border-[#14FF00] text-[#14FF00]' : 'border-[#14FF00]/30 text-[#14FF00]/40'}`}>
                    {r}
                  </div>
                );
              })}
            </div>
            {showVerdict ? (
              <>
                <div className={`text-2xl font-bold ${pendingRoll.outcome.passed ? 'text-[#14FF00]' : 'text-red-500'}`}>
                  {pendingRoll.outcome.passed ? 'SUCCESS' : 'FAILURE'}
                  <span className="block text-sm opacity-70">{pendingRoll.outcome.successes}/{pendingRoll.difficulty} successes{pendingRoll.outcome.complications > 0 ? ` · ${pendingRoll.outcome.complications} complication` : ''}</span>
                </div>
                {!pendingRoll.rerolled && !pendingRoll.outcome.passed && ap >= 1 && (
                  <button onClick={rerollAttack} className="w-full border border-amber-400 text-amber-400 rounded-sm p-2 text-sm hover:bg-amber-400 hover:text-black flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> Re-roll worst die (1 AP)
                  </button>
                )}
                <button onClick={applyRoll} className="w-full border-2 border-[#14FF00] rounded-sm p-3 font-bold hover:bg-[#14FF00] hover:text-black">
                  Continue
                </button>
              </>
            ) : (
              <div className="text-sm opacity-50 animate-pulse">Rolling…</div>
            )}
          </div>
        </div>
      )}

      {/* Endure interrupt — spotlight modal */}
      {pendingDamage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="border-2 border-red-500 bg-[#1a0505] rounded-sm p-4 w-full max-w-sm space-y-3">
            <div className="font-bold text-red-500 flex items-center gap-2 text-lg">
              <ShieldAlert size={20} /> INCOMING: {pendingDamage.dmg.amount} {pendingDamage.dmg.type}!
            </div>
            <div className="text-xs normal-case opacity-80">Endure (difficulty {pendingDamage.dmg.amount}): success = 1 Damage{isPowerArmor ? ' (0 in Power Armor)' : ''}.</div>
            <div className="space-y-1">
              {ENDURE_SOLUTIONS.map((s, i) => (
                <button key={i} onClick={() => setEndureSolution(i)}
                  className={`block w-full text-left text-xs rounded-sm border p-2 ${endureSolution === i ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00]/40'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => resolveEndure(false)} className="flex-1 border border-red-500 text-red-500 rounded-sm p-3 text-sm hover:bg-red-500 hover:text-black">
                Take {pendingDamage.dmg.amount}
              </button>
              <button onClick={() => resolveEndure(true)} className="flex-1 border-2 border-[#14FF00] rounded-sm p-3 text-sm font-bold hover:bg-[#14FF00] hover:text-black animate-pulse">
                ENDURE!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complication interrupt — spotlight modal */}
      {pendingComplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="border-2 border-red-500 bg-[#1a0505] rounded-sm p-4 w-full max-w-sm space-y-2">
            <div className="font-bold text-red-500">⚠ COMPLICATION! Choose what goes wrong:</div>
            {pendingComplication.map(option => (
              <button key={option} onClick={() => applyComplication(option)}
                className="block w-full text-left text-sm rounded-sm border border-red-500/50 p-3 hover:bg-red-500 hover:text-black normal-case">
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Victory / resolution summary */}
      {endState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="border-2 border-[#14FF00] bg-[#051a05] rounded-sm p-5 w-full max-w-sm text-center space-y-4">
            <div className="flex flex-col items-center gap-2">
              {endState.kind === 'victory' ? <Trophy size={36} className="text-amber-400" /> : endState.kind === 'talk' ? <MessageCircle size={36} className="text-[#14FF00]" /> : <Wind size={36} className="text-[#14FF00]" />}
              <div className="text-2xl font-bold text-[#14FF00]">
                {endState.kind === 'victory' ? 'VICTORY' : endState.kind === 'talk' ? 'TALKED DOWN' : 'ESCAPED'}
              </div>
            </div>
            <div className="text-sm normal-case space-y-1 border-y border-[#14FF00]/30 py-3">
              <div>HP: <span className="font-bold text-white">{hp}/{effMaxHp}</span> {startHp.current - hp > 0 && <span className="text-red-400">(-{startHp.current - hp})</span>}</div>
              {useGameState.getState().injuries.length - startInjuries.current > 0 && (
                <div className="text-red-400">Injuries taken: {useGameState.getState().injuries.length - startInjuries.current}</div>
              )}
              {spoils.current.length > 0 ? (
                <div className="text-[#14FF00]">Spoils: {spoils.current.join(', ')}</div>
              ) : (
                <div className="opacity-60">No loot recovered.</div>
              )}
            </div>
            <button onClick={finishExit} className="w-full border-2 border-[#14FF00] rounded-sm p-3 font-bold hover:bg-[#14FF00] hover:text-black animate-pulse">
              Continue{endState.toStage === 'journal' ? ' → Journal' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
