// NPC Generation — complete from Appendix 2 (pg.177-188).
// Order per the book: Faction → Name → Age → Demeanor → Distinctive Features (x2)
// → Profession → Secret → Truth. Plus the full Dangerous NPC system.

const roll = (max: number) => Math.floor(Math.random() * max) + 1;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ===================== FACTIONS (pg.217) =====================
export const FACTIONS = [
  'Super Mutants',
  'Brotherhood of Steel',
  'Raiders',
  'Atom Cats',
  'Enclave',
  'Wasteland Survivors',
  'Institute',
  'Children of Atom',
  'Gunners',
  'Minutemen',
  'Railroad',
  'Vault Dweller',
  'NCR',
  "Caesar's Legion",
  'Rust Devils',
  'Followers of the Apocalypse',
  'Mercenary',
  'Nuka-World',
  'Does not have a Faction',
  'Invent your own'
];

export const rollFaction = (): string => FACTIONS[roll(20) - 1];

// ===================== NAMES (pg.178-180) =====================
export const FEMININE_NAMES = [
  'Alice', 'Alya', 'Amy', 'Anita', 'Anna', 'Annette', 'Andrea', 'Angela', 'Aria', 'Arlene', 'Audrey', 'Ava',
  'Barbara', 'Becky', 'Belinda', 'Beth', 'Betty', 'Beverly', 'Bonnie', 'Brenda',
  'Camila', 'Carla', 'Carmen', 'Carol', 'Catherine', 'Cathy', 'Charlotte', 'Cheryl', 'Christine', 'Cindy',
  'Claudia', 'Connie', 'Constance', 'Cynthia', 'Carolyn', 'Carrie',
  'Dana', 'Darlene', 'Dawn', 'Deborah', 'Debbie', 'Denise', 'Diane', 'Doreen', 'Donna', 'Doris', 'Dorothy',
  'Elaine', 'Ellen', 'Elizabeth', 'Eva', 'Evelyn',
  'Frances', 'Gail', 'Genesis', 'Geraldine', 'Glenda', 'Gloria', 'Grace',
  'Helen', 'Holly', 'Irene',
  'Jacqueline', 'Jackie', 'Jan', 'Jane', 'Janet', 'Janice', 'Jean', 'Jeanne', 'Jennifer', 'Jill', 'Jo',
  'Joan', 'Joanne', 'Judith', 'Julia', 'June', 'Jun', 'Joyce', 'Joy',
  'Karen', 'Katherine', 'Kathleen', 'Katja', 'Kay', 'Kimberly', 'Kim',
  'Laura', 'Laurie', 'Layla', 'Leslie', 'Lillian', 'Linda', 'Lisa', 'Lois', 'Loretta', 'Lori', 'Lorraine',
  'Louise', 'Lynn', 'Lynda',
  'Mai', 'Marilyn', 'Margaret', 'Marcia', 'Marianne', 'Marsha', 'Martha', 'Mary', 'Maria', 'Marie',
  'Melanie', 'Melinda', 'Melissa', 'Michele', 'Mila', 'Mildred', 'Monica',
  'Nancy', 'Norma', 'Octavia', 'Olivia', 'Ophelia',
  'Pamela', 'Patty', 'Patricia', 'Paula', 'Penny', 'Peggy', 'Phyllis',
  'Rachel', 'Rebecca', 'Regina', 'Ricca', 'Riley', 'Rita', 'Roberta', 'Robin', 'Rosa', 'Rosemary', 'Ruby',
  'Roxanne', 'Rhonda',
  'Sally', 'Sandra', 'Sarah', 'Sharon', 'Sheila', 'Sherry', 'Shirley', 'Skylar', 'Stephanie', 'Sue', 'Susan',
  'Sylvia', 'Suzanne',
  'Teresa', 'Theresa', 'Terri', 'Tina', 'Toni', 'Tommy', 'Tyche',
  'Valerie', 'Vanessa', 'Vicky', 'Victoria', 'Virginia',
  'Wanda', 'Wendy', 'Yuki', 'Yolanda', 'Yvonne', 'Zoe', 'Zoey'
];

export const MASCULINE_NAMES = [
  'Alfred', 'Allan', 'Albert', 'Alvin', 'Amir', 'Andrew', 'Anthony', 'Arthur',
  'Barry', 'Benjamin', 'Bernard', 'Bill', 'Billy', 'Bobby', 'Brad', 'Bradley', 'Brent', 'Brian', 'Bruce',
  'Caleb', 'Calvin', 'Carlos', 'Carl', 'Charlie', 'Christopher', 'Chris', 'Clifford', 'Craig', 'Curtis',
  'Dale', 'Dana', 'Dan', 'Daniel', 'Danny', 'David', 'Dean', 'Dennis', 'Don', 'Donald', 'Donnie', 'Douglas', 'Dwight',
  'Earl', 'Eddie', 'Edwin', 'Edward', 'Ernest', 'Eugene', 'Eric',
  'Francis', 'Frank', 'Franklin', 'Freddie', 'Fred', 'Frederick',
  'Gary', 'Gene', 'Gerard', 'Gerald', 'Gilbert', 'Glenn', 'Gordon', 'Greg', 'Gregory', 'Guy',
  'Harold', 'Harvey', 'Harry', 'Herbert', 'Herman', 'Howard', 'Hugh', 'Isiah',
  'Jack', 'Jackie', 'Jackson', 'Jaxon', 'James', 'Jay', 'Jayden', 'Jeff', 'Jeffery', 'Jerry', 'Jesse',
  'Jim', 'Jimmy', 'Joel', 'John', 'Johnny', 'Jonathan', 'Jose', 'Joseph', 'Juan',
  'Karl', 'Kaden', 'Keith', 'Kelly', 'Kent', 'Kerry', 'Kim', 'Kirk', 'Kurt',
  'Larry', 'Lars', 'Lawrence', 'Lee', 'Leo', 'Leonard', 'Leroy', 'Lester', 'Lewi', 'Lloyd', 'Lonnie', 'Louis',
  'Manuel', 'Marvin', 'Mark', 'Martin', 'Matthew', 'Mayson', 'Melvin', 'Micheal', 'Mike', 'Milton',
  'Nathan', 'Neil', 'Nicholas', 'Noah', 'Norman',
  'Oliver', 'Oscar', 'Owen',
  'Patrick', 'Paul', 'Perry', 'Peter', 'Phillip', 'Philip', 'Quinn',
  'Randy', 'Randall', 'Ray', 'Raymond', 'Reginald', 'Richard', 'Rick', 'Ricky', 'Robert', 'Robin',
  'Rodney', 'Roger', 'Ronald', 'Ronnie', 'Roy', 'Russell',
  'Samuel', 'Scott', 'Sean', 'Stephen', 'Steve', 'Stanley', 'Stuart',
  'Ted', 'Theodore', 'Terry', 'Thomas', 'Tim', 'Timothy', 'Tom', 'Tommy', 'Tony',
  'Vincent', 'Victor',
  'Walter', 'Warren', 'Wayne', 'Wesley', 'William', 'Xavier', 'Yorick'
];

export const SURNAMES = [
  'Adams', 'Alexander', 'Allen', 'Alvarez', 'Anderson', 'Arnold', 'Bailey', 'Baker', 'Barnes', 'Bell',
  'Bennett', 'Black', 'Bobrov', 'Boom', 'Boyd', 'Bradley', 'Brown', 'Bryant', 'Burns', 'Butler',
  'Campbell', 'Castro', 'Castillo', 'Carter', 'Chavez', 'Chaing', 'Chou', 'Clark', 'Clements', 'Cole',
  'Coleman', 'Collins', 'Cooper', 'Cox', 'Crawford', 'Cruz',
  'Daniels', 'Davis', 'Diaz', 'Dixon', 'Dunn',
  'Edwards', 'Elliott', 'Ellis', 'Evans',
  'Fernandez', 'Ferguson', 'Fisher', 'Flores', 'Ford', 'Fox', 'Freeman',
  'Gardner', 'Garvey', 'Garcia', 'Giovanni', 'Gibson', 'Gonzalez', 'Gonzales', 'Gordon', 'Gray', 'Green',
  'Griffin', 'Graham',
  'Hamilton', 'Hansen', 'Hall', 'Hart', 'Harris', 'Harrison', 'Hawkins', 'Hayes', 'Henderson', 'Henry',
  'Herrera', 'Hicks', 'Hill', 'Holmes', 'Hoffman', 'Howard', 'Hunter', 'Hunt',
  'Jackson', 'James', 'Jenkins', 'Jimenez', 'Johnson', 'Jordan', 'Jones',
  'Kawolski', 'Kelley', 'Kelly', 'Kennedy', 'King', 'Kim', 'Knight',
  'Lee', 'Lewis', 'Long', 'Lopez',
  'Martin', 'Marshall', 'Mason', 'Martinez', 'McDonald', 'Medina', 'Mendoza', 'Meyer', 'Miller',
  'Mitchell', 'Moore', 'Morales', 'Morgan', 'Moreno', 'Murray', 'Murphy',
  'Nakano', 'Nelson', 'Nguyen', 'Nichols',
  'Olson', 'Ortiz', 'Owens',
  'Palmer', 'Pan', 'Parker', 'Patterson', 'Payne', 'Perez', 'Perry', 'Peterson', 'Phillips', 'Pierce',
  'Powell', 'Price',
  'Ramirez', 'Ramos', 'Reyes', 'Richardson', 'Rivera', 'Robards', 'Robertson', 'Robinson', 'Rodriguez',
  'Romero', 'Romara', 'Ross', 'Rubins', 'Russell',
  'Sanchez', 'Sanders', 'Savinelli', 'Schmidt', 'Scott', 'Shaw', 'Simpson', 'Simmons', 'Smith', 'Snyder',
  'Spencer', 'Stevens', 'Stewart', 'Stone',
  'Taylor', 'Thomas', 'Thompson', 'Torres', 'Tran', 'Turner',
  'Vasquez', 'Wallace', 'Wagner', 'Walker', 'Ward', 'Washington', 'Watson', 'Wells', 'West', 'Weaver',
  'White', 'Wilson', 'Wood', 'Woods', 'Wright', 'Wu', 'Young'
];

export const rollName = (): string => {
  const first = roll(2) === 1 ? pick(FEMININE_NAMES) : pick(MASCULINE_NAMES);
  return `${first} ${pick(SURNAMES)}`;
};

// ===================== AGE (pg.180) =====================
export const rollAge = (): string => {
  const r = roll(20);
  if (r <= 3) return 'Child';
  if (r <= 6) return 'Teenager';
  if (r <= 12) return 'Adult';
  if (r <= 16) return 'Middle-aged';
  if (r <= 19) return 'Old';
  return 'Ancient';
};

// ===================== DEMEANOR (pg.181) =====================
// Roll a d20 to determine Odds or Evens, then a d20 on that column.
export const DEMEANOR_ODDS = [
  'Angry', 'Bitter', 'World Weary', 'Excitable', 'Enthusiastic', 'Naive', 'Hardened', 'Hopeful',
  'Optimistic', 'Happy', 'Resigned', 'Weird', 'Suspicious', 'Nervous', 'Professional', 'Addict',
  'Paranoid', 'Insecure', 'Disreputable', 'Ruthless'
];

export const DEMEANOR_EVENS = [
  'Brave', 'Idealist', 'Sincere', 'Insincere', 'Friendly', 'Loner', 'Resentful', 'Infamous/Famous',
  'Helpful', 'Hostile', 'Protective', 'Irresponsible', 'Reluctant', 'Savage', 'Loyal', 'Lonely',
  'Desperate', 'Peaceful', 'Creative', 'Shifty'
];

export const rollDemeanor = (): string =>
  roll(20) % 2 === 1 ? DEMEANOR_ODDS[roll(20) - 1] : DEMEANOR_EVENS[roll(20) - 1];

// ===================== DISTINCTIVE FEATURES (pg.182) =====================
// The book instructs rolling twice: once on each column.
export const FEATURES_ROLL_ONE = [
  'Dyed Hair', 'Missing limb', 'Finely dressed', 'Vault-Tec ID', 'Named weapon',
  'Well-maintained equipment', 'Emaciated', 'All Faction symbols removed from equipment',
  'Pre-War affectation', 'Pack Brahmin', 'Scarred', 'Beat up', 'Elegant', 'Limited edition bottle caps',
  'Refuses to be out in daylight', 'Voice at odds with their appearance/distinctive voice',
  'Has a potted plant', 'Imaginary friend', 'Thinks they are a [CREATURE]', 'Spotlessly clean'
];

export const FEATURES_ROLL_TWO = [
  'Addict', 'Overstuffed pack', 'Unarmed and unarmored', 'Beans', 'Shackles', 'Visible Cybernetics',
  'Exposed Wires', 'Thirst Zapper', 'Sponsored', 'Fancy hat', 'Tin foil hat', 'Deathclaw skull',
  'Unusual pet or companion', 'Bobble heads',
  'Thinks all monsters are adorable and can be trained if you just put your mind to it',
  'Impersonating someone', 'Wild-eyed', 'Unique style', 'Always has the radio on',
  'Seems to be affiliated with every Faction'
];

export const rollFeatures = (): [string, string] =>
  [FEATURES_ROLL_ONE[roll(20) - 1], FEATURES_ROLL_TWO[roll(20) - 1]];

// ===================== PROFESSION (pg.182-183) =====================
export const PROFESSIONS = [
  'Trader', 'Leader', 'Farmer', 'Guard', 'Cook', 'Scout', 'Settler', 'Informer', 'Tinkerer',
  'Doctor/Scientist', 'Hunter', 'Scavenger', 'Slave/Slaver', 'Raider', 'Rookie', 'Courier',
  'Traveler', 'Survivor', 'Runaway', 'Diplomat/Con Artist'
];

export const rollProfession = (): string => PROFESSIONS[roll(20) - 1];

// ===================== SECRETS (pg.183) =====================
export const NPC_SECRETS = [
  "Isn't who they appear to be.",
  'Disillusioned with their Faction.',
  'Hid something of great importance.',
  'Harbors deep regrets about their life.',
  'Thinks they are destined for something great.',
  'Has done everything in accordance with a complex plan.',
  'Is deeply connected to an important event or person.',
  'Is exactly who they appear to be.',
  'Never wanted to be what they have become.',
  'Is in love with a known NPC.',
  'Has information on a Faction that could change everything.',
  'Is addicted to Nuka-Cola.',
  'Meets up regularly with strangers, but nobody knows who or why.',
  'Did something that nobody can find out about.',
  'Is in possession of a legendary weapon and keeps it hidden.',
  'Faked their own death to escape their past.',
  'Is the puppet or puppet master of a powerful Faction.',
  "Their reputation is built on a lie, and they're terrified that if anyone finds out, it'll all fall apart.",
  'Collects Hubris Comics memorabilia at all costs.',
  'Knows where there is a huge stash of Pre-War records, but hates the radio.'
];

export const rollSecret = (): string => NPC_SECRETS[roll(20) - 1];

// ===================== TRUTHS (pg.184) =====================
export const NPC_TRUTHS = [
  'Outdoorsman: They hate sleeping indoors and always prefer the open sky.',
  "Pacifist: They don't believe in violence but will defend themselves if absolutely necessary.",
  'Supertaster: They can identify radiation levels just by taste — not that they recommend it.',
  'Superstitious: They refuse to break certain rituals or taboos.',
  'Explosives expert: They know how to build a bomb from almost anything but insist they\'re "retired."',
  'Strange trinket: They always carry a small, seemingly useless item but refuse to explain why.',
  'Actor: They are an incredible liar and can weave believable stories on command.',
  'Picky eater: They refuse to eat certain foods due to an obscure pre-war belief or personal experience.',
  "Lockpicker: They can pick almost any lock, but they're not a thief — supposedly.",
  'Sleeptalker: They talk in their sleep, and what they say might be disturbing.',
  'Owed a favour: They once saved someone important, but never took credit for it.',
  'Erudite: They are incredibly well-read, able to quote obscure pre-war literature.',
  'Wrathful: They hold a grudge easily, and let it go hard.',
  'Old school: They distrust technology, even simple things like radios.',
  'Compassionate: They have a soft spot for all the sob stories of the wasteland.',
  'Phobia: They have a fear of water, fire, heights, or similar.',
  'Ruthless: They would sell out their own grandmother for a handful of caps.',
  'Ambitious: They will not stop until they are the best at their chosen profession.',
  'Informant: They secretly work for a [FACTION].',
  'Deceptively young or old: They are much older or younger than they seem.'
];

export const rollNpcTruth = (): string => NPC_TRUTHS[roll(20) - 1];

// ===================== FULL NPC GENERATOR =====================
export interface GeneratedNpc {
  name: string;
  faction: string;
  age: string;
  demeanor: string;
  features: [string, string];
  profession: string;
  secret: string;
  truth: string;
}

export const generateFullNpc = (overrides?: Partial<GeneratedNpc>): GeneratedNpc => ({
  faction: rollFaction(),
  name: rollName(),
  age: rollAge(),
  demeanor: rollDemeanor(),
  features: rollFeatures(),
  profession: rollProfession(),
  secret: rollSecret(),
  truth: rollNpcTruth(),
  ...overrides
});

/** Back-compatible generator returning the {name, description} shape used by DataTab. */
export const generateNpc = (): { name: string; description: string } => {
  const npc = generateFullNpc();
  return {
    name: npc.name,
    description:
      `Faction: ${npc.faction} | Age: ${npc.age} | Demeanor: ${npc.demeanor} | Profession: ${npc.profession}\n` +
      `Features: ${npc.features[0]}; ${npc.features[1]}\n` +
      `Secret: ${npc.secret}\n` +
      `Truth: ${npc.truth}`
  };
};

// ===================== DANGEROUS NPCS (pg.185-188) =====================

export const rollDangerousNpcThreat = (): number => {
  const r = roll(20);
  if (r <= 8) return 1;
  if (r <= 16) return 2;
  return 3;
};

export interface DangerousNpcAbility {
  range: [number, number];
  faction: string;
  name: string;
  description: string;
  grants?: string;
}

export const DANGEROUS_NPC_ABILITIES: DangerousNpcAbility[] = [
  { range: [1, 1], faction: 'Children of Atom', name: "Atom's Glow", description: 'The NPC fires their Gamma Gun (1 Radiation Damage).', grants: 'Gamma Gun and Vestments' },
  { range: [2, 2], faction: 'Gunners', name: 'Grenadier', description: 'The NPC hides behind cover and throws a Frag Grenade (Damage 2). They will do this even if allies would be caught in the blast.', grants: 'Frag Grenade and Light Armor' },
  { range: [3, 4], faction: 'Minutemen', name: 'Flare Gun', description: 'Firing their Flare Gun into the air, the NPC summons reinforcements. Two additional Minutemen arrive (Threat 1) at the beginning of the next Round. This cannot be used again this Encounter by any NPC.', grants: 'Flare Gun and Laser Musket' },
  { range: [5, 6], faction: 'Railroad', name: 'Follow the Freedom Trail', description: 'The NPC has prepared some traps in the area; the next time you roll a complication this encounter while in Danger, suffer 2 Damage.', grants: 'Railway Rifle' },
  { range: [7, 8], faction: 'Wasteland Survivors', name: 'Truce', description: 'The NPC attempts to call a truce, though it could be a trick… If you use the De-escalate Action, its difficulty is reduced by 1 in your next turn. All other Skill test difficulties are increased by 1.' },
  { range: [9, 10], faction: 'Vault Dwellers', name: 'V.A.T.S.', description: 'The NPC uses their Vault-Tec Assisted Targeting System to get a shot off. Suffer 1 Damage and an [INJURY].', grants: 'Vault Jumpsuit' },
  { range: [11, 12], faction: 'No Faction', name: 'Cut and Run', description: 'The NPC decides against the fight and flees. They are removed from the Encounter and may return in a later one.' },
  { range: [13, 14], faction: 'Mercenary', name: 'Ready for Anything', description: 'The Mercenary takes aim. Pass an AGI (Athletics) skill test at difficulty 1 or suffer double Damage from the Mercenary\'s Aggressive Action.' },
  { range: [15, 16], faction: 'New California Republic', name: 'Sic Semper Tyrannis', description: 'Add a Threat 3 NCR Ranger NPC to the Encounter. If there is already one in the Encounter, they take a Turn.', grants: 'Combat Rifle and Light Armor' },
  { range: [17, 17], faction: "Caesar's Legion", name: 'For Caesar!', description: 'The legionary launches their pilum (1 Damage); if you suffer the damage you gain an [INJURY].', grants: 'Pilum and Machete' },
  { range: [18, 18], faction: 'The Cult of the Mothman', name: 'He Comes…', description: 'In a sudden burst of noise, you suffer 2 Damage. From this moment on, you get the strangest feeling of being watched…', grants: 'Immunity (Radiation)' },
  { range: [19, 19], faction: 'Followers of the Apocalypse', name: 'Offer of peace', description: 'The Followers attempt to call a truce. You may immediately attempt the De-escalate Action; its difficulty is reduced by 1 to a minimum of 1.' },
  { range: [20, 20], faction: 'Enclave', name: 'Plasma Grenade', description: 'The Enclave soldier throws a Plasma Grenade (Damage 3); they will not do this if an ally would be caught in the blast.', grants: 'X-01 Power Armor (max three NPCs per encounter) and Immunity (Radiation)' }
];

/** If the NPC already has a Faction, use the matching ability; otherwise roll
 *  (and the NPC becomes part of that Faction). */
export const rollDangerousNpcAbility = (faction?: string): DangerousNpcAbility => {
  if (faction) {
    const match = DANGEROUS_NPC_ABILITIES.find(a => a.faction.toLowerCase() === faction.toLowerCase());
    if (match) return match;
  }
  return fromRange(DANGEROUS_NPC_ABILITIES, roll(20));
};

const fromRange = <T extends { range: [number, number] }>(table: T[], r: number): T =>
  table.find(e => r >= e.range[0] && r <= e.range[1]) ?? table[table.length - 1];

export const DANGEROUS_NPC_WEAPONS = [
  'Light melee weapons; Blades and Tire Irons.',
  'Heavy melee weapons; Sledgehammers and Rippers.',
  'Light ranged weapons; Pistols and other Small Guns.',
  'Heavy ranged weapons; Miniguns and Flamers.',
  'A mix of light melee weapons and light ranged weapons.',
  'A mix of heavy melee weapons and light ranged weapons.',
  'A mix of light melee weapons and heavy ranged weapons.',
  'A mix of heavy melee weapons and heavy ranged weapons.',
  'A mix of light melee weapons and explosives.',
  'A mix of light ranged weapons and explosives.'
];

export const rollDangerousNpcWeapons = (): string =>
  DANGEROUS_NPC_WEAPONS[Math.ceil(roll(20) / 2) - 1];

export interface DangerousNpcStatBlock {
  name: string;
  threat: number;
  weapons: string;
  ability: DangerousNpcAbility;
  /** The standard Dangerous NPC action spread (pg.185). */
  actions: {
    aggressive: string; // 1-13
    cautious: string;   // 14-17
    special: string;    // 18-20
  };
}

/** Builds the Dangerous NPC Stat Block per pg.185: standard actions on 1-13 /
 *  14-17, faction Special Ability on 18-20. */
export const generateDangerousNpc = (name?: string, faction?: string): DangerousNpcStatBlock => {
  const threat = rollDangerousNpcThreat();
  const ability = rollDangerousNpcAbility(faction);
  const bonus = threat >= 2 ? ' (3 if they have a heavy or unique weapon, +1 for Threat 2-3 NPCs)' : '';
  return {
    name: name ?? rollName(),
    threat,
    weapons: rollDangerousNpcWeapons(),
    ability,
    actions: {
      aggressive: `(1-13) The NPC attacks, dealing 1 Damage or 2 if they have a heavy or unique weapon${bonus}.`,
      cautious: '(14-17) The NPC takes cover; they cannot be targeted by ranged attacks next action — OR — the NPC rushes toward you, weapon raised.',
      special: `(18-20) ${ability.name} [${ability.faction}]: ${ability.description}${ability.grants ? ` (Gains: ${ability.grants})` : ''}`
    }
  };
};

// ===================== DANGEROUS NPC GROUP (pg.188) =====================
export interface DangerousNpcGroup {
  count: number;
  activity: string;
}

export const rollDangerousNpcGroup = (): DangerousNpcGroup => {
  const r = roll(20);
  const activities = [
    'Scavenging', 'Resting', 'Travelling', 'Repairing their tools', 'Arguing among themselves',
    'Healing their wounded', 'Guarding the area', 'Looting a [FACTION] corpse', 'Wayfinding',
    'Burying their dead'
  ];
  const activity = activities[Math.ceil(r / 2) - 1];
  let count: number;
  if (r <= 2) count = 1;
  else if (r <= 6) count = 2;
  else if (r <= 10) count = 3;
  else if (r <= 14) count = 4;
  else if (r <= 18) count = 5;
  else {
    // 19-20: roll twice and add both results together
    const sub = () => {
      const s = roll(18);
      if (s <= 2) return 1;
      if (s <= 6) return 2;
      if (s <= 10) return 3;
      if (s <= 14) return 4;
      return 5;
    };
    count = sub() + sub();
  }
  return { count, activity };
};
