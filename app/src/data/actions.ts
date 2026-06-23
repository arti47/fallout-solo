// Pick-a-Path Actions — complete from Chapter 5 (pg.122-140), structured per
// the book's seven data points: Goal/Difficulty, Solutions, Suggested
// Modifiers, Success, Failure, Additional Success, Potential Complications.

export type ActionCategory = 'safe' | 'dangerous' | 'reaction';

export interface ActionSolution {
  label: string;
  attribute: 'STR' | 'PER' | 'END' | 'CHA' | 'INT' | 'AGI' | 'LCK' | 'Special';
  skill?: string;
}

export interface ActionModifier {
  /** '+' increases Difficulty, '-' decreases it. */
  direction: '+' | '-';
  text: string;
  /** Only applies when using this skill as part of the solution. */
  skill?: string;
}

export interface GameAction {
  name: string;
  category: ActionCategory;
  quote: string;
  /** Base difficulty; null = no Skill Test required; 'special' = variable (see difficultyNote). */
  difficulty: number | null | 'special';
  difficultyNote?: string;
  requirement?: string;
  solutions: ActionSolution[];
  modifiers: ActionModifier[];
  success: string[];
  failure: string[];
  additionalSuccess: string[];
  complications: string[];
}

export const ACTIONS: GameAction[] = [
  // ===================== SAFE ACTIONS =====================
  {
    name: 'Approach',
    category: 'safe',
    quote: 'Throw yourself into danger, sometimes the direct route is the best route.',
    difficulty: 1,
    requirement: 'You must be Safe, and there must be a Foe in your Location.',
    solutions: [
      { label: 'Sneak up on the threat', attribute: 'AGI', skill: 'Sneak' },
      { label: 'Greet the threat', attribute: 'CHA', skill: 'Speech' },
      { label: 'Distract a Creature', attribute: 'END', skill: 'Survival' }
    ],
    modifiers: [
      { direction: '+', text: 'The Foe has improved senses', skill: 'Sneak' },
      { direction: '+', text: 'The Foe has reason to distrust you', skill: 'Speech' },
      { direction: '+', text: 'The Creature is agitated', skill: 'Survival' },
      { direction: '-', text: 'The area has lots of obscuring cover', skill: 'Sneak' },
      { direction: '-', text: 'You are known and trusted in a nearby Settlement', skill: 'Speech' },
      { direction: '-', text: 'You have access to raw meat', skill: 'Survival' }
    ],
    success: [
      'Your situation becomes Dangerous.',
      'The Difficulty of your next Skill Test is reduced by 1.'
    ],
    failure: [
      'Your situation becomes Dangerous.',
      'Your Foes become Hostile; Combat begins.'
    ],
    additionalSuccess: [
      'Defeat a Foe with Threat equal to the number of Action Points spent (Sneak)',
      'One Foe becomes Friendly towards you (Speech)',
      'You notice a route that allows you to bypass the Threats for now (Survival)'
    ],
    complications: [
      'The situation rapidly escalates; a Foe takes a Turn.',
      'The Difficulty of your next Skill Test is increased by 1.',
      'An additional Foe you had failed to notice arrives on the next Turn.'
    ]
  },
  {
    name: 'Clear Main Quest Blocker',
    category: 'safe',
    quote: "One more problem out of the way, hope another doesn't spring out of nowhere!",
    difficulty: null,
    requirement: 'You must have been at the Blocker Location for your Main Quest and be able to say you have Cleared the Blocker (it no longer exists, has been bypassed and cannot obstruct you again, or no longer makes sense in the story).',
    solutions: [],
    modifiers: [],
    success: [
      'The Blocker is removed! Remove it from the Quest and note it in your Journal.',
      'Roll a d20 on the [CLEAR BLOCKER TABLE] and add your character Level to the result.',
      'If a new Blocker is created, gain 1 XP and 2 Luck Points. If no new Blocker is created, you have the opportunity to Complete your Quest.'
    ],
    failure: [],
    additionalSuccess: [],
    complications: []
  },
  {
    name: 'Complete Side Quest',
    category: 'safe',
    quote: 'With hard work and determination, you change the Wasteland, for good or for ill.',
    difficulty: null,
    requirement: 'You must be able to prove you have Cleared one of your Side Quests (the Quest Giver is alive and non-Hostile, and the Goal has been Resolved), and be in the same Location as the Quest Giver.',
    solutions: [],
    modifiers: [],
    success: [
      'Gain the Side Quest Reward.',
      'Learn an [NPC SECRET] about the Quest Giver.',
      'Gain 1 XP.'
    ],
    failure: [],
    additionalSuccess: [],
    complications: []
  },
  {
    name: 'Explore',
    category: 'safe',
    quote: "Explore the location you're in and see what secrets you can uncover.",
    difficulty: 0,
    solutions: [
      { label: 'Explore a Wasteland Location', attribute: 'END', skill: 'Survival' },
      { label: 'Explore a Settlement Location', attribute: 'CHA', skill: 'Speech' }
    ],
    modifiers: [
      { direction: '+', text: 'Each Truth the Location already has' },
      { direction: '+', text: 'The Location is overtly hostile' },
      { direction: '-', text: 'The area is safe' }
    ],
    success: [
      'If the Location is a Wasteland, generate a new [WASTELAND TRUTH] for it — OR — if a Settlement, generate a new [SETTLEMENT TRUTH] for it.'
    ],
    failure: [
      'Spend 1 Supply or Suffer 1 Damage as you become lost.'
    ],
    additionalSuccess: [
      'Discover an additional [SETTLEMENT TRUTH] or [WASTELAND TRUTH].',
      'Meet a new [NPC].',
      'Discover a new [ICON].'
    ],
    complications: [
      'Generate a [CREATURE] Encounter if in the Wasteland.',
      'If in a Settlement, generate a [DANGEROUS NPC] Encounter.'
    ]
  },
  {
    name: 'Meet',
    category: 'safe',
    quote: 'Make a connection, catch up with a friend.',
    difficulty: 1,
    requirement: 'Your current Location must have an NPC in it that you are not performing a Quest for.',
    solutions: [
      { label: 'Talk to an NPC', attribute: 'CHA', skill: 'Speech' },
      { label: 'Encourage an NPC', attribute: 'CHA', skill: 'Barter' }
    ],
    modifiers: [
      { direction: '+', text: "The NPC doesn't trust you" },
      { direction: '-', text: 'The NPC is friendly to you' },
      { direction: '-', text: 'You spend a Stack of Caps on the NPC' }
    ],
    success: [
      "Learn the NPC's [SECRET] and generate a [SIDE QUEST] they give you."
    ],
    failure: [
      'The NPC becomes distrustful of you and refuses your company.'
    ],
    additionalSuccess: [
      'Discover an additional [SECRET] about the NPC.',
      'The NPC becomes a Friend.',
      'Add an additional [REWARD] for the Side Quest.'
    ],
    complications: [
      'The NPC takes a dislike to you and becomes a [DANGEROUS NPC].',
      "The NPC's Side Quest gains an additional [BLOCKER]."
    ]
  },
  {
    name: 'Rest',
    category: 'safe',
    quote: 'Take a moment, breathe. And if you could stop bleeding, that would be a help.',
    difficulty: null,
    solutions: [],
    modifiers: [],
    success: [
      'If you are in a Wasteland Location, expend any number of Supplies and Heal an equal amount of HP.',
      'If you are in a Settlement Location, expend either any number of Supplies or Stacks of Caps, and Heal an equal amount of HP.'
    ],
    failure: [],
    additionalSuccess: [],
    complications: []
  },
  {
    name: 'Patch Up',
    category: 'safe',
    quote: "Most medications are actually very easy to use. It's mostly just knowing which one is right for which problem.",
    difficulty: 2,
    requirement: 'You must have less HP than your maximum value or be suffering from an Injury.',
    solutions: [
      { label: 'Patch yourself up', attribute: 'INT', skill: 'Medicine' },
      { label: 'Pay a Doctor (Settlement only): spend a Stack of Caps to automatically succeed — no AP may be spent for Additional Successes', attribute: 'Special' }
    ],
    modifiers: [
      { direction: '+', text: 'You have multiple injuries' },
      { direction: '-', text: 'You spend a suitable resource (Stimpaks, Bandages, etc.)' }
    ],
    success: [
      'Remove an Injury — OR — Heal 4 HP.'
    ],
    failure: [
      'Lose 1 HP.'
    ],
    additionalSuccess: [
      'Heal 1 additional HP.',
      'Heal an additional Injury.'
    ],
    complications: [
      'Lose 1 HP.',
      'Lose a Medical Item or Chem from your Inventory.',
      "You're met by [FOES]: after your Skill Test, generate a Foe encounter."
    ]
  },
  {
    name: 'Level Up',
    category: 'safe',
    quote: 'Learn something new, and grow into yourself.',
    difficulty: null,
    requirement: 'You must have at least 1 XP.',
    solutions: [],
    modifiers: [],
    success: [
      'Spend any amount of XP and gain an equal number of Perks, adding them to your Character Tab.',
      'After listing your acquired Perks, increase your Level by the number of XP spent.'
    ],
    failure: [],
    additionalSuccess: [],
    complications: []
  },
  {
    name: 'Find Supplies',
    category: 'safe',
    quote: 'Scavenge and barter, whatever you need to do for clean water and passable food.',
    difficulty: 1,
    solutions: [
      { label: 'Search for Supplies in the Wasteland', attribute: 'END', skill: 'Survival' },
      { label: 'Barter with locals', attribute: 'CHA', skill: 'Barter' }
    ],
    modifiers: [
      { direction: '+', text: 'The location is short on naturally occurring food or water' },
      { direction: '+', text: 'The location is badly irradiated', skill: 'Survival' },
      { direction: '+', text: 'You have a bad reputation with the locals', skill: 'Barter' },
      { direction: '-', text: 'The location has an abundance of naturally occurring food or water' },
      { direction: '-', text: 'You have a good reputation with the locals', skill: 'Barter' },
      { direction: '-', text: 'You expend a Stack of Caps', skill: 'Barter' }
    ],
    success: [
      'You obtain a [QUANTITY] of [SUPPLIES].'
    ],
    failure: [
      'You obtain no Supplies.'
    ],
    additionalSuccess: [
      'Generate 1 additional Supply.'
    ],
    complications: [
      '1 of your Supplies is spoiled; reduce the number received by 1.',
      'Your Supplies are coveted by another! Generate a [FOE] interested in getting hold of your Supplies.'
    ]
  },
  {
    name: 'Modify and Repair Gear',
    category: 'safe',
    quote: 'A good workman can also blame their tools.',
    difficulty: 3,
    requirement: 'Choose an Item you wish to Modify or remove a Condition from; then either remove an item as Scrap from your Inventory or spend three Stacks of Caps. You cannot Modify or remove Conditions from items that cannot gain Conditions.',
    solutions: [
      { label: 'Use your know-how', attribute: 'INT', skill: 'Repair' },
      { label: 'Pay an Expert (Settlement with a skilled mechanic/gunsmith): spend three Stacks of Caps to automatically succeed — no AP may be spent for Additional Successes', attribute: 'Special' }
    ],
    modifiers: [
      { direction: '+', text: 'The chosen item has the Broken condition' },
      { direction: '+', text: 'The chosen item has already been modified' },
      { direction: '-', text: 'You expend a suitable resource to modify the chosen item' },
      { direction: '-', text: 'You expend an item of the same type as the chosen item' },
      { direction: '-', text: 'You have access to a Workbench' }
    ],
    success: [
      'Choose a [MODIFICATION] for the chosen item to apply — OR — roll a [CONDITION] for the chosen item; you may replace the item\'s condition with the new one — OR — remove a condition from the chosen item.'
    ],
    failure: [
      'The item gains the Broken condition. If it already has the Broken condition, it is destroyed; remove it from your Inventory.'
    ],
    additionalSuccess: [
      'If rolling a new [CONDITION], roll twice and pick one to gain.',
      'You gain Scrap that can be used to make this Action again on a similar item.'
    ],
    complications: [
      'You must spend an additional item, or the Action is Failed.',
      'If making a modification in a Settlement, a [DANGEROUS NPC] approaches and tries to steal the modified item.'
    ]
  },
  {
    name: 'Scavenge',
    category: 'safe',
    quote: 'Finding loot in the wasteland is the key to survival.',
    difficulty: 1,
    requirement: 'You must be in a Wasteland Location or a Hostile Settlement. You may only Scavenge once per Round.',
    solutions: [
      { label: 'Search the Location', attribute: 'PER', skill: 'Survival' },
      { label: 'Open a Safe', attribute: 'PER', skill: 'Lockpick' },
      { label: 'Hack a Terminal-protected cache', attribute: 'INT', skill: 'Science' }
    ],
    modifiers: [
      { direction: '+', text: 'You have used the Scavenge Action in this Location before' },
      { direction: '-', text: 'You defeated a Foe in this Location this Round' },
      { direction: '-', text: 'You spend a Bobby Pin', skill: 'Lockpick' },
      { direction: '-', text: 'You use a dose of Mentats', skill: 'Science' }
    ],
    success: [
      'Roll [LOOT] twice — OR — choose a piece of [LOOT].'
    ],
    failure: [
      'You find [LOOT] protected by a [FOE]. Generate a [COMBAT STATE] to determine if you are in Danger.'
    ],
    additionalSuccess: [
      'Find an additional piece of [LOOT].'
    ],
    complications: [
      'After Scavenging, you are Ambushed by a [FOE].',
      'The Loot is booby-trapped! Suffer 1 Damage.'
    ]
  },
  {
    name: 'Trade',
    category: 'safe',
    quote: 'Caps make the Wasteland go round.',
    difficulty: 2,
    requirement: 'You must be in a Settlement or appropriate Encounter. Roll [LOOT] three times (re-rolling any results of Caps) — either on random item types or specific types if the trader only sells those wares. Pick any item you would like to Trade for and perform the Skill Test.',
    solutions: [
      { label: 'Barter with what you have', attribute: 'CHA', skill: 'Barter' }
    ],
    modifiers: [
      { direction: '+', text: 'The Trader distrusts you' },
      { direction: '+', text: 'One or more Item(s) is in particularly good Condition' },
      { direction: '+', text: 'You have already Traded this Round' },
      { direction: '-', text: 'The Trader is friendly or allied with you' }
    ],
    success: [
      'You may spend a Stack of Caps per Item you wish to Trade, plus one additional Stack for each positive Condition or Modification the Item has. You may also spend two of your Items instead of a Stack of Caps. Add the Traded Item to your Inventory.',
      '— OR — Trade an Item in your Inventory for a Stack of Caps.'
    ],
    failure: [
      'You may spend two Stacks of Caps per Item you wish to Trade, plus one additional Stack for each positive Condition or Modification the Item has. You may also spend three of your Items instead of a Stack of Caps. Add the Traded Item to your Inventory.',
      '— OR — Trade two Items in your Inventory for a Stack of Caps.'
    ],
    additionalSuccess: [
      'You may Trade one Item instead of two instead of a Stack of Caps.',
      'You may Trade an Item in your Inventory for two Stacks of Caps.',
      'The Trader becomes friendly.'
    ],
    complications: [
      'The Trader refuses to sell an Item, but offers it as the Reward for a [SIDE QUEST].',
      'The Trader becomes distrustful of you.'
    ]
  },

  // ===================== DANGEROUS ACTIONS =====================
  {
    name: 'Outwit',
    category: 'dangerous',
    quote: 'Your greatest weapon is your mind.',
    difficulty: 2,
    requirement: 'You must have a plan that creatively uses at least one of: the environment, your Foe\'s disposition, the current Combat State, or a piece of equipment. Outline your plan, what you hope to achieve, and what is at risk if it goes wrong.',
    solutions: [
      { label: 'Trick Foes into attacking each other', attribute: 'CHA', skill: 'Speech' },
      { label: 'Knock a Foe into a pit', attribute: 'STR', skill: 'Athletics' },
      { label: 'Hack a terminal to gain control of a Turret', attribute: 'INT', skill: 'Science' },
      { label: 'Shoot a pipe to release super-heated steam', attribute: 'AGI', skill: 'Small Guns' },
      { label: 'Any other creative solution', attribute: 'Special' }
    ],
    modifiers: [
      { direction: '+', text: 'You are outnumbered' },
      { direction: '+', text: 'Your Foe is familiar with you' },
      { direction: '-', text: "You haven't used the Outwit Action on this Foe" },
      { direction: '-', text: 'You outnumber your Foe' }
    ],
    success: [
      'You achieve the Goal you have set yourself. This may cause: you Defeat a Foe; reduce the Difficulty of your next Skill Test by 1; gain [LOOT]; you may use a Safe Action in your next Turn.'
    ],
    failure: [
      'You fail to achieve your Goal. This may cause: two Foes to Activate next Turn; losing the item you were using to attempt the Action; you suffer Damage from a Foe\'s attack; you lose an Ally.'
    ],
    additionalSuccess: [
      'Your Foes are surprised! Take an additional Turn.',
      'Create a new [COMBAT STATE] of your choice.'
    ],
    complications: [
      'You suffer 1 Damage during the attempt.',
      'The [COMBAT STATE] changes.'
    ]
  },
  {
    name: 'De-escalate',
    category: 'dangerous',
    quote: 'Sometimes a word will do where a bullet does not.',
    difficulty: 2,
    requirement: 'You must be in the same Location as a Foe that presents a threat.',
    solutions: [
      { label: 'Tame a Creature', attribute: 'CHA', skill: 'Speech' },
      { label: 'Talk down a dangerous situation', attribute: 'STR', skill: 'Athletics' },
      { label: 'Buy your way out', attribute: 'CHA', skill: 'Barter' },
      { label: 'Scare your Foes', attribute: 'STR', skill: 'Speech' }
    ],
    modifiers: [
      { direction: '+', text: 'You are outnumbered' },
      { direction: '+', text: 'The Foe has a reason to hate you' },
      { direction: '-', text: 'You make yourself less threatening' },
      { direction: '-', text: 'You outclass your foe' },
      { direction: '-', text: 'You spend a Stack of Caps', skill: 'Barter' }
    ],
    success: [
      'You de-escalate the situation and cause the encounter to become Safe. The Foe becomes Unfriendly to you, but not Hostile.'
    ],
    failure: [
      'Two Foes take an Action next turn.'
    ],
    additionalSuccess: [
      'One non-Creature Foe becomes an [NPC].',
      'The Foe becomes Neutral to you.',
      'If there is an [NPC] Foe, they become a Quest Giver with a [SIDE QUEST].'
    ],
    complications: [
      'The [COMBAT STATE] changes.',
      'The Foe mocks your attempts; if you later Retreat, the nearest Settlement hears stories that paint you as a coward.'
    ]
  },
  {
    name: 'Oppose',
    category: 'dangerous',
    quote: 'Take aim and fire upon the enemy, or take up your ripper and tear their throat out.',
    difficulty: 'special',
    difficultyNote: "The Difficulty is set to match the target Foe's Threat Value.",
    solutions: [
      { label: 'Use a Thrown Weapon', attribute: 'AGI', skill: 'Throwing' },
      { label: 'Use a Ranged Weapon (Small Guns)', attribute: 'AGI', skill: 'Small Guns' },
      { label: 'Use a Ranged Weapon (Energy Weapons)', attribute: 'PER', skill: 'Energy Weapons' },
      { label: 'Use a Ranged Weapon (Big Guns)', attribute: 'END', skill: 'Big Guns' },
      { label: 'Use a Melee Weapon', attribute: 'STR', skill: 'Melee Weapons' },
      { label: 'Fight Unarmed', attribute: 'STR', skill: 'Unarmed' }
    ],
    modifiers: [
      { direction: '+', text: 'Your target is within Reach', skill: 'Small Guns' },
      { direction: '+', text: 'Your target is in cover or protected in some way' },
      { direction: '+', text: 'You are surrounded or outnumbered', skill: 'Melee Weapons' },
      { direction: '-', text: "You don't Move this Turn to aim" },
      { direction: '-', text: 'You have an ally fighting with you' },
      { direction: '-', text: 'Your Foe is Injured' }
    ],
    success: [
      'You Defeat the Target Foe.'
    ],
    failure: [
      'Reduce the Threat of the Foe by 1, to a minimum of 1.'
    ],
    additionalSuccess: [
      'Reduce the Threat of one Foe Close to your Target by 1 (to a minimum of 1).',
      'Gain a [COMBAT STATE].',
      'You choose which Foe acts next.',
      'If using an Explosive Weapon, Defeat X additional Foes with lower Threat than the original target, where X is the number of Action Points spent.'
    ],
    complications: [
      'A Foe gets a free Turn.',
      'Your weapon runs out of ammunition and needs to be reloaded next Turn.',
      'Your weapon breaks or gains a new negative Truth.',
      'A Foe gains a new [COMBAT STATE].'
    ]
  },
  {
    name: 'Slaughter',
    category: 'dangerous',
    quote: 'Sometimes, the only answer is unending, wanton violence.',
    difficulty: 'special',
    difficultyNote: 'X equals the highest Threat level among foes, +1 per Foe. Use this to deal with large groups, group up a section of a larger fight, or finish off weaker foes.',
    solutions: [
      { label: 'Use Throwing Weapons', attribute: 'AGI', skill: 'Throwing' },
      { label: 'Use Explosives', attribute: 'PER', skill: 'Explosives' },
      { label: 'Use Ranged Weapons (Small Guns)', attribute: 'AGI', skill: 'Small Guns' },
      { label: 'Use Ranged Weapons (Energy Weapons)', attribute: 'PER', skill: 'Energy Weapons' },
      { label: 'Use Ranged Weapons (Big Guns)', attribute: 'END', skill: 'Big Guns' },
      { label: 'Use Melee Weapons', attribute: 'STR', skill: 'Melee Weapons' },
      { label: 'Fight Unarmed', attribute: 'STR', skill: 'Unarmed' }
    ],
    modifiers: [
      { direction: '+', text: 'The Foe has a major tactical advantage' },
      { direction: '+', text: 'The Foes outnumber you by 3-to-1' },
      { direction: '-', text: 'You have a major tactical advantage' },
      { direction: '-', text: 'You have an ally fighting with you' }
    ],
    success: [
      'You Defeat all your Foes.'
    ],
    failure: [
      'Suffer Damage equal to the amount you failed the test by (e.g. if the test was difficulty 5 and you rolled 2 successes, suffer 3 Damage).'
    ],
    additionalSuccess: [
      'A Foe drops a piece of [LOOT].'
    ],
    complications: [
      'Your weapon gains the Broken Condition.',
      'You run out of ammunition with your weapons.'
    ]
  },
  {
    name: 'Retreat',
    category: 'dangerous',
    quote: "When things seem against you, it's time to hightail it out of danger.",
    difficulty: 'special',
    difficultyNote: 'The Difficulty equals the number of Foes in your Location.',
    solutions: [
      { label: 'Sneak away', attribute: 'AGI', skill: 'Sneak' },
      { label: 'Run away', attribute: 'STR', skill: 'Athletics' }
    ],
    modifiers: [
      { direction: '+', text: 'The area is difficult to traverse for you' },
      { direction: '+', text: 'One or more foes is particularly mobile' },
      { direction: '-', text: 'The area is difficult to traverse for your foes' },
      { direction: '-', text: 'There is a useful distraction' }
    ],
    success: [
      'You end the Encounter and Travel to an adjacent Explored Location.',
      'Immediately end the Round and Journal what has happened.'
    ],
    failure: [
      'All Foes take an Action. If you are alive, you then succeed in the test.'
    ],
    additionalSuccess: [
      'You regain 1 HP.'
    ],
    complications: [
      'One Foe follows you into the Location.'
    ]
  },

  // ===================== REACTIONS =====================
  {
    name: 'Endure',
    category: 'reaction',
    quote: 'Grit your teeth and soldier on.',
    difficulty: 'special',
    difficultyNote: 'Trigger: Suffering Damage. The Difficulty equals the Damage suffered. A Reaction can be taken once per Turn in reaction to its trigger.',
    solutions: [
      { label: 'Roll with the blast', attribute: 'END', skill: 'Explosives' },
      { label: 'Roll with the hit', attribute: 'END', skill: 'Athletics' },
      { label: 'Avoid gunfire', attribute: 'AGI', skill: 'Athletics' },
      { label: 'Parry the attack', attribute: 'AGI', skill: 'Melee Weapons' }
    ],
    modifiers: [
      { direction: '+', text: "You're Injured" },
      { direction: '+', text: "You're not wearing any Armor" },
      { direction: '-', text: 'You are wearing Heavy or Powered Armor' },
      { direction: '-', text: 'You have cover from a Ranged Attack' }
    ],
    success: [
      'You suffer 1 Damage instead of the triggering Damage.',
      'If you are wearing Heavy Armor, you cannot be reduced to 0 HP by the above Damage.',
      '— OR — If you are wearing Power Armor, you suffer 0 Damage instead of the triggering Damage.'
    ],
    failure: [
      'Suffer the triggering Damage.',
      'If you are reduced to 0 HP after making this Reaction, suffer an [INJURY], and Heal half (rounding up) of your maximum HP.'
    ],
    additionalSuccess: [],
    complications: [
      'Gain an [INJURY].',
      'Your worn armor is damaged, gaining a new Truth to represent that.'
    ]
  }
];

export const getAction = (name: string): GameAction | undefined =>
  ACTIONS.find(a => a.name === name);

export const SAFE_ACTIONS = ACTIONS.filter(a => a.category === 'safe');
export const DANGEROUS_ACTIONS = ACTIONS.filter(a => a.category === 'dangerous');
export const REACTIONS = ACTIONS.filter(a => a.category === 'reaction');
