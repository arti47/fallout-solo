// 2d20 Skill Test engine (Chapter 4, pg.82-95) — pure functions shared by the
// Round engine and modals.
import type { Special, Skill } from '../store/gameState';

export interface TestSetup {
  /** S/P/E/C/I/A/L key of the governing attribute. */
  attribute: keyof Special;
  skillName: string;
  difficulty: number;
  /** Extra d20s bought with AP (1 AP each). */
  extraDice?: number;
  /** Trying your Luck (pg.94): TN = LCK; under = always crit, over = always complication. */
  tryLuck?: boolean;
}

export interface TestOutcome {
  rolls: number[];
  targetNumber: number;
  critThreshold: number;
  successes: number;
  complications: number;
  passed: boolean;
  /** Successes beyond the difficulty (1+ grants AP per the book). */
  excess: number;
  tryLuck: boolean;
}

export const d20 = () => Math.floor(Math.random() * 20) + 1;

export const getTargetNumber = (special: Special, skills: Skill[], attribute: keyof Special, skillName: string): number => {
  const skill = skills.find(s => s.name === skillName);
  return special[attribute] + (skill?.rank ?? 0);
};

export const getCritThreshold = (skills: Skill[], skillName: string): number => {
  const skill = skills.find(s => s.name === skillName);
  return skill?.isTag ? Math.max(1, skill.rank) : 1;
};

export const evaluateRolls = (
  rolls: number[],
  targetNumber: number,
  critThreshold: number,
  difficulty: number,
  tryLuck = false
): TestOutcome => {
  let successes = 0;
  let complications = 0;
  for (const r of rolls) {
    if (tryLuck) {
      // Trying your Luck: under TN = Critical Success; over = Complication.
      if (r <= targetNumber) successes += 2;
      else complications += 1;
    } else if (r <= critThreshold) {
      successes += 2;
    } else if (r <= targetNumber) {
      successes += 1;
    } else if (r === 20) {
      complications += 1;
    }
  }
  const passed = successes >= difficulty;
  return {
    rolls,
    targetNumber,
    critThreshold,
    successes,
    complications,
    passed,
    excess: Math.max(0, successes - difficulty),
    tryLuck
  };
};

export const runSkillTest = (
  special: Special,
  skills: Skill[],
  setup: TestSetup,
  luckAttribute: number
): TestOutcome => {
  const tn = setup.tryLuck ? luckAttribute : getTargetNumber(special, skills, setup.attribute, setup.skillName);
  const crit = setup.tryLuck ? 0 : getCritThreshold(skills, setup.skillName);
  const numDice = 2 + (setup.extraDice ?? 0);
  const rolls = Array.from({ length: numDice }, d20);
  return evaluateRolls(rolls, tn, crit, setup.difficulty, setup.tryLuck);
};

/** Re-rolls one die (AP spend, pg.95) — re-rolls the worst die. */
export const rerollWorstDie = (outcome: TestOutcome, difficulty: number): TestOutcome => {
  const rolls = [...outcome.rolls];
  // The "worst" die: a complication (20) first, else the highest failing die.
  const worstIndex = rolls.indexOf(Math.max(...rolls));
  rolls[worstIndex] = d20();
  return evaluateRolls(rolls, outcome.targetNumber, outcome.critThreshold, difficulty, outcome.tryLuck);
};
