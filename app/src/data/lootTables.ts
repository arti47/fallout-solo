// Loot & Equipment tables — complete from Appendix 2 (pg.167-177).
// Item Values are in Stacks of Caps (used by the Trade action).
import type { GearItem } from '../store/gameState';

const roll = (max: number) => Math.floor(Math.random() * max) + 1;
const roll2d20 = () => roll(20) + roll(20);
const generateId = () => `loot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ===================== QUANTITY (pg.167) =====================
/** Rolls the book's Quantity table. 17-19 = roll twice (re-rolling 16+);
 *  20 = "a seemingly endless supply" (represented as 10, flagged endless). */
export const rollQuantity = (): { amount: number; endless: boolean } => {
  const r = roll(20);
  if (r <= 4) return { amount: 1, endless: false };
  if (r <= 7) return { amount: 2, endless: false };
  if (r <= 10) return { amount: 3, endless: false };
  if (r <= 13) return { amount: 4, endless: false };
  if (r <= 16) return { amount: 5, endless: false };
  if (r <= 19) {
    const sub = () => {
      let s = roll(20);
      while (s >= 16) s = roll(20);
      if (s <= 4) return 1;
      if (s <= 7) return 2;
      if (s <= 10) return 3;
      if (s <= 13) return 4;
      return 5;
    };
    return { amount: sub() + sub(), endless: false };
  }
  return { amount: 10, endless: true };
};

// ===================== CONDITIONS (pg.168) =====================
export const CONDITIONS = [
  'Shredded, broken, shattered',
  'Irradiated',
  'Rusted, mouldy, corroded',
  'Warped, dented, frayed',
  'Torn, brittle, fragile',
  'Wobbly, fizzing, unstable',
  'Jury-rigged, scrap-made, patchwork',
  "Small, dainty, child's",
  'Chipped, stained, scuffed',
  'Grimy, weathered, scratched',
  'Dull, sun-bleached, faded',
  'Lightweight, flimsy, thin',
  'Battered, well-worn, scuffed',
  'Heavy, clumsy, bulky',
  'Well-loved, personalized, sticker-covered',
  'Large, clunking, oversized',
  'Grimy, dirty, greasy',
  'Bloodstained',
  'Sturdy, reliable, thick',
  'Pristine, pre-war, mastercrafted'
];

export const rollCondition = (): string => CONDITIONS[roll(20) - 1];

// ===================== MODIFICATIONS (pg.168-169) =====================
export interface Modification {
  range: [number, number];
  name: string;
  description: string;
}

export const ARMOR_MODS: Modification[] = [
  { range: [1, 2], name: 'Lightweight', description: 'This item is lighter than usual. It might aid in tests that rely on swiftness.' },
  { range: [3, 4], name: 'Padded', description: 'Useful at negating Damage from explosions. It might reduce the difficulty of Endure Actions against explosions by 1.' },
  { range: [5, 6], name: 'Rubber lined', description: 'Makes you practically impervious to Electrical Damage. It might reduce the difficulty of Endure Actions against Electrical Damage by 1.' },
  { range: [7, 8], name: 'Asbestos lining', description: 'Heavily insulated against fire. It might reduce the difficulty of Endure Actions against fire Damage by 1.' },
  { range: [9, 10], name: 'Harness', description: 'You can carry large items strapped to your back. It might allow you to carry something huge you otherwise would not be able to.' },
  { range: [11, 12], name: 'Hazard coating', description: 'Protects against radiation. It might reduce the difficulty to Endure Radiation Damage by 1.' },
  { range: [13, 14], name: 'Autoinjector', description: 'Use Chems quickly in combat. It allows you to use the Patch Up action in combat by spending a Chem.' },
  { range: [15, 16], name: 'Hidden Compartment', description: 'Foes will never find something you put in here. You may hide one small item in this that no one else can find.' },
  { range: [17, 18], name: 'Camo', description: 'This armor makes you hard to spot. It reduces the difficulty of actions using a Stealth Skill Test by 1 if the camouflage matches the environment.' },
  { range: [19, 20], name: 'Spiked', description: "Can be used as a melee weapon. Useful when you've run out of everything else!" }
];

export const WEAPON_MODS: Modification[] = [
  { range: [1, 2], name: 'Lightweight', description: 'This item is lighter than usual. It might aid in tests that rely on swiftness.' },
  { range: [3, 4], name: 'Armor Piercing', description: 'This weapon is particularly good at getting through armour. It might reduce the difficulty of Oppose Actions against Armored foes by 1.' },
  { range: [5, 6], name: 'Electrified', description: 'This weapon stuns enemies hit by it. All Oppose Actions made with this weapon gain the following Additional Success — Stunning Wounds: roll a d20 when the Targeted Foe next Activates; on an 11+, they lose their Action.' },
  { range: [7, 8], name: 'Ignition', description: 'This weapon can set flammable targets alight. It might set foes on fire or interact with the environment in interesting ways.' },
  { range: [9, 10], name: 'Shredding', description: 'This weapon deals terrible Damage to unarmoured foes. It might reduce the difficulty of Oppose Actions against unarmored foes by 1.' },
  { range: [11, 12], name: 'Disguised', description: 'This weapon does not look like a weapon. It is easy to sneak into places and could make Outwit actions using it easier.' },
  { range: [13, 14], name: 'Silenced', description: 'This can only be applied to non-explosive ranged weapons. This weapon makes no sound when being used and could be used in cunning ways to Outwit a foe.' },
  { range: [15, 16], name: 'Scoped', description: 'This can only be applied to a ranged weapon. Excellent at long-range fighting; it makes it easier to engage Foes at longer distances and view far-off places.' },
  { range: [17, 18], name: 'Explosive', description: 'This can only be applied to a non-explosive ranged weapon. This weapon fires explosives that can deal with multiple foes at once. The weapon is now explosive.' },
  { range: [19, 20], name: 'Drum magazine', description: 'This can only be applied to a ranged weapon. This weapon rarely needs reloading: you need to suffer the "out of ammo" complication twice before this weapon runs out of ammo.' }
];

const fromRangeTable = <T extends { range: [number, number] }>(table: T[], r: number): T =>
  table.find(e => r >= e.range[0] && r <= e.range[1]) ?? table[table.length - 1];

export const rollArmorMod = (): Modification => fromRangeTable(ARMOR_MODS, roll(20));
export const rollWeaponMod = (): Modification => fromRangeTable(WEAPON_MODS, roll(20));

// ===================== ARMOR (pg.171) =====================
interface LootEntry {
  roll: number; // upper bound of the d20/2d20 range
  name: string;
  value: number;
  weight: number;
}

export const ARMOR_TABLE: LootEntry[] = [
  { roll: 2, name: 'Vault Suit / Patchwork Armor / Harness', value: 1, weight: 1 },
  { roll: 3, name: 'Football Helmet / Baseball Cap', value: 1, weight: 1 },
  { roll: 5, name: 'Pre-War Suit / Pre-War Dress', value: 1, weight: 1 },
  { roll: 6, name: 'Fedora / Summer Hat / Sunglasses', value: 1, weight: 1 },
  { roll: 8, name: 'Faction Uniform', value: 2, weight: 2 },
  { roll: 9, name: 'Night-Vision Goggles', value: 2, weight: 1 },
  { roll: 11, name: 'Leather Armor / Road Leathers / Raider Leathers', value: 2, weight: 2 },
  { roll: 12, name: 'Welding Goggles / Gasmask', value: 2, weight: 1 },
  { roll: 14, name: 'Metal Armor / Scrap Armor', value: 3, weight: 3 },
  { roll: 15, name: 'Metal Helmet / Scrap Helmet', value: 1, weight: 1 },
  { roll: 17, name: 'Combat Armor / Scout Armor', value: 3, weight: 3 },
  { roll: 18, name: 'Pre-War Combat Helmet', value: 2, weight: 2 },
  { roll: 20, name: 'Power Armor', value: 5, weight: 5 }
];

// ===================== RANGED WEAPONS (pg.174, roll 2d20) =====================
export const RANGED_WEAPONS: LootEntry[] = [
  { roll: 3, name: 'Fat Man', value: 5, weight: 5 },
  { roll: 5, name: 'Missile Launcher', value: 4, weight: 4 },
  { roll: 6, name: 'Railway Rifle', value: 3, weight: 3 },
  { roll: 7, name: 'Junk Jet', value: 2, weight: 2 },
  { roll: 8, name: 'Flamer', value: 3, weight: 3 },
  { roll: 9, name: 'Plasma Pistol', value: 3, weight: 2 },
  { roll: 10, name: 'Laser Rifle', value: 3, weight: 3 },
  { roll: 11, name: 'Institute Laser Rifle', value: 3, weight: 3 },
  { roll: 12, name: 'Syringer', value: 3, weight: 2 },
  { roll: 13, name: 'Hunting Rifle', value: 2, weight: 2 },
  { roll: 14, name: 'Assault Rifle', value: 2, weight: 2 },
  { roll: 15, name: 'Laser Musket', value: 3, weight: 3 },
  { roll: 16, name: 'Submachine Gun', value: 2, weight: 2 },
  { roll: 17, name: '10mm Pistol', value: 1, weight: 1 },
  { roll: 18, name: 'Pipe Bolt Action', value: 1, weight: 1 },
  { roll: 19, name: 'Auto Pipe Rifle', value: 1, weight: 1 },
  { roll: 21, name: 'Pipe Gun', value: 1, weight: 1 },
  { roll: 22, name: 'Auto Pipe Gun', value: 1, weight: 1 },
  { roll: 23, name: 'Pipe Revolver', value: 1, weight: 1 },
  { roll: 24, name: 'Pipe Bolt Action Rifle', value: 1, weight: 1 },
  { roll: 25, name: '10mm Auto Pistol', value: 2, weight: 1 },
  { roll: 26, name: 'Double-Barreled Shotgun', value: 2, weight: 2 },
  { roll: 27, name: '.44 Pistol', value: 2, weight: 1 },
  { roll: 28, name: 'Combat Rifle', value: 2, weight: 2 },
  { roll: 29, name: 'Scoped Hunting Rifle', value: 3, weight: 3 },
  { roll: 30, name: 'Combat Shotgun', value: 2, weight: 2 },
  { roll: 31, name: 'Institute Laser Pistol', value: 2, weight: 1 },
  { roll: 32, name: 'Laser Pistol', value: 2, weight: 1 },
  { roll: 33, name: 'Minigun', value: 4, weight: 4 },
  { roll: 34, name: 'Plasma Rifle', value: 4, weight: 3 },
  { roll: 35, name: 'Gatling Laser', value: 4, weight: 4 },
  { roll: 36, name: 'Gauss Rifle', value: 3, weight: 3 },
  { roll: 38, name: 'Heavy Incinerator', value: 4, weight: 4 },
  { roll: 40, name: 'Gamma Gun', value: 4, weight: 2 }
];

// ===================== MELEE WEAPONS (pg.175, roll 2d20) =====================
export const MELEE_WEAPONS: LootEntry[] = [
  { roll: 2, name: 'Deathclaw Gauntlet', value: 4, weight: 3 },
  { roll: 4, name: 'Shishkebab', value: 4, weight: 3 },
  { roll: 6, name: 'Sledgehammer', value: 2, weight: 3 },
  { roll: 8, name: 'Ripper', value: 3, weight: 2 },
  { roll: 10, name: 'Boxing Glove', value: 1, weight: 1 },
  { roll: 12, name: 'Baton', value: 1, weight: 1 },
  { roll: 14, name: 'Machete', value: 2, weight: 2 },
  { roll: 16, name: 'Walking Cane', value: 1, weight: 1 },
  { roll: 18, name: 'Pool Cue', value: 1, weight: 1 },
  { roll: 20, name: 'Switchblade', value: 1, weight: 1 },
  { roll: 22, name: 'Board', value: 1, weight: 2 },
  { roll: 24, name: 'Lead Pipe', value: 1, weight: 2 },
  { roll: 26, name: 'Rolling Pin', value: 1, weight: 1 },
  { roll: 28, name: 'Pipe Wrench', value: 1, weight: 1 },
  { roll: 30, name: 'Knuckles', value: 1, weight: 1 },
  { roll: 32, name: 'Tire Iron', value: 1, weight: 1 },
  { roll: 34, name: 'Sword', value: 2, weight: 2 },
  { roll: 36, name: 'Baseball Bat', value: 1, weight: 2 },
  { roll: 38, name: 'Power Fist', value: 3, weight: 2 },
  { roll: 40, name: 'Super Sledge', value: 4, weight: 4 }
];

// ===================== THROWN & EXPLOSIVES (pg.175, d20) =====================
export const THROWN_WEAPONS: LootEntry[] = [
  { roll: 1, name: 'Baseball Grenade', value: 2, weight: 1 },
  { roll: 3, name: 'Tomahawk', value: 1, weight: 1 },
  { roll: 5, name: 'Throwing Knife', value: 1, weight: 1 },
  { roll: 7, name: 'Javelin', value: 2, weight: 2 },
  { roll: 8, name: 'Frag Grenade', value: 2, weight: 1 },
  { roll: 9, name: 'Plasma Mine', value: 3, weight: 1 },
  { roll: 10, name: 'Bottlecap Mine', value: 3, weight: 1 },
  { roll: 11, name: 'Nuka Grenade', value: 4, weight: 1 },
  { roll: 12, name: 'Pulse Mine', value: 2, weight: 1 },
  { roll: 13, name: 'Baseball Grenade', value: 2, weight: 1 },
  { roll: 14, name: 'Molotov Cocktail', value: 1, weight: 1 },
  { roll: 15, name: 'Pulse Grenade', value: 2, weight: 1 },
  { roll: 16, name: 'Frag Mine', value: 2, weight: 1 },
  { roll: 17, name: 'Plasma Grenade', value: 3, weight: 1 },
  { roll: 18, name: 'Stick of Dynamite', value: 2, weight: 1 },
  { roll: 19, name: 'Cryo Grenade', value: 3, weight: 1 },
  { roll: 20, name: 'Nuke Mine', value: 3, weight: 1 }
];

// ===================== CHEMS (pg.172-173) =====================
// Roll a d20; on a 1, re-roll twice on the table.
export interface ChemEntry {
  roll: number;
  name: string;
  description: string;
  value: number;
  effects: Record<string, number>;
}

export const CHEMS: ChemEntry[] = [
  { roll: 2, name: 'Super Stimpak', description: 'A more potent version of the Stimpak.', value: 2, effects: { hp: 8 } },
  { roll: 3, name: 'Calmex', description: 'A light tranquilizer that relaxes higher, stressful brain functions.', value: 2, effects: {} },
  { roll: 4, name: 'Day Tripper', description: 'A mild hallucinogenic that trades an escape from reality for a mild numbness across the body.', value: 2, effects: {} },
  { roll: 5, name: 'Addictol', description: 'A quick and easy way to remove the physical and mental issues connected with Chem addiction. Warning! Will not prevent relapse.', value: 3, effects: {} },
  { roll: 6, name: 'Stimpak', description: "A pre-War drug capable of boosting the body's regenerative capabilities.", value: 1, effects: { hp: 4 } },
  { roll: 7, name: 'RadAway', description: 'An intravenous solution used to purge radiation.', value: 1, effects: { rads: -4 } },
  { roll: 8, name: 'Psycho', description: 'A military-grade combat drug that boosts aggression and physical performance, while blocking both pain and higher cognitive functions.', value: 2, effects: {} },
  { roll: 9, name: 'Med-X', description: "An opioid-based painkiller that turns off the brain's ability to perceive pain for a time.", value: 2, effects: {} },
  { roll: 10, name: 'Daddy-O', description: 'Popular among intellectuals, Daddy-O greatly increases intelligence but causes users to hyper-focus on tasks.', value: 2, effects: {} },
  { roll: 11, name: 'Healing Salve', description: 'A Wasteland original, Healing Salve is used to treat minor injuries fast!', value: 1, effects: { hp: 2 } },
  { roll: 12, name: 'Buffout', description: 'A performance-enhancing drug that removes the need for effort and time at a gym. Dangerously addictive, but efficient!', value: 2, effects: {} },
  { roll: 13, name: 'Jet', description: 'Mass produced in the Wasteland, Jet alters human perception of the passage of time while enhancing reaction time; a potent but dangerous cocktail.', value: 1, effects: { ap: 2 } },
  { roll: 14, name: 'Mentats', description: 'A mind-altering chem that better connects neural pathways to speed up mental processes, leaving one feeling unintelligent without it.', value: 2, effects: {} },
  { roll: 15, name: 'Mentats (Grape)', description: 'A variant of Mentats that focuses on increasing the social capacity of the user, making them far more fun to be around.', value: 3, effects: {} },
  { roll: 16, name: 'Rad-X', description: "Boosts the user's natural resistance to radiation but does nothing to remove existing radiation poisoning.", value: 1, effects: {} },
  { roll: 17, name: 'Antibiotics', description: 'A term for a collective group of Chems that help combat infectious diseases.', value: 1, effects: {} },
  { roll: 18, name: 'Overdrive', description: "A Psycho-derived chem that massively enhances the user's violent potential.", value: 3, effects: {} },
  { roll: 19, name: 'Fury', description: 'A boosted version of Psycho that is nearly twice as effective, but infuses the user with a false sense of invincibility and overwhelming anger, so much so that everything but the fight disappears.', value: 3, effects: {} },
  { roll: 20, name: 'X-Cell', description: 'A prototype military-grade performance enhancer that would push the user to new heights. It never passed trial, but worked, enhancing everything about anyone who took it.', value: 4, effects: {} }
];

// ===================== SUPPLIES (pg.172) =====================
// Each result grants a Stack of Supplies, flavored as the listed item.
export const SUPPLIES = [
  'Nuka-Cola Quantum',
  'Yao Guai Ribs',
  'Stingwing Filet',
  'Grilled Radstag',
  'Mirelurk Cake',
  'Deathclaw Omelette',
  'Squirrel Stew',
  'Iguana Soup',
  'Radstag Meat',
  'Ribeye Steak',
  'Nuka-Cola',
  'Squirrel on a Stick',
  'Mutt Chops',
  'Noodle Cup',
  'Insta Mash',
  "Pork 'n' Beans",
  'Squirrel Bits',
  'Yum-Yum Deviled Eggs',
  'Dirty Water',
  'Cram'
];

export const rollSupplyName = (): string => SUPPLIES[roll(20) - 1];

// ===================== CAPS (pg.171) =====================
export interface CapsResult {
  stacks: number;
  description: string;
  specialEdition?: boolean;
}

export const rollCapsTable = (): CapsResult => {
  const r = roll(20);
  if (r <= 2) return { stacks: 1, description: "Counterfeit, but if the next trader doesn't notice, who cares?" };
  if (r <= 4) return { stacks: 1, description: 'Strung together like a necklace.' };
  if (r <= 6) return { stacks: 1, description: 'Hidden out of sight.' };
  if (r <= 8) return { stacks: 1, description: 'Stored under the floorboards, or encased somewhere strange.' };
  if (r <= 10) return { stacks: 0, description: 'A special edition bottle cap inside a glass case. Worth something to a collector.', specialEdition: true };
  if (r <= 12) return { stacks: 2, description: 'Scattered across the floor.' };
  if (r <= 14) return { stacks: 2, description: 'A small mural made from bottle caps is stuck to the wall.' };
  if (r <= 16) return { stacks: 2, description: 'Broken Nuka-Cola bottles litter the floor with caps still intact.' };
  if (r <= 18) return { stacks: 3, description: 'In neatly arranged stacks.' };
  return { stacks: 3, description: 'A simple cloth bag filled to the brim.' };
};

// ===================== ODDITIES (pg.176) =====================
export interface Oddity {
  name: string;
  quirk: string;
}

export const ODDITIES: Oddity[] = [
  { name: 'Note', quirk: 'Something left behind by an NPC. Who are they, and what is it about?' },
  { name: 'Holotape', quirk: 'A recorded note, either pre or post War; needs a device to be played.' },
  { name: 'Key', quirk: 'For what? Does it have an identifying mark?' },
  { name: 'Locked Container', quirk: 'How do you open it? What [LOOT] is inside?' },
  { name: 'Radio', quirk: "A working Radio pre-tuned to the old owner's favorite station. What is it?" },
  { name: 'Bobby Pins', quirk: 'A [QUANTITY] of Bobby Pins. Always helpful. Are they in an interesting container?' },
  { name: 'Light or Lantern', quirk: 'How is it powered and held? Does it have an interesting color?' },
  { name: 'Vault-Tec Lunchbox', quirk: 'A collectible! Who might want it?' },
  { name: 'Burned Book', quirk: 'What parts are still legible?' },
  { name: 'Silver Cigarette Case', quirk: 'What ornamentation does it have? Are there any cigarettes still inside?' },
  { name: 'Prototype Circuit Board', quirk: 'What was the purpose of this item?' },
  { name: 'Sealed Love Letter', quirk: 'When was it written? What does it say?' },
  { name: 'Engraved Hip Flask', quirk: "What is the engraving? What's the flask made of, and is it full?" },
  { name: 'Tattered Comic Book', quirk: 'What is the comic of? Was it part of a collection?' },
  { name: 'Pre-War Vinyl Record', quirk: 'Who is the record of? How scratched is the surface?' },
  { name: 'Set of Old Playing Cards', quirk: 'What is the art of? Are some cards missing?' },
  { name: 'Strange, Uncut Gemstone', quirk: 'Where is it from? What gem is it?' },
  { name: 'Animal Bone Necklace', quirk: 'What animal was used? What is the binding?' },
  { name: 'Black-and-White Photograph', quirk: 'Who or what is it of?' },
  { name: 'Exactly what you were looking for.', quirk: 'But what were you looking for?' }
];

// ===================== SCRAP (pg.177, roll 2d20) =====================
export const SCRAP_TABLE: { roll: number; name: string }[] = [
  { roll: 2, name: 'Makeshift battery' },
  { roll: 3, name: 'Blowtorch' },
  { roll: 4, name: 'Biometric scanner' },
  { roll: 5, name: 'Gas can' },
  { roll: 6, name: 'Duct tape' },
  { roll: 7, name: 'Hacksaw' },
  { roll: 8, name: 'Handcuffs' },
  { roll: 9, name: 'Human jaw' },
  { roll: 10, name: 'Bunsen burner' },
  { roll: 11, name: 'Microscope' },
  { roll: 12, name: 'Yellow paint' },
  { roll: 13, name: 'Ball peen hammer' },
  { roll: 14, name: 'Adjustable wrench' },
  { roll: 15, name: 'Luxobrew coffee pot' },
  { roll: 16, name: 'Magnifying glass' },
  { roll: 17, name: 'Rubber hosing' },
  { roll: 18, name: 'Telescope' },
  { roll: 19, name: 'Springs' },
  { roll: 20, name: 'Toy car' },
  { roll: 21, name: '8-Ball' },
  { roll: 22, name: 'Fertilizer' },
  { roll: 23, name: 'Giddyup Buttercup' },
  { roll: 24, name: 'Umbrella' },
  { roll: 25, name: 'Abroxo cleaner' },
  { roll: 26, name: 'Battered clipboard' },
  { roll: 27, name: 'Wonderglue' },
  { roll: 28, name: 'Nails' },
  { roll: 29, name: 'Saw blade' },
  { roll: 30, name: 'Barbed wire' },
  { roll: 31, name: 'Antique pipe wrench' },
  { roll: 32, name: 'Pile of gears' },
  { roll: 33, name: 'Scissors' },
  { roll: 34, name: 'Asbestos slab' },
  { roll: 35, name: 'Bag of cement' },
  { roll: 36, name: 'Broken lamp' },
  { roll: 37, name: 'Hairbrush' },
  { roll: 38, name: 'Desk fan' },
  { roll: 39, name: 'Aluminum can' },
  { roll: 40, name: 'Typewriter' }
];

// ===================== GENERATORS =====================

const getTableResult = <T extends { roll: number }>(table: T[], r: number): T => {
  for (const entry of table) {
    if (r <= entry.roll) return entry;
  }
  return table[table.length - 1];
};

/** Ammunition (pg.170 sidebar): either clear an 'Out of Ammo' truth, or gain an
 *  Ammo Box that lets you ignore one future 'Out of Ammo' complication. */
export const rollAmmunition = (): GearItem => ({
  id: generateId(),
  name: 'Ammo Box',
  type: 'Ammo',
  description: "Remove the 'Out of Ammo' Truth from one Weapon — OR — keep it to ignore one future 'Out of Ammo' complication for a weapon of your choice.",
  quantity: 1,
  weight: 1
});

export const rollCaps = (): GearItem => {
  const result = rollCapsTable();
  if (result.specialEdition) {
    return {
      id: generateId(),
      name: 'Special Edition Bottle Cap',
      type: 'Misc',
      description: `${result.description}`,
      quantity: 1,
      weight: 0,
      value: 1
    };
  }
  return {
    id: generateId(),
    name: `Caps Stash (${result.stacks} Stack${result.stacks > 1 ? 's' : ''})`,
    type: 'Currency',
    description: result.description,
    quantity: result.stacks,
    weight: 0
  };
};

export const rollChem = (): GearItem => {
  let r = roll(20);
  // On a 1, the book says re-roll twice; we grant the first re-roll here.
  if (r === 1) r = Math.max(2, roll(20));
  const result = getTableResult(CHEMS, r);
  return {
    id: generateId(),
    name: result.name,
    type: 'Consumable',
    description: result.description,
    quantity: 1,
    weight: 0.1,
    value: result.value,
    effects: result.effects
  };
};

export const rollScrap = (): GearItem => {
  const result = getTableResult(SCRAP_TABLE, roll2d20());
  return {
    id: generateId(),
    name: result.name,
    type: 'Junk',
    description: 'Scrap: can be spent when making the Modify and Repair Gear action.',
    quantity: 1,
    weight: 1
  };
};

export const rollSupply = (): GearItem => {
  const name = rollSupplyName();
  return {
    id: generateId(),
    name,
    type: 'Consumable',
    description: 'Grants 1 Stack of Supplies. The item is spent when that Stack is used.',
    quantity: 1,
    weight: 1
  };
};

export const rollOddity = (): GearItem => {
  const oddity = ODDITIES[roll(20) - 1];
  return {
    id: generateId(),
    name: oddity.name,
    type: 'Misc',
    description: oddity.quirk,
    quantity: 1,
    weight: 1
  };
};

export const rollWeapon = (tableType: 'ranged' | 'melee' | 'thrown'): GearItem => {
  let result: LootEntry;
  if (tableType === 'ranged') result = getTableResult(RANGED_WEAPONS, roll2d20());
  else if (tableType === 'melee') result = getTableResult(MELEE_WEAPONS, roll2d20());
  else result = getTableResult(THROWN_WEAPONS, roll(20));

  const item: GearItem = {
    id: generateId(),
    name: result.name,
    type: 'Weapon',
    quantity: 1,
    weight: result.weight,
    value: result.value
  };

  // Loot table: weapons drop with one Condition; mods are rare extras.
  if (roll(20) <= 5) {
    item.condition = rollCondition();
    item.name = `${item.condition.split(',')[0]} ${item.name}`;
  } else if (roll(20) >= 18 && tableType !== 'thrown') {
    const mod = rollWeaponMod();
    item.mods = [mod.name];
    item.name = `${mod.name} ${item.name}`;
    item.description = mod.description;
  }
  return item;
};

export const rollArmor = (): GearItem => {
  const result = getTableResult(ARMOR_TABLE, roll(20));
  const item: GearItem = {
    id: generateId(),
    name: result.name,
    type: 'Armor',
    quantity: 1,
    weight: result.weight,
    value: result.value
  };
  if (roll(20) <= 5) {
    item.condition = rollCondition();
    item.name = `${item.condition.split(',')[0]} ${item.name}`;
  }
  return item;
};

/** Master Loot Generation Table (pg.170). If looking for a particular type
 *  of loot, the book allows rolling twice and choosing. */
export const rollScavenge = (): GearItem => {
  const r = roll(20);
  if (r <= 2) return rollWeapon('ranged');
  if (r <= 4) return rollWeapon('melee');
  if (r <= 6) return rollWeapon('thrown');
  if (r <= 8) return rollAmmunition();
  if (r <= 10) return rollArmor();
  if (r <= 12) return rollSupply();
  if (r <= 14) return rollChem();
  if (r <= 16) return rollScrap();
  if (r <= 18) return rollCaps();
  return rollOddity();
};
