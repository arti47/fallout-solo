// Appendix 3: Foe Stat Blocks — complete bestiary from the rulebook (pg.219-246).
// Every foe, threat value, action range, damage value, and special ability matches the book.

export interface FoeAction {
  type: 'Aggressive' | 'Cautious' | 'Crafty';
  range: [number, number]; // d20 range, e.g. 1-13
  description: string;
  damage?: number;
  damageType?: 'Physical' | 'Energy' | 'Radiation' | 'Explosive';
  specialEffect?: string;
}

export interface FoeSpecialAbility {
  name: string;
  description: string;
}

/** Some foes carry different weapons or have different jobs (Super Mutant, Brute,
 *  Protectron, Turret, Raider). Each variant swaps in its own action set. */
export interface FoeVariant {
  name: string;
  actions: FoeAction[];
}

export type FoeCategory =
  | 'Creature'
  | 'Super Mutant'
  | 'Feral Ghoul'
  | 'Robot'
  | 'Raider'
  | 'Institute'
  | 'Brotherhood of Steel'
  | 'Zetan';

export interface FoeTemplate {
  name: string;
  /** Kept as a loose string for backwards compatibility; matches FoeCategory. */
  type: string;
  category: FoeCategory;
  threat: number;
  background: string;
  actions: FoeAction[];
  variants?: FoeVariant[];
  specialAbilities: FoeSpecialAbility[];
  /** Derived display strings ("Name: description") for existing UI. */
  specialRules: string[];
}

type FoeInput = Omit<FoeTemplate, 'specialRules' | 'type'>;

const foe = (f: FoeInput): FoeTemplate => ({
  ...f,
  type: f.category,
  specialRules: f.specialAbilities.map(a => `${a.name}: ${a.description}`)
});

// Shared ability text
const FLIGHT = (n: string): FoeSpecialAbility => ({ name: 'Flight', description: `The ${n} can fly, is unimpeded by harsh terrain, and can easily move over obstacles.` });
const SMALL = (n: string): FoeSpecialAbility => ({ name: 'Small', description: `The ${n} is small and hard to hit; the difficulty to Oppose it with a Ranged Weapon is increased by 1.` });
const IMMUNITY = (n: string, types: string): FoeSpecialAbility => ({ name: `Immunity (${types})`, description: `The ${n} cannot be negatively affected by the sources listed in its Immunity types.` });
const BURROWER = (n: string): FoeSpecialAbility => ({ name: 'Burrower', description: `The ${n} can burrow underground. When it does, it cannot be Opposed by non-explosive weapons, and all Skill tests to locate it or Oppose it increase in difficulty by 2.` });
const AQUATIC = (n: string): FoeSpecialAbility => ({ name: 'Aquatic', description: `The ${n} is aquatic and can breathe and move underwater without being impeded.` });
const FERAL = (n: string): FoeSpecialAbility => ({ name: 'Feral', description: `This ${n} is unintelligent and driven purely by hunger. You cannot use the De-Escalate action on it.` });
const ROBOT_IMMUNITY = (n: string) => IMMUNITY(n, 'Radiation, Poison, Disease, Starvation, Suffocation, Thirst, Fear');
const IMMOVEABLE_ORDERS = (n: string): FoeSpecialAbility => ({ name: 'Immoveable Orders', description: `The ${n} follows orders without question. You cannot use the De-Escalate action on it.` });
const SWORD_THAT_CUTS = (n: string): FoeSpecialAbility => ({ name: 'The Sword that Cuts', description: `${n}s deal an additional 1 damage to Mutated Foes (i.e., Wasteland Creatures, Super Mutants, Ghouls, etc.)` });

export const BESTIARY: FoeTemplate[] = [
  // ============ CREATURES (pg.219-225) ============
  foe({
    name: 'Bloatfly',
    category: 'Creature',
    threat: 1,
    background: 'Bloatflies launch their spiked larvae from their abdomens. They usually keep their distance, but will close in if they sense food.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'The Bloatfly bobs as it drifts forward and fires its larvae dart.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [13, 17], description: 'The Bloatfly slowly repositions itself to a better angle.' },
      { type: 'Crafty', range: [18, 20], description: 'The Bloatfly drifts upwards. It cannot be Opposed by Melee Weapons until its next Action.', specialEffect: 'Cannot be Opposed by Melee Weapons until its next Action' }
    ],
    specialAbilities: [
      FLIGHT('Bloatfly'),
      SMALL('Bloatfly'),
      { name: 'Vector of Infection', description: 'Bloatflies are carriers of infection. Make an END Test with a difficulty of 1 at the end of any Scene in which you took Damage from them. On a Failure you gain the Diseased Injury.' },
      IMMUNITY('Bloatfly', 'Radiation, Poison')
    ]
  }),
  foe({
    name: 'Bloodbug',
    category: 'Creature',
    threat: 1,
    background: 'Often found covering corpses, Bloodbugs spit irradiated blood if their blood sac is full or pierce their victims with their proboscis if not. Quick and difficult to target, in numbers they can provide a significant challenge.',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'If its blood sac is full, it spits radioactive blood (2 Radiation Damage). If empty, the Bloodbug flies toward you and sucks your blood (1 Damage; its sac is now full).', damage: 1, damageType: 'Physical', specialEffect: 'Full sac: 2 Radiation Damage instead. Empty sac: 1 Damage and the sac becomes full.' },
      { type: 'Cautious', range: [11, 18], description: 'The Bloodbug flies high out of reach to get a better view of its prey. It cannot be Opposed by Melee Weapons until its next action.', specialEffect: 'Cannot be Opposed by Melee Weapons until its next action' },
      { type: 'Crafty', range: [19, 20], description: 'If its blood sac is full, it flees! If empty, the Bloodbug flies toward you to suck your blood (1 Damage; the sac is now full).', specialEffect: 'Full sac: flees. Empty sac: 1 Damage and the sac becomes full.' }
    ],
    specialAbilities: [
      FLIGHT('Bloodbug'),
      SMALL('Bloodbug'),
      IMMUNITY('Bloodbug', 'Radiation, Poison'),
      { name: 'Blood Sucker', description: 'If the Bloodbug deals Damage to a living thing, it drains their blood and fills its Blood Sac. Otherwise, its Blood Sac is empty.' }
    ]
  }),
  foe({
    name: 'Deathclaw',
    category: 'Creature',
    threat: 5,
    background: 'Deathclaws are extremely intelligent foes, making use of surrounding terrain and fighting tactically. They rip into their foes using brutal claws and hurl rocks or other heavy objects to target more distant foes.',
    actions: [
      { type: 'Aggressive', range: [1, 16], description: 'The Deathclaw tears at you with its claws (5 Damage) — OR — throws a massive object (2 Damage).', damage: 5, damageType: 'Physical', specialEffect: 'At range: throws a massive object for 2 Damage instead' },
      { type: 'Cautious', range: [17, 18], description: 'The Deathclaw bodily leaps next to you, breathing down your neck.' },
      { type: 'Crafty', range: [19, 20], description: 'The Deathclaw roars into the air. The difficulty of your next Skill Test is increased by 2. All creatures with a lower Threat than the Deathclaw flee the Encounter.', specialEffect: '+2 Difficulty to your next Skill Test; lower-Threat creatures flee' }
    ],
    specialAbilities: [IMMUNITY('Deathclaw', 'Radiation, Poison')]
  }),
  foe({
    name: 'Dog',
    category: 'Creature',
    threat: 1,
    background: "Fiercely loyal, truly humanity's best friend. Tame dogs will obey their owner's commands and protect them at all costs, while feral dogs will work together to tear their prey apart.",
    actions: [
      { type: 'Aggressive', range: [1, 8], description: "The Dog's jaw locks on your arm — you cannot use two-handed weapons until it is defeated (1 Damage) — OR — its jaw locks on your leg — you cannot move until it is defeated (1 Damage).", damage: 1, damageType: 'Physical', specialEffect: 'Locks on: arm (no two-handed weapons) or leg (no movement) until defeated' },
      { type: 'Cautious', range: [9, 14], description: 'The Dog moves to protect its pack or master.' },
      { type: 'Crafty', range: [15, 20], description: 'The Dog barks out a warning. Add another Dog to the scene.', specialEffect: 'Spawn 1 Dog' }
    ],
    specialAbilities: []
  }),
  foe({
    name: 'Molerat',
    category: 'Creature',
    threat: 1,
    background: 'Found in groups anywhere they can nest, Molerats are a common sight. They will burrow to avoid enemies and attack from behind while their prey is preoccupied.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'The Molerat leaps into the air, trying to bite at soft spots. If the Molerat was burrowing, it is now unburrowed.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [13, 20], description: 'The Molerat burrows underground. If already burrowed, it moves toward you under the ground.', specialEffect: 'Burrows (cannot be Opposed by non-explosive weapons; +2 difficulty to locate)' }
    ],
    specialAbilities: [IMMUNITY('Molerat', 'Radiation'), BURROWER('Molerat')]
  }),
  foe({
    name: 'Radroach',
    category: 'Creature',
    threat: 1,
    background: 'Highly territorial and always found in numbers, Radroaches will launch themselves at foes many times their size if they feel their nest is threatened.',
    actions: [
      { type: 'Aggressive', range: [1, 8], description: 'Fluttering into the air, the Radroach attempts to bite you with its mandibles before scuttling back.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [9, 18], description: 'The Radroach finds safety in numbers. Add another Radroach to the Scene with this one.', specialEffect: 'Spawn 1 Radroach' },
      { type: 'Crafty', range: [19, 20], description: 'Even Radroaches sometimes know when to run and hide. All Radroaches in the location flee!', specialEffect: 'All Radroaches flee' }
    ],
    specialAbilities: [SMALL('Radroach'), IMMUNITY('Radroach', 'Radiation, Poison')]
  }),
  foe({
    name: 'Radscorpion',
    category: 'Creature',
    threat: 3,
    background: 'Radscorpions can take down even the most fearsome of prey. With a powerful sting, formidable claws, animalistic cunning, and ambush skills, these insects are aggressive, intelligent, and deadly.',
    actions: [
      { type: 'Aggressive', range: [1, 14], description: 'If underground, it bursts up from below right next to you (2 Damage) — OR — it grasps you with its powerful claws (3 Damage). Until the Radscorpion is defeated, you cannot Retreat or move away.', damage: 3, damageType: 'Physical', specialEffect: 'From underground: 2 Damage. Grabbed: cannot Retreat or move away until it is defeated.' },
      { type: 'Cautious', range: [15, 16], description: 'The Radscorpion scuttles forward — OR — if you are grabbed, it strikes at you with its stinger (1 Damage). Gain the Poisoned Truth.', damage: 1, damageType: 'Physical', specialEffect: 'If grabbed: 1 Damage and you gain the Poisoned Truth' },
      { type: 'Crafty', range: [17, 20], description: 'The Radscorpion burrows underground. It cannot be attacked, but if it is the only Foe in the combat, you may automatically Retreat.', specialEffect: 'Burrows; auto-Retreat allowed if it is the only Foe' }
    ],
    specialAbilities: [IMMUNITY('Radscorpion', 'Radiation, Poison'), BURROWER('Radscorpion')]
  }),
  foe({
    name: 'Stingwing',
    category: 'Creature',
    threat: 2,
    background: 'Found swarming around their nests, Stingwings will divebomb any intruders in an attempt to drive them off before melding back into the swarm.',
    actions: [
      { type: 'Aggressive', range: [1, 7], description: 'The Stingwing flies toward you and makes an attack!', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [8, 14], description: 'The Stingwing zips overhead; it cannot be Opposed by Melee Weapons until its next action.', specialEffect: 'Cannot be Opposed by Melee Weapons until its next action' },
      { type: 'Crafty', range: [15, 20], description: 'The Stingwing strikes at you with its stinger before flying away at incredible speed.', damage: 1, damageType: 'Physical' }
    ],
    specialAbilities: [FLIGHT('Stingwing'), SMALL('Stingwing'), IMMUNITY('Stingwing', 'Radiation, Poison')]
  }),
  foe({
    name: 'Yao Guai',
    category: 'Creature',
    threat: 3,
    background: 'Immense strength combined with razor-sharp claws and teeth make Yao Guai formidable creatures. Their blows are strong enough to stagger any opponent. A charge from one of these beasts is something to remember. Briefly, at least.',
    actions: [
      { type: 'Aggressive', range: [1, 14], description: 'The Yao Guai barrels forward and bats at you with powerful claws, leaving deep scratches in the earth.', damage: 3, damageType: 'Physical' },
      { type: 'Cautious', range: [15, 18], description: 'The Yao Guai rears back and lets out a roar, alerting any nearby creatures to its presence. Small animals run and flee. More bold creatures may come to check out what is happening.' },
      { type: 'Crafty', range: [19, 20], description: 'The Yao Guai tears at you with its teeth (2 Damage). If you are wearing armor, it becomes Damaged.', damage: 2, damageType: 'Physical', specialEffect: 'Worn armor becomes Damaged' }
    ],
    specialAbilities: [IMMUNITY('Yao Guai', 'Radiation')]
  }),
  foe({
    name: 'Mirelurk Hatchling',
    category: 'Creature',
    threat: 1,
    background: 'Newly hatched and vulnerable, these Mirelurks swarm from their broken eggs towards the nearest food source, flinging themselves towards it with reckless abandon.',
    actions: [
      { type: 'Aggressive', range: [1, 8], description: 'The Hatchling climbs over you, sinking its razor-sharp teeth into the gaps in your Armor (1 Damage). If there are other Hatchlings that have not yet acted, they automatically take this action.', damage: 1, damageType: 'Physical', specialEffect: 'All other Hatchlings that have not acted automatically take this action' },
      { type: 'Cautious', range: [9, 13], description: 'The Mirelurk Hatchling moves towards other Hatchlings and attempts to group together.' },
      { type: 'Crafty', range: [14, 20], description: 'The Hatchling eats some of your food, spoiling it. Remove one Stack of Supplies.', specialEffect: 'Lose 1 Stack of Supplies' }
    ],
    specialAbilities: [SMALL('Mirelurk Hatchling'), IMMUNITY('Mirelurk Hatchling', 'Radiation'), AQUATIC('Mirelurk Hatchling')]
  }),
  foe({
    name: 'Mirelurk',
    category: 'Creature',
    threat: 2,
    background: 'Lurking underwater or buried in the mud near their nests, Mirelurks burst out of the ground to confront anything that gets too close. They rush into combat before rearing back to rip and tear with their formidable claws.',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'The Mirelurk rushes in to attack with its meaty claws.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [11, 18], description: 'The Mirelurk scuttles about, slowly drifting closer.' },
      { type: 'Crafty', range: [19, 20], description: 'The Mirelurk hunkers down, protecting its vulnerable face. All Oppose checks against the Mirelurk are at +1 Difficulty until it next deals Damage.', specialEffect: '+1 Difficulty to Oppose it until it next deals Damage' }
    ],
    specialAbilities: [IMMUNITY('Mirelurk', 'Radiation'), AQUATIC('Mirelurk')]
  }),
  foe({
    name: 'Mirelurk Hunter',
    category: 'Creature',
    threat: 3,
    background: "This is a fearsome foe, spitting acid from a distance and ripping with its powerful claws up close. Once the Mirelurk Hunter has your scent, it won't stop until one of you is dead.",
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'The Mirelurk Hunter spits acid from a distance.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [14, 16], description: 'The Mirelurk Hunter rushes forward, its head down. Increase the difficulty of Opposing the Mirelurk by 1 until it next attacks.', specialEffect: '+1 Difficulty to Oppose it until it next attacks' },
      { type: 'Crafty', range: [17, 20], description: 'The Mirelurk Hunter rams you with a chitinous horn (2 Damage). If you are wearing armor, it becomes Damaged.', damage: 2, damageType: 'Physical', specialEffect: 'Worn armor becomes Damaged' }
    ],
    specialAbilities: [IMMUNITY('Mirelurk Hunter', 'Radiation'), AQUATIC('Mirelurk Hunter')]
  }),
  foe({
    name: 'Mirelurk Queen',
    category: 'Creature',
    threat: 5,
    background: 'The Mirelurk Queen lurks below water, strangely stealthy for its size. The Queen is aggressive, favoring its claws over its acidic spit if given the opportunity.',
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'Spits acid from a distance (3 Damage) — OR — slashes with crushing claws (5 Damage). If you suffer Damage, pass a difficulty 1 END (Athletics) Skill Test or suffer +1 difficulty to your next Skill Test.', damage: 5, damageType: 'Physical', specialEffect: 'At range: 3 Damage acid. On Damage: END (Athletics) diff 1 test or +1 difficulty to your next Skill Test.' },
      { type: 'Cautious', range: [14, 17], description: 'The Mirelurk Queen hunkers down, protecting its vulnerable face. All Oppose checks against the Mirelurk Queen are at +2 Difficulty until it next deals Damage.', specialEffect: '+2 Difficulty to Oppose it until it next deals Damage' },
      { type: 'Crafty', range: [18, 20], description: '3 Mirelurk Hatchlings are spawned from the Mirelurk Queen.', specialEffect: 'Spawn 3 Mirelurk Hatchlings' }
    ],
    specialAbilities: [IMMUNITY('Mirelurk Queen', 'Radiation'), AQUATIC('Mirelurk Queen')]
  }),

  // ============ SUPER MUTANTS (pg.227-229) ============
  foe({
    name: 'Super Mutant',
    category: 'Super Mutant',
    threat: 2,
    background: 'Big, green, and mean. Super Mutants care little for tactics, using whatever is at hand to try and kill.',
    actions: [
      { type: 'Aggressive', range: [1, 8], description: 'The Super Mutant empties its gun and then throws it away. It is now armed with a Board.', damage: 3, damageType: 'Physical', specialEffect: 'Switches to the Board variant after this attack' },
      { type: 'Cautious', range: [9, 15], description: 'The Super Mutant opens fire with its Bolt-action Pipe Rifle from a distance.', damage: 1, damageType: 'Physical' },
      { type: 'Crafty', range: [16, 20], description: '"DIE TINY HUMAN!" You are filled with fear as the Super Mutant roars. Until the end of the Encounter, INT-based Skill Tests suffer +1 Difficulty.', specialEffect: '+1 Difficulty to INT Skill Tests until the end of the Encounter' }
    ],
    variants: [
      {
        name: 'Pipe Rifle',
        actions: [
          { type: 'Aggressive', range: [1, 8], description: 'The Super Mutant empties its gun and then throws it away. It is now armed with a Board.', damage: 3, damageType: 'Physical', specialEffect: 'Switches to the Board variant after this attack' },
          { type: 'Cautious', range: [9, 15], description: 'The Super Mutant opens fire with its Bolt-action Pipe Rifle from a distance.', damage: 1, damageType: 'Physical' },
          { type: 'Crafty', range: [16, 20], description: '"DIE TINY HUMAN!" You are filled with fear as the Super Mutant roars. Until the end of the Encounter, INT-based Skill Tests suffer +1 Difficulty.', specialEffect: '+1 Difficulty to INT Skill Tests until the end of the Encounter' }
        ]
      },
      {
        name: 'Board',
        actions: [
          { type: 'Aggressive', range: [1, 8], description: 'The Super Mutant takes wild swings with its Board, trying to smash you to pieces.', damage: 1, damageType: 'Physical' },
          { type: 'Cautious', range: [9, 15], description: 'The Super Mutant grits its teeth, enduring oncoming fire as it moves closer to you.' },
          { type: 'Crafty', range: [16, 20], description: '"DIE TINY HUMAN!" You are filled with fear as the Super Mutant roars. Until the end of the Encounter, INT-based Skill Tests suffer +1 Difficulty.', specialEffect: '+1 Difficulty to INT Skill Tests until the end of the Encounter' }
        ]
      }
    ],
    specialAbilities: [IMMUNITY('Super Mutant', 'Radiation')]
  }),
  foe({
    name: 'Super Mutant Hound',
    category: 'Super Mutant',
    threat: 2,
    background: 'Super Mutant Hounds try to get in close and fast, using their teeth to rip you to shreds. Occasionally, they will let out a howl to alert their masters to the presence of intruders.',
    actions: [
      { type: 'Aggressive', range: [1, 16], description: 'The Super Mutant Hound surges forward, attempting to tear at your heels with its brutal teeth.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [17, 19], description: 'The Super Mutant Hound leaves the combat to find its master. The next time you face a Super Mutant, add this hound to the combat.', specialEffect: 'Leaves; rejoins your next Super Mutant combat' },
      { type: 'Crafty', range: [20, 20], description: 'The Hound howls, alerting Super Mutants in the Scene to the fight. One Super Mutant joins the Encounter.', specialEffect: 'Spawn 1 Super Mutant' }
    ],
    specialAbilities: [IMMUNITY('Super Mutant Hound', 'Radiation')]
  }),
  foe({
    name: 'Super Mutant Brute',
    category: 'Super Mutant',
    threat: 3,
    background: 'These heavily armed Super Mutants can take as much punishing damage as they can deal. Caring little for strategy, they act much the same as Grunts despite their elevated social status.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'The Brute lets out a barrage from its Gatling Gun (4 Damage). This action can only be taken if the Brute has already spun up its weapon; otherwise treat this as Cautious.', damage: 4, damageType: 'Physical', specialEffect: 'Requires the weapon to be Spun Up; otherwise resolves as Cautious' },
      { type: 'Cautious', range: [13, 15], description: 'The Brute yells as it advances towards you, spinning up its Gatling Gun.', specialEffect: 'Weapon is now Spun Up' },
      { type: 'Crafty', range: [16, 20], description: 'The Brute gives an inspiring roar. All other Super Mutants may immediately make an Action.', specialEffect: 'All other Super Mutants act immediately' }
    ],
    variants: [
      {
        name: 'Gatling Gun',
        actions: [
          { type: 'Aggressive', range: [1, 12], description: 'The Brute lets out a barrage from its Gatling Gun (4 Damage). This action can only be taken if the Brute has already spun up its weapon; otherwise treat this as Cautious.', damage: 4, damageType: 'Physical', specialEffect: 'Requires the weapon to be Spun Up; otherwise resolves as Cautious' },
          { type: 'Cautious', range: [13, 15], description: 'The Brute yells as it advances towards you, spinning up its Gatling Gun.', specialEffect: 'Weapon is now Spun Up' },
          { type: 'Crafty', range: [16, 20], description: 'The Brute gives an inspiring roar. All other Super Mutants may immediately make an Action.', specialEffect: 'All other Super Mutants act immediately' }
        ]
      },
      {
        name: 'Missile Launcher',
        actions: [
          { type: 'Aggressive', range: [1, 12], description: 'The Brute fires a shot from its Rocket Launcher (3 Explosive Damage). If you are next to any allies or foes with Threat 3 or lower, they are defeated.', damage: 3, damageType: 'Explosive', specialEffect: 'Adjacent allies/foes with Threat 3 or lower are defeated' },
          { type: 'Cautious', range: [13, 15], description: 'The Brute takes cover. It cannot be targeted by Oppose Actions using Ranged Weapons until it moves.', specialEffect: 'Cannot be Opposed by Ranged Weapons until it moves' },
          { type: 'Crafty', range: [16, 20], description: 'The Brute gives an inspiring roar. All other Super Mutants may immediately make an Action.', specialEffect: 'All other Super Mutants act immediately' }
        ]
      }
    ],
    specialAbilities: [IMMUNITY('Super Mutant Brute', 'Radiation')]
  }),
  foe({
    name: 'Super Mutant Suicider',
    category: 'Super Mutant',
    threat: 3,
    background: 'A Super Mutant Suicider wants only one thing: to tackle its foes and deliver a devastating touchdown. Throwing caution to the wind, these boneheads charge straight at their enemy, Mini nuke in tow.',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'Mini nuke beeping and howling with rage, the Suicider leaps at you and explodes in a wash of nuclear fire (5 Explosive Damage). The Suicider is Defeated.', damage: 5, damageType: 'Explosive', specialEffect: 'The Suicider is Defeated by its own detonation' },
      { type: 'Cautious', range: [11, 16], description: 'The Suicider charges toward you.' },
      { type: 'Crafty', range: [17, 20], description: "The Suicider's mini nuke starts beeping. If they are defeated at any point from now on, they will detonate their payload (5 Damage).", specialEffect: 'Armed: detonates for 5 Damage when defeated' }
    ],
    specialAbilities: [IMMUNITY('Super Mutant Suicider', 'Radiation')]
  }),
  foe({
    name: 'Super Mutant Behemoth',
    category: 'Super Mutant',
    threat: 5,
    background: 'Behemoths are heavily mutated and stand at nearly thirteen feet tall. Their age and continued mutation have led them to lose the ability to speak; instead, they generally communicate via monstrous roars. Behemoths are usually solitary creatures, attempting to crush their enemies with their incredible strength.',
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'The Behemoth swings an enormous bludgeon (4 Damage) — OR — hurls a large rock (3 Damage).', damage: 4, damageType: 'Physical', specialEffect: 'At range: hurls a rock for 3 Damage instead' },
      { type: 'Cautious', range: [14, 18], description: 'The Behemoth slams its foot down, sending anything near it flying backwards — OR — the Behemoth lumbers toward you.' },
      { type: 'Crafty', range: [19, 20], description: 'The Behemoth grabs you, restricting your movement! You cannot move or take any other Actions until you are free, which requires a STR (Athletics) Skill test at difficulty 3. If the Behemoth takes another Action while you are grabbed, it hurls you away (3 Damage).', specialEffect: 'Grabbed: STR (Athletics) diff 3 to escape; hurled for 3 Damage if it acts first' }
    ],
    specialAbilities: [
      { name: 'Shopping Cart', description: 'The Behemoth carries a glut of scrap with it. When you Loot a Behemoth, you may roll [LOOT] twice instead of once.' },
      { name: 'Extremely Tough', description: 'The first time a Behemoth is Defeated, it takes an Action instead of being Defeated.' },
      IMMUNITY('Behemoth', 'Radiation')
    ]
  }),

  // ============ FERAL GHOULS (pg.230) ============
  foe({
    name: 'Feral Ghoul',
    category: 'Feral Ghoul',
    threat: 1,
    background: 'Mindless and feral, these Ghouls have long lost their humanity. Ghouls spend most of their time playing dead or wandering aimlessly until food arrives. As soon as it does, they leap into action, running towards their prey as fast as their dilapidated bodies will carry them. They attack in swarms, barreling towards their target in a great wave.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'With no regard for its safety, the Ghoul tears at you with its hands.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [13, 16], description: 'The Feral Ghoul lurches toward you.' },
      { type: 'Crafty', range: [17, 20], description: 'The horde grows, and another Feral Ghoul appears from out of view with a screech.', specialEffect: 'Spawn 1 Feral Ghoul' }
    ],
    specialAbilities: [FERAL('Feral Ghoul'), IMMUNITY('Feral Ghoul', 'Radiation, Poison')]
  }),
  foe({
    name: 'Glowing One',
    category: 'Feral Ghoul',
    threat: 3,
    background: 'These glowing green Ghouls are what happens when a Feral Ghoul, or someone predisposed to ghoulification, absorbs radiation in extreme excess. These Ghouls act no different than any other Feral Ghoul, though they are significantly more dangerous.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'The Glowing One tears into you with its hands.', damage: 2, damageType: 'Radiation' },
      { type: 'Cautious', range: [13, 17], description: 'The Glowing One lurches toward you.' },
      { type: 'Crafty', range: [18, 20], description: 'The Glowing One lets out a pulse of radioactive energy. If there are any Defeated Feral Ghouls near the Glowing One, they are no longer Defeated.', specialEffect: 'Revives Defeated Feral Ghouls nearby' }
    ],
    specialAbilities: [
      FERAL('Glowing One'),
      { name: 'Radioactive Nexus', description: 'Feral Ghouls nearby a Glowing One gain 1 Threat (to a maximum of 2).' },
      IMMUNITY('Glowing One', 'Radiation, Poison')
    ]
  }),

  // ============ ROBOTS (pg.231-236) ============
  foe({
    name: 'Assaultron',
    category: 'Robot',
    threat: 3,
    background: "RobCo's answer to the US Military's needs. Armed with deadly blades and a powerful head-mounted laser, they can now be found across the Wasteland. They can be reprogrammed to follow the orders of any with the know-how, but their fundamental purpose is always the same: kill the designated target.",
    actions: [
      { type: 'Aggressive', range: [1, 13], description: "The Assaultron sprints towards you — OR — the Assaultron's many weapons snap out towards you!", damage: 2, damageType: 'Physical' },
      { type: 'Cautious', range: [14, 15], description: 'The Assaultron sprints towards you, using cover as it goes — OR — if the Assaultron is adjacent to you and has a Threat rating of 2 or less, it explodes and is Defeated (3 Explosive Damage and 1 Radiation Damage).', specialEffect: 'Adjacent at Threat ≤2: explodes for 3 Explosive + 1 Radiation Damage and is Defeated' },
      { type: 'Crafty', range: [16, 20], description: 'The Assaultron lets loose an intense blast from its head laser (2 Damage, increased by its Charging Laser).', damage: 2, damageType: 'Energy', specialEffect: 'Charging Laser: damage grows by 1 per Action taken, max 5; resets after dealing damage' }
    ],
    specialAbilities: [
      ROBOT_IMMUNITY('Assaultron'),
      { name: 'Charging Laser', description: 'Each time an Assaultron makes an Action, the Damage of its Head Laser is increased by 1, to a maximum of 5. If the Assaultron deals damage with it, the Damage resets to 2 afterwards.' }
    ]
  }),
  foe({
    name: 'Eyebot',
    category: 'Robot',
    threat: 1,
    background: 'Eyebots drift the Wasteland, disseminating information and music to the residents. Not designed for combat, these autonomous drones are more suited to surveillance, only attacking when threatened and unable to escape.',
    actions: [
      { type: 'Aggressive', range: [1, 4], description: 'The Eyebot releases a close-range burst of electricity.', damage: 1, damageType: 'Energy' },
      { type: 'Cautious', range: [5, 15], description: 'The Eyebot attempts to flee the area as quickly as possible.', specialEffect: 'Flees' },
      { type: 'Crafty', range: [16, 20], description: 'Blasting noise from its speakers as loudly as possible, the Eyebot disorients anyone who can hear it. Skill Tests using PER have their difficulty increased by 1 until its next action.', specialEffect: '+1 Difficulty to PER Skill Tests until its next action' }
    ],
    specialAbilities: [FLIGHT('Eyebot'), SMALL('Eyebot'), ROBOT_IMMUNITY('Eyebot')]
  }),
  foe({
    name: 'Protectron',
    category: 'Robot',
    threat: 2,
    background: "Protectrons trudge around the Wasteland attempting to perform the functions assigned before the war. Each Protectron's behavior depends on its programming. Many Protectrons are peaceful until something is done that causes them to be hostile toward you.",
    actions: [
      { type: 'Aggressive', range: [1, 5], description: 'The Protectron injects you with a "helpful" [CHEM].', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [6, 8], description: 'The Protectron lumbers to an advantageous position in a slow, awkward gait — OR — if adjacent to you with Threat 1 or less, it explodes and is Defeated (1 Explosive Damage and 1 Radiation Damage).', specialEffect: 'Adjacent at Threat ≤1: explodes for 1 Explosive + 1 Radiation Damage and is Defeated' },
      { type: 'Crafty', range: [9, 20], description: 'The Protectron shouts out an encouraging message to those nearby, reminding them of safety precautions, before continuing on its programmed route.' }
    ],
    variants: [
      {
        name: 'Medic',
        actions: [
          { type: 'Aggressive', range: [1, 5], description: 'The Protectron injects you with a "helpful" [CHEM].', damage: 1, damageType: 'Physical' },
          { type: 'Cautious', range: [6, 8], description: 'The Protectron lumbers to an advantageous position — OR — if adjacent with Threat ≤1, it explodes and is Defeated (1 Explosive + 1 Radiation Damage).', specialEffect: 'Adjacent at Threat ≤1: explodes and is Defeated' },
          { type: 'Crafty', range: [9, 20], description: 'The Protectron shouts an encouraging safety message before continuing on its programmed route.' }
        ]
      },
      {
        name: 'Fire Brigadier',
        actions: [
          { type: 'Aggressive', range: [1, 5], description: 'The Protectron sprays you with cryo-foam.', damage: 1, damageType: 'Energy' },
          { type: 'Cautious', range: [6, 8], description: 'The Protectron lumbers to an advantageous position — OR — if adjacent with Threat ≤1, it explodes and is Defeated (1 Explosive + 1 Radiation Damage).', specialEffect: 'Adjacent at Threat ≤1: explodes and is Defeated' },
          { type: 'Crafty', range: [9, 20], description: 'The Protectron shouts an encouraging safety message before continuing on its programmed route.' }
        ]
      },
      {
        name: 'Utility',
        actions: [
          { type: 'Aggressive', range: [1, 5], description: 'The Protectron slams at you with its cargo loaders.', damage: 2, damageType: 'Physical' },
          { type: 'Cautious', range: [6, 8], description: 'The Protectron lumbers to an advantageous position — OR — if adjacent with Threat ≤1, it explodes and is Defeated (1 Explosive + 1 Radiation Damage).', specialEffect: 'Adjacent at Threat ≤1: explodes and is Defeated' },
          { type: 'Crafty', range: [9, 20], description: 'The Protectron shouts an encouraging safety message before continuing on its programmed route.' }
        ]
      }
    ],
    specialAbilities: [
      { name: 'Here to help!', description: 'When a Protectron appears, randomly determine its Job. All De-escalate Actions against a Protectron are resolved at -1 Difficulty if you can involve its job in the test.' },
      ROBOT_IMMUNITY('Protectron')
    ]
  }),
  foe({
    name: 'Mr. Handy',
    category: 'Robot',
    threat: 1,
    background: "General Atomics' finest! The Mr. Handy is the all-purpose robot for your everyday needs. Coming in a variety of configurations, Mr. Handys can sport buzz saws, flamers (not to be used as a BBQ substitute), laser weaponry, or pincers, all designed to make your day-to-day a breeze.",
    actions: [
      { type: 'Aggressive', range: [1, 5], description: 'Mr. Handy politely attempts to saw you in half with its buzzsaw (1 Damage) — OR — Mr. Handy hovers its way toward you.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [6, 16], description: 'Mr. Handy attempts to spot-clean the stains on your clothing with its laser (1 Damage) — OR — seeing you are a little cold, Mr. Handy tries to warm you up with its flamer (1 Damage).', damage: 1, damageType: 'Energy' },
      { type: 'Crafty', range: [17, 20], description: 'Mr. Handy offers to help you in any way it can. Roll a d20; if the result is equal to or lower than your Luck, it gives you a [CHEM] before hovering off. If higher, it provides verbal assistance completely at odds with the situation — OR — if adjacent with Threat 0, it explodes and is Defeated (1 Explosive + 1 Radiation Damage).', specialEffect: 'd20 ≤ Luck: gain a Chem. Adjacent at Threat 0: explodes and is Defeated.' }
    ],
    specialAbilities: [FLIGHT('Mr. Handy'), ROBOT_IMMUNITY('Mr. Handy')]
  }),
  foe({
    name: 'Mr. Gutsy',
    category: 'Robot',
    threat: 2,
    background: 'Purpose-built for the Military, these modified Mr. Handys are violent and aggressive. They are governed by faulty sub-routines commanding them to attack anyone not aligned with the now long-gone US Military.',
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'Mr. Gutsy tries to give you a little more than a military cut with its buzzsaw (2 Damage) — OR — Mr. Gutsy hovers toward you, spouting patriotic slogans.', damage: 2, damageType: 'Physical' },
      { type: 'Cautious', range: [14, 15], description: 'Mr. Gutsy introduces you to fine American craftsmanship as it opens fire with its Automatic-pistol (2 Damage) — OR — introduces you to the real Red Menace using its flamer (2 Damage).', damage: 2, damageType: 'Energy' },
      { type: 'Crafty', range: [16, 20], description: 'Mr. Gutsy screams in valiant bravery and rushes toward you before detonating. It is Defeated (2 Explosive Damage and 1 Radiation Damage).', damage: 2, damageType: 'Explosive', specialEffect: 'Also deals 1 Radiation Damage; Mr. Gutsy is Defeated' }
    ],
    specialAbilities: [
      FLIGHT('Mr. Gutsy'),
      { name: 'Patriotic Duty', description: 'De-Escalate Actions are made at -1 Difficulty if the character can demonstrate a link to the long-dissolved US Military.' },
      ROBOT_IMMUNITY('Mr. Gutsy')
    ]
  }),
  foe({
    name: 'Sentry Bot',
    category: 'Robot',
    threat: 4,
    background: 'Sentry Bots are the greatest combat robot developed by the US Military. They drown foes in unrelenting waves of Minigun fire and blast away cover with barrages of missiles.',
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'The Sentry Bot opens fire with its Miniguns (4 Damage) — OR — if you are in cover, the Sentry Bot fires its Rocket Launchers, destroying the cover you are using (3 Explosive Damage).', damage: 4, damageType: 'Physical', specialEffect: 'If you are in cover: 3 Explosive Damage and your cover is destroyed' },
      { type: 'Cautious', range: [14, 18], description: 'The Sentry Bot reanalyses the situation and develops a new attack pattern, increasing its Threat by 1 to a maximum of 4 — OR — the Sentry Bot tells you to immediately leave the area. If it is your only Foe, you may automatically succeed at the Retreat Action.', specialEffect: '+1 Threat (max 4), or free Retreat if it is the only Foe' },
      { type: 'Crafty', range: [19, 20], description: 'The Sentry Bot moves to an advantageous position — OR — if adjacent to you with Threat 2 or less, it explodes and is Defeated (4 Explosive Damage and 1 Radiation Damage).', specialEffect: 'Adjacent at Threat ≤2: explodes for 4 Explosive + 1 Radiation Damage and is Defeated' }
    ],
    specialAbilities: [
      ROBOT_IMMUNITY('Sentry Bot'),
      { name: 'Immovable', description: 'The Sentry Bot is a bulk of metal and firepower; it cannot be moved or displaced unless it chooses to.' }
    ]
  }),
  foe({
    name: 'Turret',
    category: 'Robot',
    threat: 2,
    background: 'Unlike other robotic enemies, turrets are incapable of movement, and often serve to protect important locations rather than as wandering foes.',
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'The turret fires its weapon.', damage: 2, damageType: 'Energy' },
      { type: 'Cautious', range: [14, 20], description: 'The turret scans the area, unable to find a target.' }
    ],
    variants: [
      {
        name: 'Laser',
        actions: [
          { type: 'Aggressive', range: [1, 13], description: 'The turret fires its lasers.', damage: 2, damageType: 'Energy' },
          { type: 'Cautious', range: [14, 20], description: 'The turret scans the area, unable to find a target.' }
        ]
      },
      {
        name: 'Machinegun',
        actions: [
          { type: 'Aggressive', range: [1, 13], description: 'The turret opens fire with its Machinegun.', damage: 2, damageType: 'Physical' },
          { type: 'Cautious', range: [14, 20], description: 'The turret scans the area, unable to find a target.' }
        ]
      }
    ],
    specialAbilities: [
      ROBOT_IMMUNITY('Turret'),
      { name: 'Static', description: 'The Turret is a bulk of metal and firepower; it cannot be moved or displaced, and it may not move.' }
    ]
  }),

  // ============ RAIDERS (pg.236-238) ============
  foe({
    name: 'Raider',
    category: 'Raider',
    threat: 1,
    background: 'Never found alone, the lowliest members of a gang are more afraid of their bosses than they are of you. Taking you out could be their ticket to increased status and all the benefits that brings.',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'Hurling insults, the Raider lets rip with a Pipe Gun, taunting you in the process.', damage: 1, damageType: 'Physical' },
      { type: 'Cautious', range: [11, 16], description: 'The Raider takes cover; they cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Cannot be Opposed by Ranged Weapons until their next action' },
      { type: 'Crafty', range: [17, 20], description: 'If the Raider is the only Foe remaining, they flee — OR — they call out an insult and inject themselves with a dose of Psycho. All damage dealt by the Raider is increased by 1. If a Raider takes this Action twice, they are Defeated.', specialEffect: 'Flees if alone; otherwise +1 Damage (Defeated if taken twice)' }
    ],
    variants: [
      {
        name: 'Tire Iron',
        actions: [
          { type: 'Aggressive', range: [1, 10], description: 'Hurling insults, the Raider swings at you with a Tire Iron.', damage: 1, damageType: 'Physical' },
          { type: 'Cautious', range: [11, 16], description: 'The Raider rushes across the open ground toward you.' },
          { type: 'Crafty', range: [17, 20], description: 'If the Raider is the only Foe remaining, they flee — OR — they inject a dose of Psycho. All damage dealt is increased by 1. If taken twice, they are Defeated.', specialEffect: 'Flees if alone; otherwise +1 Damage (Defeated if taken twice)' }
        ]
      },
      {
        name: 'Pipe Gun',
        actions: [
          { type: 'Aggressive', range: [1, 10], description: 'Hurling insults, the Raider lets rip with a Pipe Gun, taunting you in the process.', damage: 1, damageType: 'Physical' },
          { type: 'Cautious', range: [11, 16], description: 'The Raider takes cover; they cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Cannot be Opposed by Ranged Weapons until their next action' },
          { type: 'Crafty', range: [17, 20], description: 'If the Raider is the only Foe remaining, they flee — OR — they inject a dose of Psycho. All damage dealt is increased by 1. If taken twice, they are Defeated.', specialEffect: 'Flees if alone; otherwise +1 Damage (Defeated if taken twice)' }
        ]
      }
    ],
    specialAbilities: [
      { name: 'Always Carrying!', description: 'Whenever you [LOOT] a Raider, you gain one [CHEM].' },
      { name: 'Not the Boss!', description: 'If a Raider sees a Raider Boss get Defeated, roll a d20. If the result is equal to or lower than your Luck, the Raider flees.' }
    ]
  }),
  foe({
    name: 'Psycho',
    category: 'Raider',
    threat: 2,
    background: 'Completely addicted and always hunting for that next hit, Psychos will charge into battle with little to no regard for their own safety.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'The Psycho attacks with a Machete (2 Damage) — OR — the Psycho charges directly at you.', damage: 2, damageType: 'Physical' },
      { type: 'Cautious', range: [13, 18], description: 'The Psycho howls and takes a dose of Psycho. All damage dealt by the Psycho is increased by 1. If a Psycho takes this Action twice, they are Defeated.', specialEffect: '+1 Damage (Defeated if taken twice)' },
      { type: 'Crafty', range: [19, 20], description: 'The Psycho howls and takes a dose of Jet. When the Psycho makes an Action, it makes two instead. If a Psycho takes this Action twice, they are Defeated.', specialEffect: 'Acts twice per Action (Defeated if taken twice)' }
    ],
    specialAbilities: [
      { name: 'Always Carrying!', description: 'Whenever you [LOOT] a Psycho, you gain two [CHEMS].' },
      { name: 'RAAAAGH!', description: 'When a Psycho is under the effects of Psycho or Jet, their Threat Rating cannot be reduced.' }
    ]
  }),
  foe({
    name: 'Scavver',
    category: 'Raider',
    threat: 2,
    background: 'As interested in taking your gear as they are in killing you. You might be able to bargain with them. Might…',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'The Scavver raises their Combat Shotgun at you, yelling out a warning before opening fire.', damage: 2, damageType: 'Physical' },
      { type: 'Cautious', range: [11, 14], description: 'The Scavver lets out a quick warning to their allies, diving for cover as they do so. They cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Cannot be Opposed by Ranged Weapons until their next action' },
      { type: 'Crafty', range: [15, 20], description: 'The Scavver launches a Molotov Cocktail before running back into cover.', damage: 2, damageType: 'Energy' }
    ],
    specialAbilities: [
      { name: 'A lot of Junk', description: 'Whenever you [LOOT] a Scavver, you gain [SCRAP].' },
      { name: 'Loot Addict', description: 'You may reduce the difficulty of De-Escalate Actions against a Scavver by 2 if you give them an Item they might be interested in.' }
    ]
  }),
  foe({
    name: 'Raider Boss',
    category: 'Raider',
    threat: 3,
    background: "Cruel, ruthless, and feared, Raider Bosses are the worst of the worst. They didn't get to where they are by playing nice, and are more than happy to let others die if it means getting what they want. Hell, it's probably a bonus.",
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'The Raider Boss quickly lines up a shot with their Hunting Rifle (2 Damage) — OR — throws a Grenade, arcing it over cover (3 Explosive Damage) — OR — rams a jagged lump of sharpened metal into you (3 Damage).', damage: 3, damageType: 'Physical', specialEffect: 'Rifle: 2 Damage. Grenade: 3 Explosive Damage (ignores cover).' },
      { type: 'Cautious', range: [11, 14], description: 'The Raider Boss takes cover; they cannot be Opposed by Ranged Weapons until their next action — OR — the Boss smiles and slams a dose of Overdrive into their neck: +1 Threat and +1 to all damage dealt. If taken twice, they are Defeated.', specialEffect: 'Cover (no ranged Oppose), or Overdrive: +1 Threat and +1 Damage (Defeated if taken twice)' },
      { type: 'Crafty', range: [15, 20], description: 'The Raider Boss shouts for concentrated fire. All Raiders, Psychos, and Scavvers take their Aggressive Action.', specialEffect: 'All Raiders, Psychos, and Scavvers take their Aggressive Action' }
    ],
    specialAbilities: [
      { name: 'Always Carrying!', description: 'Whenever you [LOOT] a Raider Boss, you gain two [CHEMS].' },
      { name: 'Meat Shield', description: 'When a Raider Boss would be Defeated by a Ranged Attack and there is a Lower Threat Foe close to them, that Foe is Defeated instead.' }
    ]
  }),

  // ============ THE INSTITUTE (pg.238-241) ============
  foe({
    name: 'Institute Scientist',
    category: 'Institute',
    threat: 1,
    background: 'These individuals are proudly redefining mankind. They are specialists in every field, other than the rather barbaric areas of combat and survival. They are much happier safe at home within The Institute rather than out in the Wasteland.',
    actions: [
      { type: 'Aggressive', range: [1, 4], description: 'The Scientist fires at you with their Institute Laser.', damage: 1, damageType: 'Energy' },
      { type: 'Cautious', range: [5, 10], description: 'The Scientist takes cover; they cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Cannot be Opposed by Ranged Weapons until their next action' },
      { type: 'Crafty', range: [11, 20], description: 'A well-timed Pulse Grenade scrambles all electronics nearby. Increase the Difficulty of any Test involving the use of electronic aids by 1 until the Scientist\'s next action.', specialEffect: '+1 Difficulty to Tests using electronic aids until their next action' }
    ],
    specialAbilities: [
      { name: 'Get me out of here!', description: 'If an Oppose Action made against a Scientist fails, they immediately try to flee.' }
    ]
  }),
  foe({
    name: 'First Generation Synth',
    category: 'Institute',
    threat: 1,
    background: 'With skeletal alloy frames and exposed circuitry, Gen 1 Synths are expendable and run on preprogrammed commands. Armed with Institute Laser weaponry, they require frequent maintenance to keep them aiming in the right direction.',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'The Synth carefully approaches, Stun Baton in hand — OR — strikes with its Baton in a fizz of arcing light (1 Damage). If you take Damage from this attack, your next Skill Test suffers +1 Difficulty.', damage: 1, damageType: 'Energy', specialEffect: 'On Damage: +1 Difficulty to your next Skill Test' },
      { type: 'Cautious', range: [11, 16], description: 'The Synth moves into cover and fires its Institute Laser (1 Damage). It cannot be Opposed by Ranged Weapons until its next action.', damage: 1, damageType: 'Energy', specialEffect: 'Cannot be Opposed by Ranged Weapons until its next action' },
      { type: 'Crafty', range: [17, 20], description: 'The Synth rushes forward to grapple you, regardless of danger to itself. Unless you pass a STR (Athletics) test at difficulty 1 at the start of your next Action, you cannot move during that Action.', specialEffect: 'Grappled: STR (Athletics) diff 1 or you cannot move next Action' }
    ],
    specialAbilities: [
      { name: 'Always More', description: 'After a First-Generation Synth finishes an Action, roll a d20. If the result is higher than your Luck, another First-Generation Synth appears in a flash of blue light and joins the fight.' },
      IMMOVEABLE_ORDERS('First-Generation Synth'),
      ROBOT_IMMUNITY('First-Generation Synth')
    ]
  }),
  foe({
    name: 'Synth Strider',
    category: 'Institute',
    threat: 2,
    background: "These Synths are second generation, more advanced than the first gen Synths, but far from human-passing. They are programmed not to care for their own safety and are usually found defending Locations and assets The Institute doesn't want anyone interfering with.",
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'The Synth carefully approaches, Stun Baton in hand — OR — strikes with its Baton in a fizz of arcing light (1 Damage). If you take Damage from this attack, your next Skill Test suffers +1 Difficulty.', damage: 1, damageType: 'Energy', specialEffect: 'On Damage: +1 Difficulty to your next Skill Test' },
      { type: 'Cautious', range: [11, 14], description: 'The Synth moves into cover and fires its Institute Laser (1 Damage). It cannot be Opposed by Ranged Weapons until its next action.', damage: 1, damageType: 'Energy', specialEffect: 'Cannot be Opposed by Ranged Weapons until its next action' },
      { type: 'Crafty', range: [15, 20], description: 'The Synth rushes forward to grapple you, regardless of danger to itself. Unless you pass a STR (Athletics) test at difficulty 1 at the start of your next Action, you cannot move during that Action.', specialEffect: 'Grappled: STR (Athletics) diff 1 or you cannot move next Action' }
    ],
    specialAbilities: [IMMOVEABLE_ORDERS('Synth Strider'), ROBOT_IMMUNITY('Synth Strider')]
  }),
  foe({
    name: 'Synth Trooper',
    category: 'Institute',
    threat: 2,
    background: 'More aggressive than other second generation Synths, Troopers make effective field units. They often act as a relay to control groups of Synths in the Commonwealth, especially when the Institute wants no survivors.',
    actions: [
      { type: 'Aggressive', range: [1, 12], description: 'The Trooper fires its enhanced Institute Laser.', damage: 2, damageType: 'Energy' },
      { type: 'Cautious', range: [13, 16], description: 'The Trooper moves into cover and fires its Institute Laser (1 Damage). It cannot be Opposed by Ranged Weapons until its next action.', damage: 1, damageType: 'Energy', specialEffect: 'Cannot be Opposed by Ranged Weapons until its next action' },
      { type: 'Crafty', range: [17, 20], description: 'The Trooper issues a static-like scream and marks you as a target, signalling all its allies to coordinate fire (1 Damage, plus Coordinate Fire).', damage: 1, damageType: 'Energy', specialEffect: 'Coordinate Fire: +1 Damage per other ranged-armed Synth that can see you' }
    ],
    specialAbilities: [
      { name: 'Coordinate Fire', description: 'When dealing Damage with their Crafty Action, you suffer 1 Additional Damage for each other Synth in the Encounter that can see you and carries a Ranged Weapon.' },
      IMMOVEABLE_ORDERS('Synth Trooper'),
      ROBOT_IMMUNITY('Synth Trooper')
    ]
  }),
  foe({
    name: 'Synth Courser',
    category: 'Institute',
    threat: 4,
    background: "Well-trained and equipped with the best The Institute can offer, these Third-Generation Synths are hunters. If you're their target you better run far and hide well. Coursers are enigmatic and terrifying, even if you're not a runaway Synth.",
    actions: [
      { type: 'Aggressive', range: [1, 10], description: 'The Courser raises and fires its Institute Laser with robotic precision (3 Damage) — OR — falls back on its close combat programming (2 Damage).', damage: 3, damageType: 'Energy', specialEffect: 'Melee: 2 Damage instead' },
      { type: 'Cautious', range: [11, 14], description: 'The Courser takes cover and activates a Relay Grenade. One Synth Trooper appears in a flash of blue light and joins the fight. The Courser cannot be Opposed by Ranged Weapons until its next action.', specialEffect: 'Spawn 1 Synth Trooper; no ranged Oppose until its next action' },
      { type: 'Crafty', range: [15, 20], description: 'The Courser activates a Stealth Boy. Until the end of the Encounter, the Courser cannot be the target of Oppose Actions unless you succeed on a PER (Science) skill test at difficulty 2. If already invisible, it moves to an advantageous position.', specialEffect: 'Invisible: PER (Science) diff 2 required to Oppose it' }
    ],
    specialAbilities: [
      { name: 'Assassination Orders', description: 'If you have a Reputation of Hostile or less with the Institute, the Synth Courser deals 1 additional damage.' },
      IMMOVEABLE_ORDERS('Synth Courser'),
      ROBOT_IMMUNITY('Synth Courser')
    ]
  }),

  // ============ BROTHERHOOD OF STEEL (pg.242-245) ============
  foe({
    name: 'Brotherhood Initiate',
    category: 'Brotherhood of Steel',
    threat: 1,
    background: "While suits of Power Armor are the most iconic element of the Brotherhood's forces, they also boast ranks of lighter armored foot troops. These Initiates prefer to fire at their enemies from range and, if they survive long enough, attain the esteemed rank of Knight.",
    actions: [
      { type: 'Aggressive', range: [1, 6], description: 'The Initiate attacks with their Laser Rifle.', damage: 2, damageType: 'Energy' },
      { type: 'Cautious', range: [7, 15], description: 'The Initiate takes cover; they cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Cannot be Opposed by Ranged Weapons until their next action' },
      { type: 'Crafty', range: [16, 20], description: 'The Initiate sticks to cover as best they can, while seeking a better firing position.' }
    ],
    specialAbilities: [
      { name: 'The Chain that Binds', description: 'Whenever another Brotherhood Foe with a higher Threat Rating takes an Action, the Initiate may make their Cautious Action.' }
    ]
  }),
  foe({
    name: 'Brotherhood Knight',
    category: 'Brotherhood of Steel',
    threat: 3,
    background: 'Knights are the most common ground troop utilized by the Brotherhood of Steel. They wield a mix of Heavy and Laser weaponry, and can fight close up with powerful Melee strikes supported by their Power Armored frames.',
    actions: [
      { type: 'Aggressive', range: [1, 14], description: 'The Knight barrels into melee with their Power Armor-enhanced strength (2 Damage). If you suffer Damage from this, make an END (Athletics) skill test at difficulty 2; if you fail, you are knocked Prone — OR — the Knight fires concentrated bursts from their Laser Rifle (3 Damage).', damage: 3, damageType: 'Energy', specialEffect: 'Melee: 2 Damage + END (Athletics) diff 2 or knocked Prone' },
      { type: 'Cautious', range: [15, 16], description: 'Using their bulk, the Knight shields their allies and advances on your position. You cannot Oppose targets other than the Knight with your next Action — OR — the Knight orders a ceasefire to assess the situation. If you make the De-escalate Action next turn, its difficulty is reduced by 1.', specialEffect: 'Must target the Knight next Action, or De-escalate at -1 Difficulty' },
      { type: 'Crafty', range: [17, 20], description: 'The Knight issues an order to their immediate subordinates. Up to two other Brotherhood foes with lower Threat Ratings make an Action — OR — the Knight moves toward you, smashing obstacles with their Power Armor.', specialEffect: 'Up to two lower-Threat Brotherhood foes act' }
    ],
    specialAbilities: [SWORD_THAT_CUTS('Knight'), IMMUNITY('Knight', 'Radiation, Suffocation')]
  }),
  foe({
    name: 'Brotherhood Paladin',
    category: 'Brotherhood of Steel',
    threat: 4,
    background: 'The Sword of the Brotherhood, Paladins are deployed when the Brotherhood wants to absolutely guarantee the success of a mission. Looming over others in their well-maintained Power Armor and wielding customized Gatling weapons, very few things can stand against a determined Paladin.',
    actions: [
      { type: 'Aggressive', range: [1, 10], description: "The Paladin advances while laying down continuous fire from their Gatling Laser (3 Damage). If you do not have cover, your next Action's difficulty is increased by 1.", damage: 3, damageType: 'Energy', specialEffect: 'No cover: +1 Difficulty to your next Action' },
      { type: 'Cautious', range: [11, 15], description: 'The Paladin provides covering fire for their allies. If you Oppose a target other than the Paladin with your next Action, the difficulty of the test is increased by 1.', specialEffect: '+1 Difficulty to Oppose anyone other than the Paladin' },
      { type: 'Crafty', range: [16, 20], description: 'The Paladin issues an order to their immediate subordinates. Up to two other Brotherhood foes with lower Threat Ratings make an Action — OR — the Paladin moves toward you, smashing obstacles with their Power Armor.', specialEffect: 'Up to two lower-Threat Brotherhood foes act' }
    ],
    specialAbilities: [
      SWORD_THAT_CUTS('Paladin'),
      { name: 'Ad Victoriam', description: 'If an attack from a Paladin causes an Injury, all Brotherhood Foes that saw it increase their Threat by 1, to a maximum of their starting Threat.' },
      IMMUNITY('Paladin', 'Radiation, Suffocation')
    ]
  }),
  foe({
    name: 'Brotherhood Scribe',
    category: 'Brotherhood of Steel',
    threat: 1,
    background: 'Scribes are the technologists of the Brotherhood, rarely sent out in the field apart from to recover, investigate, and test new technologies. Lacking the Power Armor of the Knights and Paladins, they are nevertheless well equipped to deal with much of what the Wasteland throws at them.',
    actions: [
      { type: 'Aggressive', range: [1, 6], description: 'The Scribe relies on somewhat out-of-practice combat training, raising their Laser Pistol.', damage: 1, damageType: 'Energy' },
      { type: 'Cautious', range: [7, 15], description: 'The Scribe enacts emergency repairs to a suit of Power Armor. If any Knight or Paladin has had their Threat reduced, it is returned to its starting Value — OR — the Scribe runs over to a Knight or Paladin to offer their assistance.', specialEffect: 'Restores a Knight/Paladin to starting Threat' },
      { type: 'Crafty', range: [16, 20], description: 'The Scribe takes cover; they cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Cannot be Opposed by Ranged Weapons until their next action' }
    ],
    specialAbilities: []
  }),
  foe({
    name: 'Brotherhood Elder',
    category: 'Brotherhood of Steel',
    threat: 3,
    background: 'Elders lead their chapters and only take to the battlefield when necessary. Their wealth of knowledge and experience is second only to their tactical acumen, but even these lofty individuals are subject to the Chain That Binds.',
    actions: [
      { type: 'Aggressive', range: [1, 7], description: 'The Elder calls out for the Brotherhood to fire with them. Suffer 1 Damage for every Brotherhood Foe that has a clear line of sight on you — OR — the Elder attacks with their Laser Rifle (3 Damage).', damage: 3, damageType: 'Energy', specialEffect: 'Volley: 1 Damage per Brotherhood Foe with line of sight' },
      { type: 'Cautious', range: [8, 15], description: 'The Elder commands their forces with expert precision. Every Brotherhood foe may make their Cautious Action.', specialEffect: 'Every Brotherhood foe makes their Cautious Action' },
      { type: 'Crafty', range: [16, 20], description: 'The Elder issues an order to their immediate subordinates. Up to two other Brotherhood foes make an Action — OR — the Elder takes cover; they cannot be Opposed by Ranged Weapons until their next action.', specialEffect: 'Up to two Brotherhood foes act, or cover (no ranged Oppose)' }
    ],
    specialAbilities: [
      { name: 'Fetch Me My Armor', description: 'You may elect to have an Elder be wearing their Power Armor in the field. If so, their Threat is increased to 4, and they gain Immunity (Radiation, Suffocation).' },
      SWORD_THAT_CUTS('Elder'),
      IMMUNITY('Elder', 'Radiation, Suffocation')
    ]
  }),

  // ============ ZETANS (pg.246) ============
  foe({
    name: 'Zetan',
    category: 'Zetan',
    threat: 2,
    background: 'Mutated humans, animals, and insects all exist, so why not aliens too? These enigmatic little yellow-green aliens possess technology far beyond anything the Wasteland has to offer. But why are they here? And what threat do they pose?',
    actions: [
      { type: 'Aggressive', range: [1, 13], description: 'The Zetan lets out an indecipherable screech and fires its Alien Blaster.', damage: 2, damageType: 'Energy' },
      { type: 'Cautious', range: [14, 17], description: 'The Zetan sends a signal to their mothership. If this is the second time they have taken this Action, the mothership arrives to beam them up and the Zetan is removed from the scene.', specialEffect: 'Second use: the Zetan is beamed away and removed' },
      { type: 'Crafty', range: [18, 20], description: 'After some nonsensical adjustments to their weapon, the Zetan fires a rapid blast that vaporises all it touches (3 Damage; this Damage cannot be Endured).', damage: 3, damageType: 'Energy', specialEffect: 'This Damage cannot be Endured' }
    ],
    specialAbilities: []
  })
];

export const getFoeByName = (name: string): FoeTemplate | undefined =>
  BESTIARY.find(f => f.name === name);

export const getFoesByCategory = (category: FoeCategory): FoeTemplate[] =>
  BESTIARY.filter(f => f.category === category);

/** Returns a random foe. If the foe has weapon/job variants, one is chosen at
 *  random and its action set swapped in (the variant name is appended). */
export const getRandomFoe = (): FoeTemplate => {
  const base = BESTIARY[Math.floor(Math.random() * BESTIARY.length)];
  return resolveVariant(base);
};

export const resolveVariant = (base: FoeTemplate): FoeTemplate => {
  if (!base.variants || base.variants.length === 0) return base;
  const variant = base.variants[Math.floor(Math.random() * base.variants.length)];
  return { ...base, name: `${base.name} (${variant.name})`, actions: variant.actions };
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, lone: 1, two: 2, pair: 2, three: 3, four: 4, five: 5, six: 6
};

/** Extracts concrete foes (with counts) from a Foe Generation scenario string,
 *  e.g. "Three Feral Ghouls claw at a locked pre-war door" → 3x Feral Ghoul.
 *  Longest names match first so "Mirelurk Queen" beats "Mirelurk". */
export const parseFoesFromScenario = (scenario: string): FoeTemplate[] => {
  const result: FoeTemplate[] = [];
  const lower = scenario.toLowerCase();
  const byLength = [...BESTIARY].sort((a, b) => b.name.length - a.name.length);
  const claimed: Array<[number, number]> = [];

  for (const foe of byLength) {
    // Match singular and plural forms of the foe name (ghouls, radroaches, bloatflies).
    const escaped = foe.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pluralized = escaped.endsWith('y') ? `${escaped.slice(0, -1)}(?:y|ies)` : `${escaped}(?:es|s)?`;
    const pattern = new RegExp(`(\\b(?:a|an|one|lone|two|pair of|three|four|five|six|\\d+)\\s+)?${pluralized}\\b`, 'g');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(lower)) !== null) {
      const [start, end] = [match.index, match.index + match[0].length];
      if (claimed.some(([s, e]) => start < e && end > s)) continue; // inside a longer name
      claimed.push([start, end]);
      const qualifier = match[1]?.trim().replace(' of', '') ?? 'a';
      const count = NUMBER_WORDS[qualifier] ?? (parseInt(qualifier, 10) || 1);
      for (let i = 0; i < count; i++) result.push(resolveVariant(foe));
    }
  }
  return result;
};
