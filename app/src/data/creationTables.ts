export const VAULT_EXPERIMENTS = [
  { roll: 1, name: 'Division', desc: 'The people here were split into various groups and psychologically pushed to violently hate one another.', truths: ['Paranoid residents', 'Poster-covered'] },
  { roll: 2, name: 'Spiked Supplies', desc: 'Various Chems were pumped into the Vault via water and air filtration systems.', truths: ['Unknowing addicts', 'Ruinous disarray'] },
  { roll: 3, name: 'Propaganda', desc: 'Endless amounts of propaganda pushing a specific Vault-Tec approved message.', truths: ['Head-ache inducing messages', 'Fanatics'] },
  { roll: 4, name: 'Genetic tests', desc: 'Genetically modified crops and flora worked into food supplies.', truths: ['Moss-covered', 'Strangely humid'] },
  { roll: 5, name: '2nd Amendment stress test', desc: 'A wealth of firearms and armor introduced just to see what happens.', truths: ['Bullet-holes', 'Overly polite residents'] },
  { roll: 6, name: 'Artificial Intelligence', desc: 'Overseen by an AI with inhuman views on caring.', truths: ['Cameras', 'Security turrets'] },
  { roll: 7, name: 'Military Perfection', desc: 'Aiming to create the perfect soldier through rigorous discipline.', truths: ['Spotless', 'Disciplined residents'] },
  { roll: 8, name: 'Pharmaceutical Trials', desc: 'Creating a series of revolutionary new Chems.', truths: ['Laboratories', 'Test subject cells'] },
  { roll: 9, name: 'Sonic Acclimatisation', desc: 'Endless blaring noise from speakers across the Vault.', truths: ['Blaring claxons', 'Constant music'] },
  { roll: 10, name: 'Long-Term Viability', desc: 'Directive: "DO NOT OPEN THE VAULT." Untempered command.', truths: ['Fastidiously obedient', 'Cult of personality'] },
  { roll: 11, name: 'Anarchism by design', desc: 'Systems designed to fail two decades after sealing.', truths: ['Ruined machinery', 'Ingenious inventors'] },
  { roll: 12, name: 'Calvinist Reversal', desc: 'Wealth is no longer even a concept here.', truths: ['Communist ideals', 'Degeneration'] },
  { roll: 13, name: 'Weighted Ecology', desc: 'Inordinate misbalance in the genders of its inhabitants.', truths: ['Unbalanced population', 'Patriarchal / Matriarchal'] },
  { roll: 14, name: 'Control Vault', desc: 'No recorded experiment.', truths: ['Friendly faces', 'Naive residents'] },
  { roll: 15, name: 'Blood Cult', desc: 'Participating in a yearly sacrifice.', truths: ['Desperate cultists', 'Death lottery'] },
  { roll: 16, name: 'Ghoul Pit', desc: 'Radiation leaked into the Vault turning many into Ghouls.', truths: ['Ghoul infested', 'Radiation shielding'] },
  { roll: 17, name: 'Gambler\'s Den', desc: 'Each dispute settled with gambling.', truths: ['Wasteland casino', 'Roulette government'] },
  { roll: 18, name: 'Treasury', desc: 'Impenetrable inner Vault filled with pre-War valuables.', truths: ['Vault-of-Wonders', 'Locked inner Vault'] },
  { roll: 19, name: 'Unfinished', desc: 'Vault was never fully constructed.', truths: ['Jury rigged systems', 'Molerat infestation'] },
  { roll: 20, name: 'Cryogenics', desc: 'Cryogenic pods line the walls.', truths: ['Eerily silent', 'Pristine'] }
];

export const VAULT_POPULATIONS = [
  { min: 1, max: 4, name: 'One, Including You', desc: 'Sole survivor of your Vault.', truths: ['Abandoned', 'Modern mausoleum'] },
  { min: 5, max: 6, name: 'Less Than 10', desc: 'A few of you remaining.', truths: ['Bad memories', 'Boarded up rooms'] },
  { min: 7, max: 10, name: 'A Few Dozen', desc: 'A handful of small families.', truths: ['Family and friends', 'Smells of familiarity'] },
  { min: 11, max: 14, name: 'Insular Community', desc: 'Fewer of you now. Opening the door is a taboo.', truths: ['Isolated residents', 'Fearful atmosphere'] },
  { min: 15, max: 17, name: 'Mixed Community', desc: 'Doors opened years ago, trading hub.', truths: ['Trading hub', 'Initiation rites'] },
  { min: 18, max: 20, name: 'Thriving Community', desc: 'As many if not more than its original population.', truths: ['Bustling metropolis', 'Squalid slums'] }
];

export const VAULT_REPUTATIONS = [
  { min: 1, max: 4, name: 'Hostile', desc: 'Despised by inhabitants.' },
  { min: 5, max: 8, name: 'Cautious', desc: 'Reason to mistrust you.' },
  { min: 9, max: 12, name: 'Neutral', desc: 'Mixed feelings or low impression.' },
  { min: 13, max: 20, name: 'Friendly', desc: 'Good terms with former neighbours.' }
];

export const GOAT_TEMPLATES = [
  { roll: 1, name: 'Youth', skills: { Athletics: 4, Sneak: 1, Speech: 2, Survival: 2, Throwing: 4, Unarmed: 2 } },
  { roll: 2, name: 'Musician', skills: { Athletics: 2, Barter: 4, Explosives: 2, Lockpick: 1, 'Melee Weapons': 1, Speech: 5 } },
  { roll: 3, name: 'Engineer', skills: { 'Big Guns': 3, 'Energy Weapons': 2, Explosives: 2, Lockpick: 2, Pilot: 2, Repair: 4 } },
  { roll: 4, name: 'Stay-at-home parent', skills: { Athletics: 2, Barter: 4, Repair: 1, Sneak: 1, Speech: 3, Survival: 4 } },
  { roll: 5, name: 'Troublemaker', skills: { Athletics: 2, Lockpick: 3, 'Melee Weapons': 2, Sneak: 2, Throwing: 2, Unarmed: 4 } },
  { roll: 6, name: 'Hydroponics Specialist', skills: { 'Energy Weapons': 2, Medicine: 3, Repair: 3, Science: 4, Survival: 3 } },
  { roll: 7, name: 'Thief', skills: { Athletics: 1, Barter: 3, Lockpick: 4, Sneak: 4, Survival: 2, Throwing: 1 } },
  { roll: 8, name: 'Medic', skills: { 'Energy Weapons': 1, Medicine: 4, 'Melee Weapons': 2, Science: 3, Speech: 2, Survival: 3 } },
  { roll: 9, name: 'Cook', skills: { Barter: 4, Medicine: 3, 'Melee Weapons': 4, Survival: 4 } },
  { roll: 10, name: 'Radio operator', skills: { Barter: 3, Explosives: 2, Pilot: 2, Repair: 2, Science: 2, Speech: 4 } },
  { roll: 11, name: 'Security', skills: { Athletics: 4, 'Energy Weapons': 2, Explosives: 2, 'Melee Weapons': 2, 'Small Guns': 4, Speech: 1 } },
  { roll: 12, name: 'Chemist', skills: { 'Energy Weapons': 2, Explosives: 4, Medicine: 1, Science: 4, Survival: 3, Throwing: 1 } },
  { roll: 13, name: 'Sanitation Specialist', skills: { Lockpick: 3, 'Melee Weapons': 3, Repair: 3, Survival: 3, Throwing: 3 } },
  { roll: 14, name: 'Fitness instructor', skills: { Athletics: 4, Medicine: 2, Speech: 2, Throwing: 4, Unarmed: 3 } },
  { roll: 15, name: 'Armorer', skills: { 'Big Guns': 2, 'Energy Weapons': 2, Explosives: 3, Pilot: 2, Repair: 4, 'Small Guns': 2 } },
  { roll: 16, name: 'Human Resources', skills: { Barter: 4, Lockpick: 3, Medicine: 2, 'Melee Weapons': 1, Pilot: 2, Speech: 3 } },
  { roll: 17, name: 'Enforcer', skills: { Athletics: 1, 'Big Guns': 2, 'Energy Weapons': 2, Medicine: 2, 'Melee Weapons': 3, 'Small Guns': 3, Throwing: 2 } },
  { roll: 18, name: 'Therapist', skills: { Barter: 3, Lockpick: 3, Medicine: 3, Science: 2, Speech: 4 } },
  { roll: 19, name: 'Computer Specialist', skills: { 'Energy Weapons': 3, Lockpick: 3, Pilot: 3, Repair: 2, Science: 4 } },
  { roll: 20, name: 'Overseer', skills: { Barter: 4, 'Energy Weapons': 2, Medicine: 2, Pilot: 3, Speech: 4 } }
];

export const EQUIPMENT_MAPPING: Record<string, {name: string, quantity: number, weight: number}> = {
  'Athletics': { name: 'Buffout', quantity: 3, weight: 0.1 },
  'Barter': { name: 'Vault-Tec Bobbleheads', quantity: 3, weight: 1 },
  'Big Guns': { name: 'Flamer', quantity: 1, weight: 15 },
  'Energy Weapons': { name: 'Laser Pistol', quantity: 1, weight: 3 },
  'Explosives': { name: 'Molotov Cocktails', quantity: 3, weight: 0.5 },
  'Lockpick': { name: 'Bobby Pins', quantity: 6, weight: 0 },
  'Medicine': { name: 'Stimpaks', quantity: 3, weight: 0 },
  'Melee Weapons': { name: 'Baseball Bat', quantity: 1, weight: 3 },
  'Pilot': { name: 'Fusion cores', quantity: 3, weight: 4 },
  'Repair': { name: 'Multi Tool', quantity: 1, weight: 1 },
  'Science': { name: 'Lab Coat', quantity: 1, weight: 2 },
  'Small Guns': { name: '10mm Pistol', quantity: 1, weight: 3 },
  'Sneak': { name: 'Calmex', quantity: 3, weight: 0.1 },
  'Speech': { name: 'Formal Clothing', quantity: 1, weight: 2 },
  'Survival': { name: 'Hunting knife', quantity: 1, weight: 1 },
  'Throwing': { name: 'Throwing knives', quantity: 3, weight: 0.5 },
  'Unarmed': { name: 'Brass Knuckles', quantity: 1, weight: 1 }
};

export const QUEST_GOALS = [
  { roll: 1, name: 'Abandoned', desc: 'Find my parent and find out why he abandoned me.' },
  { roll: 2, name: 'Water Shortage', desc: 'Discover a source of clean water before my Vault dies of thirst.' },
  { roll: 3, name: 'Vengeance', desc: 'Track down the Raiders who attacked my home and make them pay.' },
  { roll: 4, name: 'Missing People', desc: 'Find out why people in my Vault are vanishing.' },
  { roll: 5, name: 'Mysterious Signal', desc: 'Uncover the truth behind the mysterious radio signal.' },
  { roll: 6, name: 'A Cure', desc: 'Locate a pre-War scientist rumored to have a cure.' },
  { roll: 7, name: 'The Ultimate Weapon', desc: 'Retrieve a lost nuclear launch key.' },
  { roll: 8, name: 'End the Slavers', desc: 'Dismantle a ruthless slaver operation.' },
  { roll: 9, name: 'Reunited', desc: 'Reunite with my missing sibling.' },
  { roll: 10, name: 'Peace', desc: 'Broker peace between my Vault and another.' },
  { roll: 11, name: 'Power Failure', desc: 'Recover an experimental power core.' },
  { roll: 12, name: 'Warmachine', desc: 'Track down a rogue sentient program.' },
  { roll: 13, name: 'Destabalised', desc: 'Find out who assassinated the leader of my Vault.' },
  { roll: 14, name: 'Legend Hunter', desc: 'Hunt a legendary mutant creature.' },
  { roll: 15, name: 'Heist', desc: 'Heist of a unique weapon from the Brotherhood of Steel.' },
  { roll: 16, name: 'Find Paradise', desc: 'Find a lost pre-War utopia.' },
  { roll: 17, name: 'Expose the Enclave', desc: 'Infiltrate a secret Enclave base.' },
  { roll: 18, name: 'Find the Secret', desc: 'Retrieve a long-lost journal.' },
  { roll: 19, name: 'National Treasure', desc: 'Steal an American national treasure.' },
  { roll: 20, name: 'Cult Slayer', desc: 'Stop a deranged cult from awakening something buried.' }
];

// Full Blocker Table (pg.74-75) — all 10 blocker types.
export const QUEST_BLOCKERS = [
  { min: 1, max: 2, name: 'Unknown Location', desc: 'You do not know where you are going and will need additional information: a map or a knowledgeable NPC. Skip the Blocker Location step. Whenever you gain a Side Quest reward, you may replace it with the missing information and re-roll on this table (re-rolling 1-2), then generate a Blocker Location.' },
  { min: 3, max: 4, name: 'Guarded', desc: 'Your goal is heavily guarded by a set of threats that will require eliminating, bypassing, or distracting. When you arrive at the Blocker Location, generate a Foe.' },
  { min: 5, max: 6, name: 'Restricted Area', desc: 'Your goal lies in an area of the Wasteland you are not allowed, such as a hostile settlement or a private area of a friendly location. Generate a Settlement owned by a generated Faction.' },
  { min: 7, max: 8, name: 'Locked Down', desc: 'Your goal is hidden within a facility that requires a Key, Passcode, or a Difficulty 4 Lockpick or Science Skill Test to open. Whenever you gain a Side Quest reward, you may replace it with the Key or Passcode.' },
  { min: 9, max: 10, name: 'Irradiated', desc: 'Your goal lies within a heavily irradiated location you will need to protect yourself from. The Blocker Location gains the Irradiated Truth.' },
  { min: 11, max: 12, name: 'Mobile', desc: 'The goal moves often. Each time you Travel to a Location that is not the Blocker Location, roll a d20; on 5 or lower, the Blocker Location moves to an adjacent Unexplored Location.' },
  { min: 13, max: 14, name: 'Cost', desc: 'Completing this goal will come at great personal cost to you or a loved one. Determine what that cost may be; accept it or find a clever way around it.' },
  { min: 15, max: 16, name: 'Hunted', desc: 'Generate a Foe constantly hounding your footsteps. Whenever you Travel, roll a d20; on 19-20 your Hunter appears during your next Encounter. The range grows by 1 each time you Travel without meeting them, and resets to 19-20 when you do.' },
  { min: 17, max: 18, name: 'Politics', desc: 'Your goal is at the center of a dispute between two rival settlements. Generate two Settlements in directly adjacent locations and two opposed Factions. Side with one or de-escalate both to claim the goal — anything else turns both against you.' },
  { min: 19, max: 20, name: 'Split', desc: 'Your goal has been split between two locations. When you first reach your Goal you find half of it and generate a Side Quest whose reward is the Location of the other half. On completing it, generate another Blocker and Blocker Location in an Unexplored Location.' }
];

// Stage 1, Step 4: Vault Dweller NPC table (pg.57) — roll 4d20, one per column.
export const VAULT_NPC_NAMES = [
  'Silas', 'Marigold', 'Dorian', 'Juno', 'Rourke', 'Selene', 'Clive', 'Isabelle', 'Harlan', 'Sable',
  'Mercer', 'Ivy', 'Ezra', 'Cassius', 'Lyra', 'Orson', 'Nova', 'Holden', 'Vesper', 'Magnus'
];

export const VAULT_NPC_APPEARANCES = [
  'Lanky', 'Stocky', 'Gaunt', 'Chiseled', 'Freckled', 'Tall', 'Hollow-cheeked', 'Wiry', 'Pale',
  'Broad-shouldered', 'Sun-kissed', 'Scarred', 'Bearded', 'Wrinkled', 'Sallow', 'Piercing-eyed',
  'Heavy set', 'Sharp-featured', 'Muscular', 'Rosy-cheeked'
];

export const VAULT_NPC_PERSONALITIES = [
  'Stoic', 'Cynical', 'Charismatic', 'Aloof', 'Hot-tempered', 'Jovial', 'Melancholic', 'Ambitious',
  'Pragmatic', 'Reckless', 'Whimsical', 'Conniving', 'Compassionate', 'Gullible', 'Pessimistic',
  'Dutiful', 'Manipulative', 'Sarcastic', 'Loyal', 'Obsessive'
];

export const VAULT_NPC_POSITIONS = [
  'Youth', 'Musician', 'Engineer', 'Stay-at-home parent', 'Troublemaker', 'Hydroponics Specialist',
  'Thief', 'Medic', 'Cook', 'Radio operator', 'Security', 'Chemist', 'Sanitation Specialist',
  'Fitness Instructor', 'Armorer', 'Human Resources', 'Enforcer', 'Therapist', 'Computer Specialist',
  'Overseer'
];

/** Rolls the 4-column Vault Dweller NPC (one d20 per column, per the book). */
export const rollVaultNpc = () => ({
  name: VAULT_NPC_NAMES[Math.floor(Math.random() * 20)],
  appearance: VAULT_NPC_APPEARANCES[Math.floor(Math.random() * 20)],
  personality: VAULT_NPC_PERSONALITIES[Math.floor(Math.random() * 20)],
  position: VAULT_NPC_POSITIONS[Math.floor(Math.random() * 20)]
});

export const getRandomValue = (max: number) => Math.floor(Math.random() * max) + 1;

export const rollD20 = () => getRandomValue(20);

// Stage 6 Randomizer Data
export const RANDOM_NAMES = [
  'Elias', 'Marlowe', 'Tessa', 'Jaxon', 'Delilah', 'Boone', 'Iris', 'Thorne', 
  'Cassidy', 'Gideon', 'Sawyer', 'Ramona', 'Flint', 'Odessa', 'Luther', 'Sable', 
  'Rex', 'Maeve', 'Tobias', 'Vex'
];

export const RANDOM_APPEARANCES = [
  'Redheaded', 'Balding', 'Freckled', 'Wrinkled', 'Scarred', 'Pale', 'Gaunt', 
  'Stocky', 'Lanky', 'Muscular', 'Wiry', 'Bearded', 'Sharp-featured'
];

export const RANDOM_PERSONALITIES = [
  'Optimistic', 'Suspicious', 'Cynical', 'Aloof', 'Hot-tempered', 'Jovial', 
  'Melancholic', 'Pragmatic', 'Reckless', 'Stoic', 'Whimsical', 'Compassionate', 
  'Pessimistic', 'Dutiful', 'Manipulative', 'Sarcastic'
];

export const RANDOM_MOTIVATIONS = [
  'Hope', 'Greed', 'Vengeance', 'Fear', 'Faith', 'Duty', 'Love', 'Spite', 
  'Honor', 'Curiosity', 'Discipline', 'Obsession'
];

export const getRandomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
