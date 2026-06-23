// Appendix 1: Perks — complete list from the rulebook (pg.150-157).
// Requirements use S.P.E.C.I.A.L. abbreviations; `level` is a minimum character Level.

export type Special = 'STR' | 'PER' | 'END' | 'CHA' | 'INT' | 'AGI' | 'LCK';

export interface PerkRequirement {
  attribute?: Partial<Record<Special, number>>;
  level?: number;
}

export interface Perk {
  name: string;
  /** Maximum number of Ranks; Infinity = Unlimited. */
  ranks: number;
  requirements: PerkRequirement;
  description: string;
  /** Per-rank descriptions for multi-rank perks where each rank differs. */
  rankDescriptions?: string[];
}

export const PERKS: Perk[] = [
  {
    name: 'S.P.E.C.I.A.L. Training',
    ranks: Infinity,
    requirements: {},
    description: 'Increase one S.P.E.C.I.A.L. stat by 1 to a maximum of 10.'
  },
  {
    name: 'Skill Mastery',
    ranks: 2,
    requirements: {},
    description: 'Gain an additional Tag skill.'
  },
  {
    name: 'Adamantine Skeleton',
    ranks: 1,
    requirements: { attribute: { END: 7 } },
    description: 'When you sustain an Injury, you may re-roll your [INJURY] once and use either result.'
  },
  {
    name: 'Adrenaline Rush',
    ranks: 1,
    requirements: { attribute: { STR: 8 } },
    description: 'Once per Round, when your health is below half its maximum value, you may count your STR Attribute as 12 for one STR-based Skill test.'
  },
  {
    name: 'Animal Friend',
    ranks: 2,
    requirements: { attribute: { CHA: 6 } },
    description: 'Improves De-escalation against beasts.',
    rankDescriptions: [
      'Rank 1: You reduce the Difficulty of De-escalate Actions against Mammals, Lizards, and Insect Foes by 1.',
      'Rank 2: You automatically succeed when making the De-Escalate Action against a Mammal, Lizard, or Insect Foe.'
    ]
  },
  {
    name: 'Armorer',
    ranks: 2,
    requirements: { attribute: { STR: 5, INT: 6 }, level: 1 },
    description: 'When you make the Modify and Repair Gear action to modify Armor, you may add an additional Modification to that Armor, rather than just one. You must pay for the Modification as normal. For each Rank of this Perk, you may add one additional Modification.'
  },
  {
    name: 'Awareness',
    ranks: 1,
    requirements: { attribute: { PER: 7 } },
    description: 'When you generate a Combat State, you may select one Foe. Until the end of the Encounter, all Oppose checks made against that Foe using a Ranged Weapon have their Difficulty reduced by 1 to a minimum of 1.'
  },
  {
    name: 'Barbarian',
    ranks: 1,
    requirements: { attribute: { STR: 7 }, level: 4 },
    description: 'Once per Round, you may elect to automatically succeed on an END Skill Test.'
  },
  {
    name: 'Better Criticals',
    ranks: 1,
    requirements: { attribute: { LCK: 9 } },
    description: 'After a successful Oppose Action, you may spend 1 Luck Point to immediately Defeat a random Foe in the combat.'
  },
  {
    name: 'Black Widow/Lady Killer',
    ranks: 1,
    requirements: { attribute: { CHA: 6 } },
    description: 'When you attempt a CHA test to influence an NPC who is attracted to you, you may re-roll 1d20. In addition, reduce the Difficulty of Oppose Actions against that NPC by 1 to a minimum of 1. If you are unsure if a character is attracted to you, ask the Oracle.'
  },
  {
    name: 'Blacksmith',
    ranks: 2,
    requirements: { attribute: { STR: 6 }, level: 4 },
    description: 'When you make the Modify and Repair Gear action to modify a Melee Weapon, you may add an additional Modification to that weapon, rather than just one. You must pay for the Modification as normal. For each Rank of this Perk, you may add one additional Modification.'
  },
  {
    name: 'Bloody Mess',
    ranks: 1,
    requirements: { attribute: { LCK: 6 } },
    description: 'Whenever you defeat a Foe, you may roll a d20. If the result is equal to or lower than your Luck Attribute, that Foe explodes and Defeats one nearby Foe with a Threat Rating of 1 or lower.'
  },
  {
    name: 'Butcher',
    ranks: 2,
    requirements: { attribute: { INT: 3 } },
    description: 'Harvest meat from defeated creatures.',
    rankDescriptions: [
      'Rank 1: When you defeat a Creature and kill it, you may gain one Supply Stack of Animal Meat by butchering the corpse.',
      'Rank 2: Any Animal Meat in your Inventory has a Value of 2.'
    ]
  },
  {
    name: 'Can do!',
    ranks: 1,
    requirements: { attribute: { LCK: 5 } },
    description: 'When you fail a test as part of a Scavenge Action, you may instead Try your Luck to re-attempt the test without spending a Luck Point.'
  },
  {
    name: 'Cap Collector',
    ranks: 1,
    requirements: { attribute: { CHA: 5 } },
    description: 'Each time you succeed a test as part of the Scavenge Action, roll a d20; if the result is equal to or lower than your Luck, gain one Stack of Caps.'
  },
  {
    name: 'Cannibal',
    ranks: 3,
    requirements: { attribute: { END: 8 } },
    description: 'Harvest Strange Meat from humanoid corpses.',
    rankDescriptions: [
      'Rank 1: When you defeat a Human and kill it, you may gain one Supply Stack of Strange Meat by butchering the corpse.',
      'Rank 2: When you defeat a Ghoul and kill it, you may gain one Supply Stack of Strange Meat by butchering the corpse.',
      'Rank 3: When you defeat a Super Mutant and kill it, you may gain one Supply Stack of Strange Meat by butchering the corpse.'
    ]
  },
  {
    name: 'Cautious Nature',
    ranks: 1,
    requirements: { attribute: { PER: 7 } },
    description: 'After generating a Combat State, you may spend a Luck Point to replace the result with — Distant Foe: You spotted your enemy well before they spotted you. You may take two Dangerous Actions in a row at the start of the Encounter; a Foe does not get to take a turn between these actions.'
  },
  {
    name: 'Dodger',
    ranks: 1,
    requirements: { attribute: { AGI: 6 } },
    description: 'When you take the Endure Action, you may spend 1 Luck Point to reduce the Difficulty of the test by 1 to a minimum of 1.'
  },
  {
    name: 'Entomologist',
    ranks: 1,
    requirements: { attribute: { INT: 7 } },
    description: 'Reduce the Threat of Insects you encounter by 1 to a minimum of 0.'
  },
  {
    name: 'Fast Metabolism',
    ranks: 1,
    requirements: { attribute: { END: 6 } },
    description: 'Whenever you Heal HP, increase the amount of HP gained by 2.'
  },
  {
    name: 'Finesse',
    ranks: 1,
    requirements: { attribute: { AGI: 9 } },
    description: 'Once per Round before you make an Oppose Action with a Ranged Weapon, you may spend a Luck Point to reduce the Difficulty by 1.'
  },
  {
    name: 'Ghost',
    ranks: 1,
    requirements: { attribute: { PER: 5, AGI: 6 } },
    description: 'Whenever you attempt an AGI (Sneak) test in shadows or darkness, you may re-roll 1d20.'
  },
  {
    name: "Grim Reaper's Sprint",
    ranks: 1,
    requirements: { attribute: { LCK: 8 } },
    description: 'When you Defeat a Foe as the result of an Oppose Action, you may immediately move to another part of the combat. Melee enemies must move toward you before they can strike.'
  },
  {
    name: 'Gun Fu',
    ranks: 1,
    requirements: { attribute: { AGI: 10 } },
    description: 'When you defeat a Foe with a Ranged Weapon, you may spend 1 Luck Point to defeat a second target with equal or lower Threat.'
  },
  {
    name: 'Hit the Deck',
    ranks: 1,
    requirements: { attribute: { STR: 2 } },
    description: 'When you suffer Damage from an explosion, you may spend 1 Luck Point to halve that Damage (rounding down).'
  },
  {
    name: 'Hunter',
    ranks: 1,
    requirements: { attribute: { END: 6 } },
    description: 'Whenever you Travel, gain one [SUPPLY].'
  },
  {
    name: 'Infiltrator',
    ranks: 1,
    requirements: { attribute: { PER: 8 } },
    description: 'Whenever you use the Lockpick Skill, you may re-roll 1d20 in the test.'
  },
  {
    name: 'Iron Fist',
    ranks: 2,
    requirements: { attribute: { STR: 6 } },
    description: 'Your fists are deadly weapons.',
    rankDescriptions: [
      'Rank 1: You may use your Fists as Weapons that cannot be broken.',
      'Rank 2: Reduce the Difficulty of Oppose Skill Tests by 1 when using the Unarmed Skill.'
    ]
  },
  {
    name: 'Life Giver',
    ranks: 1,
    requirements: { attribute: { END: 3 } },
    description: 'Increase your Maximum HP by 3.'
  },
  {
    name: 'Light Step',
    ranks: 1,
    requirements: { attribute: { PER: 3 } },
    description: 'You do not set off tripwires or mines.'
  },
  {
    name: 'Moving Target',
    ranks: 1,
    requirements: { attribute: { AGI: 6 } },
    description: 'When you are not wearing Power Armor and move as part of your Action, reduce the Difficulty of Endure Tests by 1 until the beginning of your next turn.'
  },
  {
    name: 'Mysterious Stranger',
    ranks: 1,
    requirements: { attribute: { LCK: 7 } },
    description: 'From time to time, a Mysterious Stranger comes to your aid, with lethal results. At the start of a combat, you may spend 1 Luck point and choose 2 numbers from 1-20. During that Encounter, if you roll either of those numbers, a Mysterious Stranger appears and immediately defeats one random Foe. Any attempt to find where the Stranger went after their attack Fails.'
  },
  {
    name: 'Night Person',
    ranks: 1,
    requirements: { attribute: { PER: 7 } },
    description: 'You can see as well in the dark as in the light. Suffer no penalties for being in the dark.'
  },
  {
    name: 'Nuclear Physicist',
    ranks: 2,
    requirements: { attribute: { INT: 9 } },
    description: 'Master fusion power.',
    rankDescriptions: [
      'Rank 1: The first time each Round that you roll a complication that would cause you to run out of ammo for an energy weapon, you may ignore it.',
      'Rank 2: You may eject the fusion core from an operable suit of Power Armor you are wearing and detonate it like a grenade. Doing so renders the Power Armor unusable until a new Fusion Core is fitted, but reduces the Difficulty of your next Oppose action by 2.'
    ]
  },
  {
    name: 'Paralyzing Palm',
    ranks: 2,
    requirements: { attribute: { INT: 9 } },
    description: 'When you Oppose a Foe with an Unarmed test and Fail, you may spend 1 Luck Point to temporarily stun them. That Foe cannot Activate in the next Foe turn; if they are the only Foe, you may immediately act again.'
  },
  {
    name: 'Party Boy/Party Girl',
    ranks: 1,
    requirements: { attribute: { END: 6, CHA: 7 } },
    description: 'Whenever you drink an Alcoholic Drink, Heal 2 HP.'
  },
  {
    name: 'Pharma Farma',
    ranks: 1,
    requirements: { attribute: { INT: 7 } },
    description: 'Whenever you generate [LOOT] as part of a Scavenge Action, you may choose to find [CHEMS] instead.'
  },
  {
    name: 'Scrounger',
    ranks: 1,
    requirements: { attribute: { LCK: 6 } },
    description: 'Whenever you generate [LOOT] as part of a Scavenge Action, you may choose to find [SCRAP] instead.'
  },
  {
    name: 'Skilled',
    ranks: Infinity,
    requirements: { attribute: { INT: 6 } },
    description: 'Add +1 rank to two Skills, or +2 ranks to one Skill. No Skill may have more than 6 ranks.'
  },
  {
    name: 'Steady Aim',
    ranks: 1,
    requirements: { attribute: { AGI: 7 } },
    description: 'If you roll no Success during an Oppose action, you may spend 1 Luck Point to re-roll both dice, keeping the new result.'
  }
];

/** Checks whether a character meets a perk's requirements.
 *  `attributes` keys are S.P.E.C.I.A.L. abbreviations. */
export const meetsPerkRequirements = (
  perk: Perk,
  attributes: Partial<Record<Special, number>>,
  level: number
): boolean => {
  if (perk.requirements.level && level < perk.requirements.level) return false;
  if (perk.requirements.attribute) {
    for (const [attr, min] of Object.entries(perk.requirements.attribute)) {
      if ((attributes[attr as Special] ?? 0) < (min ?? 0)) return false;
    }
  }
  return true;
};
