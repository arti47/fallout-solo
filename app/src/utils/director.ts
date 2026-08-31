// The Director — works out the ONE thing to do next, in plain language.
//
// Every previous attempt at onboarding added text explaining the rules. This
// does the opposite: it names a single next move ("Travel to Square 12"),
// explains it in half a sentence, and the UI performs it when tapped. A player
// who never opens the Codex can finish a whole campaign by pressing the big
// button and writing when asked.
//
// Pure: state in, one step out. The Round tab owns the handlers.

import type { GameState, RoundStage, SectorInfo, TrackedSideQuest, QuestData } from '../store/gameState';

export type DirectorActionKind =
  | 'travel'          // move to `square`
  | 'proceed'         // encounter → action stage, safe
  | 'fight'           // start combat
  | 'openAction'      // open the Pick-a-Path action named `action`
  | 'clearBlocker'
  | 'completeSideQuest'
  | 'levelUp'
  | 'goToJournal'
  | 'finishRound'
  | 'endStory'
  | 'dying'           // at 0 HP the Death panel owns the screen
  | 'inCombat';       // combat drives itself

export interface DirectorStep {
  /** Imperative label for the big button. */
  label: string;
  /** Half a sentence on WHY, in plain language. */
  why: string;
  kind: DirectorActionKind;
  /** Target square for 'travel'. */
  square?: number;
  /** Action name for 'openAction'. */
  action?: string;
  /** Side quest index for 'completeSideQuest'. */
  questIndex?: number;
  /** True when this step ends the campaign — the UI styles it differently. */
  terminal?: boolean;
}

const IMPASSABLE = [3, 8, 21, 24];

const isAdjacent = (a: number, b: number) => {
  if (Math.abs(a - b) === 5) return true;
  return Math.abs(a - b) === 1 && Math.floor((a - 1) / 5) === Math.floor((b - 1) / 5);
};

const adjacentSquares = (from: number) =>
  Array.from({ length: 25 }, (_, i) => i + 1).filter(n => isAdjacent(from, n) && !IMPASSABLE.includes(n));

/** Where to go next: the Blocker if it is next door, else a live Side Quest,
 *  else somewhere new, else anywhere. */
const chooseTravelTarget = (
  current: number,
  sectorData: Record<number, SectorInfo>,
  mainQuest: QuestData | null,
  sideQuests: TrackedSideQuest[]
): { square: number; why: string } => {
  const options = adjacentSquares(current);
  const fallback = options[0] ?? current;

  if (mainQuest?.blockerLocation && options.includes(mainQuest.blockerLocation)) {
    return { square: mainQuest.blockerLocation, why: 'Your Main Quest Blocker is right there.' };
  }
  const questHere = sideQuests.find(q => q.status === 'Active' && options.includes(q.location));
  if (questHere) {
    return { square: questHere.location, why: 'A Side Quest is waiting on that square.' };
  }
  const unexplored = options.find(n => !sectorData[n]?.explored);
  if (unexplored) {
    return { square: unexplored, why: 'You have never been there — new ground moves the story.' };
  }
  if (mainQuest?.blockerLocation) {
    // Step toward the Blocker: pick the adjacent square closest to it.
    const dist = (n: number) => {
      const t = mainQuest.blockerLocation!;
      return Math.abs(Math.floor((n - 1) / 5) - Math.floor((t - 1) / 5)) + Math.abs(((n - 1) % 5) - ((t - 1) % 5));
    };
    const closest = [...options].sort((a, b) => dist(a) - dist(b))[0];
    if (closest !== undefined) {
      return { square: closest, why: `Heading toward your Blocker on Square ${mainQuest.blockerLocation}.` };
    }
  }
  return { square: fallback, why: 'Keep moving — every Round starts with a journey.' };
};

/** The single next move. */
export const nextStep = (s: GameState): DirectorStep => {
  const sector = s.sectorData[s.currentSector];
  const effectiveMaxHp = Math.max(1, s.maxHp - s.rads);
  const hurt = s.hp < effectiveMaxHp;
  const badlyHurt = s.hp * 2 <= effectiveMaxHp;
  const atBlocker = s.mainQuest?.blockerLocation === s.currentSector;
  const isSettlement = !!sector?.isSettlement;

  // 0 HP takes over the screen with the Death panel — say so, or the big
  // button looks broken behind an overlay it cannot reach.
  if (s.hp <= 0) {
    return {
      kind: 'dying',
      label: 'You are down — choose your fate',
      why: 'The panel on screen has three options: shrug it off and Live On, spend every Luck Point on a Miraculous Escape, or end the story here and write your Epilogue.',
      terminal: true
    };
  }

  if (s.combatActive) {
    return {
      kind: 'inCombat',
      label: 'Tap a foe to attack it',
      why: 'Or pick Talk Down or Flee below — both are real ways to win.'
    };
  }

  // The story is over — say so plainly instead of letting it drift.
  if (s.mainQuest?.status === 'Completed') {
    return {
      kind: 'endStory',
      label: 'Write your Epilogue',
      why: 'Your Main Quest is done. Finish the story properly and export it.',
      terminal: true
    };
  }

  const stage: RoundStage = s.stage;

  if (stage === 'travel') {
    const { square, why } = chooseTravelTarget(s.currentSector, s.sectorData, s.mainQuest, s.sideQuests);
    return {
      kind: 'travel',
      square,
      label: `Travel to Square ${square}`,
      why: s.supplies >= 1
        ? `${why} Costs 1 Supply (you have ${s.supplies}).`
        : `${why} No Supplies left, so this costs 2 HP.`
    };
  }

  if (stage === 'encounter') {
    const danger = s.encounterDanger;
    if (danger) {
      return {
        kind: 'fight',
        label: 'Fight',
        why: 'Something here means you harm. You can still Talk Down or Flee instead.'
      };
    }
    return {
      kind: 'proceed',
      label: "Continue — it's safe",
      why: 'Nothing is threatening you. Answer the prompt above first if you fancy it.'
    };
  }

  if (stage === 'action') {
    // Anything already done this Round is off the table, so the Director always
    // makes progress instead of looping on the same suggestion.
    const done = (name: string) => s.actionsThisRound.includes(name);
    const canRest = s.supplies > 0 || (isSettlement && s.caps > 0);
    const npcHere = s.npcs.some(n => n.location === s.currentSector);
    const questHere = s.sideQuests.findIndex(q => q.status === 'Active' && q.location === s.currentSector);
    const canScavenge = !s.scavengedThisRound && (!isSettlement || sector?.reputation === 'Hostile');

    if (s.inDanger) {
      return { kind: 'fight', label: 'Deal with the threat', why: 'You cannot end the Round while you are in danger.' };
    }
    if (badlyHurt && canRest && !done('Rest')) {
      return { kind: 'openAction', action: 'Rest', label: 'Rest and heal',
        why: `You are down to ${s.hp}/${effectiveMaxHp} HP. Patch yourself up before you travel.` };
    }
    if (s.injuries.length > 0 && !done('Patch Up')) {
      return { kind: 'openAction', action: 'Patch Up', label: 'Treat your injury',
        why: `You are carrying: ${s.injuries[0]}.` };
    }
    if (atBlocker && !done('Clear Main Quest Blocker')) {
      return { kind: 'clearBlocker', label: 'Clear your Main Quest Blocker',
        why: 'This is the square your whole quest has been aiming at.' };
    }
    if (questHere >= 0 && !done('Complete Side Quest')) {
      return { kind: 'completeSideQuest', questIndex: questHere, label: 'Complete the Side Quest here',
        why: `"${s.sideQuests[questHere].goal}" — collect your reward.` };
    }
    if (s.xp >= 1 && !done('Level Up')) {
      return { kind: 'levelUp', label: 'Level Up',
        why: `You have ${s.xp} XP. Spend it on a Perk — they do real work now.` };
    }
    if (s.supplies <= 1 && !done('Find Supplies')) {
      return { kind: 'openAction', action: 'Find Supplies', label: 'Find Supplies',
        why: `Only ${s.supplies} left, and travel eats one per Round.` };
    }
    if (hurt && s.supplies > 2 && !done('Rest')) {
      return { kind: 'openAction', action: 'Rest', label: 'Rest and heal',
        why: `${s.hp}/${effectiveMaxHp} HP, and you can spare a Supply.` };
    }
    if (npcHere && !done('Meet')) {
      return { kind: 'openAction', action: 'Meet', label: 'Meet someone here',
        why: 'Talk to them: learn a secret and pick up a Side Quest.' };
    }
    if (canScavenge && !done('Scavenge')) {
      return { kind: 'openAction', action: 'Scavenge', label: 'Scavenge this place',
        why: 'Search for loot — once per Round, and you have not yet.' };
    }
    if (isSettlement && !s.tradedThisRound && !done('Trade')) {
      return { kind: 'openAction', action: 'Trade', label: 'Trade',
        why: 'You are in a settlement. Sell what you do not need.' };
    }
    if ((sector?.truths?.length ?? 0) < 2 && !done('Explore')) {
      return { kind: 'openAction', action: 'Explore', label: 'Explore',
        why: 'Learn a Truth about this place — it changes what happens here.' };
    }
    return { kind: 'goToJournal', label: 'Done here — write the Round up',
      why: 'Nothing pressing left. Move on to the Journal.' };
  }

  // Journal stage
  return {
    kind: 'finishRound',
    label: `Finish Round ${s.round}`,
    why: 'Write a line above if you want to, then start the next day.'
  };
};
