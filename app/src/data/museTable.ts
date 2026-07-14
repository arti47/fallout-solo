// The Wanderer's Muse — a d100 Elements Meaning Table.
// Roll two words to spark an interpretation when the story stalls: a fresh
// detail, the twist behind an encounter, what a location is really about, etc.
// A classic solo-RPG "meaning table"; the pair (e.g. "Glowing" + "Bunker")
// gives you more to riff on than any single word would.
export const MUSE_WORDS: string[] = [
  'Abandoned', 'Ash', 'Atomic', 'Barricade', 'Blood',
  'Bone', 'Broken', 'Bunker', 'Burned', 'Caps',
  'Change', 'Chems', 'Clean', 'Cola', 'Collapsed',
  'Concrete', 'Continue', 'Corporate', 'Crater', 'Cult',
  'Danger', 'Dark', 'Dead', 'Decay', 'Decrease',
  'Defended', 'Deserted', 'Dirt', 'Disease', 'Dust',
  'Empty', 'Energy', 'Extra', 'Faction', 'Feral',
  'Fire', 'Flesh', 'Fortified', 'Ghoul', 'Glowing',
  'Green', 'Gun', 'Hidden', 'Highway', 'Hope',
  'Increase', 'Infected', 'Iron', 'Junk', 'Laser',
  'Loot', 'Lost', 'Machine', 'Market', 'Metal',
  'Military', 'Mine', 'Mundane', 'Mutant', 'Mysterious',
  'Neon', 'Oasis', 'Old', 'Overgrown', 'Paranoia',
  'Peace', 'Poison', 'Power', 'Pre-war', 'Propaganda',
  'Rads', 'Raider', 'Red', 'Relic', 'Resource',
  'Robot', 'Rot', 'Ruin', 'Rust', 'Safe',
  'Salvage', 'Sand', 'Scavenger', 'Scrap', 'Secret',
  'Settlement', 'Shelter', 'Skeleton', 'Start', 'Steel',
  'Stop', 'Strange', 'Survivor', 'Tech', 'Toxic',
  'Trade', 'Trap', 'Vault', 'War', 'Water',
];

/** Roll one word (1-100) off the table. */
export const rollMuseWord = (): string =>
  MUSE_WORDS[Math.floor(Math.random() * MUSE_WORDS.length)];

/** Roll a pair of words (the two may repeat, as with two separate d100 rolls). */
export const rollMusePair = (): [string, string] => [rollMuseWord(), rollMuseWord()];
