// One-tap character creation.
//
// The book's seven creation stages are the single biggest barrier to just
// *playing*. This rolls a complete, rules-legal Vault Dweller in one call —
// every stage, in book order — so a new player can be in Round 1 in one tap
// and learn the rules by playing rather than by reading.
//
// Everything it produces can still be edited afterwards in the wizard.

import { useGameState } from '../store/gameState';
import type { Special, Skill } from '../store/gameState';
import {
  VAULT_EXPERIMENTS, VAULT_POPULATIONS, VAULT_REPUTATIONS, rollVaultNpc,
  GOAT_TEMPLATES, EQUIPMENT_MAPPING, QUEST_GOALS, QUEST_BLOCKERS,
  RANDOM_NAMES, RANDOM_APPEARANCES, RANDOM_PERSONALITIES, RANDOM_MOTIVATIONS,
  getRandomItem, getRandomValue, rollD20
} from '../data/creationTables';

const REGIONS = [
  'New California (West Coast)', 'Mojave Wasteland', 'Capital Wasteland',
  'The Commonwealth', 'Appalachia', 'The Island'
];

// Outer-edge squares, minus the impassable ones and the central Vault.
const EDGE_SQUARES = [1, 2, 4, 5, 6, 10, 11, 15, 16, 20, 22, 23, 25];

const ATTR_KEYS: (keyof Special)[] = ['S', 'P', 'E', 'C', 'I', 'A', 'L'];

/** Stage 2 (pg.61): every Attribute starts at 4; spend exactly 12 more, max 10. */
const rollSpecial = (): Special => {
  const special: Special = { S: 4, P: 4, E: 4, C: 4, I: 4, A: 4, L: 4 };
  for (let spent = 0; spent < 12; spent++) {
    const open = ATTR_KEYS.filter(k => special[k] < 10);
    const key = open[Math.floor(Math.random() * open.length)];
    special[key] += 1;
  }
  return special;
};

/** Stage 3 (pg.64-68): a G.O.A.T. result, then INT extra ranks (max 5), 2 Tags. */
const rollSkills = (baseSkills: Skill[], intelligence: number): Skill[] => {
  const template = GOAT_TEMPLATES[Math.floor(Math.random() * GOAT_TEMPLATES.length)];
  const ranks = template.skills as Partial<Record<string, number>>;
  const skills = baseSkills.map(s => ({ ...s, rank: ranks[s.name] ?? 0, isTag: false }));

  // Spend the INT bonus ranks, respecting the rank-5 cap.
  for (let spent = 0; spent < intelligence; spent++) {
    const open = skills.filter(s => s.rank < 5);
    if (open.length === 0) break;
    open[Math.floor(Math.random() * open.length)].rank += 1;
  }

  // Two Tags on the strongest skills — that is what a player would pick.
  [...skills].sort((a, b) => b.rank - a.rank).slice(0, 2).forEach(s => {
    const target = skills.find(k => k.name === s.name);
    if (target) target.isTag = true;
  });
  return skills;
};

/** Stage 5 (pg.69): equipment from two skills at rank 3+, plus 2 Supplies. */
const rollEquipment = (skills: Skill[]) => {
  const eligible = skills
    .filter(s => s.rank >= 3 && EQUIPMENT_MAPPING[s.name])
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 2);
  return eligible.map(s => {
    const item = EQUIPMENT_MAPPING[s.name];
    return {
      id: `start-skill-${s.name}`,
      name: item.name,
      type: 'Equipment',
      quantity: item.quantity,
      weight: item.weight,
      description: `Starting equipment (${s.name})`
    };
  });
};

/** Rolls and commits an entire character. Returns a short summary to show. */
export const quickCreateCharacter = (): { name: string; vault: number; goal: string; blocker: string } => {
  const state = useGameState.getState();

  // ---- Stage 1: the Vault ----
  const experiment = VAULT_EXPERIMENTS.find(e => e.roll === rollD20());
  const popRoll = rollD20();
  const population = VAULT_POPULATIONS.find(p => popRoll >= p.min && popRoll <= p.max);
  const soleSurvivor = popRoll <= 4;   // 1-4 skips Reputation
  const repRoll = rollD20();
  const reputation = VAULT_REPUTATIONS.find(r => repRoll >= r.min && repRoll <= r.max);
  const npc = rollVaultNpc();

  // ---- Stages 2-4 ----
  const special = rollSpecial();
  const skills = rollSkills(state.skills, special.I);
  const hp = 5 + special.E;                    // pg.68
  const luck = Math.ceil(special.L / 2);       // pg.68

  // ---- Stage 5 ----
  const gear = [
    { id: 'start-vault-suit', name: 'Vault Suit', type: 'Armor', quantity: 1, weight: 1, value: 1,
      description: 'Standard issue Vault-Tec jumpsuit.' },
    ...rollEquipment(skills)
  ];

  // ---- Stage 6: description ----
  const name = getRandomItem(RANDOM_NAMES);
  const appearance = getRandomItem(RANDOM_APPEARANCES);
  const personality = getRandomItem(RANDOM_PERSONALITIES);
  const motivation = getRandomItem(RANDOM_MOTIVATIONS);

  // ---- Stage 7: the Main Quest ----
  const goal = QUEST_GOALS.find(g => g.roll === rollD20());
  const blockerRoll = rollD20();
  const blocker = QUEST_BLOCKERS.find(b => blockerRoll >= b.min && blockerRoll <= b.max);
  const blockerLocation = blocker?.name === 'Unknown Location'
    ? null
    : EDGE_SQUARES[Math.floor(Math.random() * EDGE_SQUARES.length)];

  const vaultNumber = getRandomValue(122);
  const region = getRandomItem(REGIONS);

  const journal = [
    '== VAULT-TEC OFFICIAL RECORD ==',
    `NAME: ${name}`,
    `APPEARANCE: ${appearance}`,
    `PERSONALITY: ${personality}`,
    `MOTIVATION: ${motivation}`,
    `VAULT: ${vaultNumber} — ${experiment?.name ?? 'Unknown'} (${population?.name ?? 'Unknown'})`,
    `REGION: ${region}`,
    `VAULT REPUTATION: ${soleSurvivor ? 'N/A (Sole Survivor)' : reputation?.name ?? 'Unknown'}`,
    `LINKED NPC: ${npc.name} — ${npc.appearance}, ${npc.personality} ${npc.position}`,
    '',
    `MAIN QUEST: ${goal?.name ?? 'Unknown'}${goal?.desc ? ` — ${goal.desc}` : ''}`,
    `BLOCKER: ${blocker?.name ?? 'Unknown'}${blockerLocation ? ` (Map Square ${blockerLocation})` : ' (location unknown)'}`,
    '',
    'Entry 1: Left the Vault today. The sun is too bright.',
    ''
  ].join('\n');

  useGameState.setState({
    name, appearance, personality, motivation,
    special, skills,
    hp, maxHp: hp, ap: 0, maxAp: special.A, luck, maxLuck: luck, rads: 0,
    supplies: 2, caps: 0, gear,
    level: 1, xp: 0,
    vault: {
      number: vaultNumber,
      experiment: experiment?.name ?? 'Unknown',
      population: population?.name ?? 'Unknown',
      reputation: soleSurvivor ? 'N/A (Sole Survivor)' : reputation?.name ?? 'Unknown',
      npcName: npc.name,
      npcDetails: `${npc.appearance}, ${npc.personality} ${npc.position}`,
      truths: [...(experiment?.truths ?? []), ...(population?.truths ?? [])],
      region
    },
    mainQuest: {
      goal: goal?.name ?? 'Unknown Goal',
      goalDesc: goal?.desc,
      blocker: blocker?.name ?? 'Unknown Blocker',
      blockerDesc: blocker?.desc,
      blockerLocation,
      status: 'Active'
    },
    journalText: journal,
    stage: 'travel',
    round: 1,
    day: 1,
    // Someone who took the one-tap start does not want a wall of tutorial text
    // on arrival — the Director tells them what to do instead. Re-enable any
    // time in Data → SYS.MGMT.
    tutorialEnabled: false
  });

  return {
    name,
    vault: vaultNumber,
    goal: goal?.name ?? 'Unknown Goal',
    blocker: blocker?.name ?? 'Unknown Blocker'
  };
};
