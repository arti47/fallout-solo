// Character-state & miscellaneous tables — Injuries, Miraculous Escape,
// Settlement Reputation (pg.217-218), Known Vaults (pg.58), and the Foe
// Generation tables (pg.189-194).

const roll = (max: number) => Math.floor(Math.random() * max) + 1;

// ===================== INJURY (pg.217) =====================
// Roll 2d20: one for the Injury type, one for the location. Add overkill
// damage (damage beyond what reduced you to 0 HP) to the injury roll.
export const INJURY_TYPES: { range: [number, number]; injury: string }[] = [
  { range: [1, 2], injury: 'Bruised, scraped' },
  { range: [3, 4], injury: 'Sprained, twisted' },
  { range: [5, 6], injury: 'Lacerated, punctured' },
  { range: [7, 8], injury: 'Crushed, gashed' },
  { range: [9, 10], injury: 'Burnt, bleeding' },
  { range: [11, 12], injury: 'Crushed, flayed' },
  { range: [13, 14], injury: 'Dislocated, sliced' },
  { range: [15, 16], injury: 'Snapped, internally damaged' },
  { range: [17, 18], injury: 'Cracked, deep cuts' },
  { range: [19, 20], injury: 'Severed, destroyed' }
];

export const INJURY_LOCATIONS: { range: [number, number]; location: string }[] = [
  { range: [1, 1], location: 'Left Foot' },
  { range: [2, 2], location: 'Right Foot' },
  { range: [3, 3], location: 'Left Hand' },
  { range: [4, 4], location: 'Right Hand' },
  { range: [5, 5], location: 'Left Leg' },
  { range: [6, 6], location: 'Right Leg' },
  { range: [7, 7], location: 'Left Arm' },
  { range: [8, 8], location: 'Right Arm' },
  { range: [9, 9], location: 'Left Shoulder' },
  { range: [10, 10], location: 'Right Shoulder' },
  { range: [11, 12], location: 'Lower Torso' },
  { range: [13, 14], location: 'Upper Torso' },
  { range: [15, 15], location: 'Left Eye' },
  { range: [16, 16], location: 'Right Eye' },
  { range: [17, 17], location: 'Left Ear' },
  { range: [18, 18], location: 'Right Ear' },
  { range: [19, 20], location: 'Teeth/Mouth' }
];

const fromRange = <T extends { range: [number, number] }>(table: T[], r: number): T =>
  table.find(e => r >= e.range[0] && r <= e.range[1]) ?? table[table.length - 1];

export interface InjuryResult {
  injury: string;
  location: string;
  description: string;
}

/** Rolls an Injury per pg.96/217. `overkill` = Damage suffered beyond the
 *  amount needed to reach 0 HP; it is added to the injury-type roll. */
export const rollInjury = (overkill = 0): InjuryResult => {
  const injuryRoll = Math.min(20, roll(20) + overkill);
  const injury = fromRange(INJURY_TYPES, injuryRoll).injury;
  const location = fromRange(INJURY_LOCATIONS, roll(20)).location;
  return { injury, location, description: `${injury} — ${location}` };
};

// ===================== MIRACULOUS ESCAPE (pg.218) =====================
// Spend ALL your Luck Points (minimum 1) when suffering a fatal Injury.
export interface MiraculousEscape {
  range: [number, number];
  name: string;
  description: string;
}

export const MIRACULOUS_ESCAPES: MiraculousEscape[] = [
  { range: [1, 2], name: 'Captured', description: 'Your foes took you alive, then dragged you back to their base for interrogation or slavery, depending on their temperament. Generate a [LOCATION] and move there; you are now the captive of your foe and will need to plan an escape.' },
  { range: [3, 4], name: 'Fell', description: 'You fell through the floor, tumbling into an underground metro. You may Travel to any adjacent Location, which gains the Metro Truth.' },
  { range: [5, 6], name: 'Unconscious', description: 'You fall into a deep unconsciousness, awakening at the nearest settlement, with an [NPC] watching over you.' },
  { range: [7, 8], name: 'Seeing Red', description: "You don't remember what happened, but you are covered in blood, and whatever caused the injury has been slaughtered." },
  { range: [9, 10], name: 'Mysterious Stranger', description: "A man in a trenchcoat and pistol finished the job you couldn't. Immediately gain the Mysterious Stranger Perk even if you do not meet the requirements." },
  { range: [11, 12], name: 'Grit', description: 'You are just too tough to die. Ignore the Injury roll and regain half (rounding up) of your maximum HP.' },
  { range: [13, 14], name: 'Dragged to Safety', description: 'You were looted and left for dead. Lose all your equipment. You were awoken by a Dog licking your face. Name them, and add them under equipment.' },
  { range: [15, 16], name: 'Bigger Fish', description: "Something came along and scared away your foes before they could finish you off. Decide what it was and why it didn't kill you." },
  { range: [17, 18], name: 'Hallucinations', description: 'The last few moments of your life were just a dream. Why are you hallucinating, and where did you wake up?' },
  { range: [19, 20], name: 'This Is It…', description: 'The last few moments of your life were excruciating. Write an Epilogue and end your story.' }
];

export const rollMiraculousEscape = (): MiraculousEscape =>
  fromRange(MIRACULOUS_ESCAPES, roll(20));

// ===================== SETTLEMENT REPUTATION (pg.218) =====================
export type Reputation = 'Vilified' | 'Hostile' | 'Cautious' | 'Neutral' | 'Friendly' | 'Idolized';

export const REPUTATION_DESCRIPTIONS: Record<Reputation, string> = {
  Vilified: 'This community despises you beyond redemption. You become Vilified by losing a reputation rank while already Hostile.',
  Hostile: 'You are despised by the inhabitants of this settlement. If they are not actively hunting you, they want nothing to do with you.',
  Cautious: 'The inhabitants have reason to mistrust you.',
  Neutral: "Either the inhabitants here have mixed feelings about you, or you haven't made much of an impression on them.",
  Friendly: 'You are on good terms with the inhabitants of this settlement, or perhaps they are just very friendly folk?',
  Idolized: 'This community believes the sun shines from your every pore. You become Idolized by gaining a reputation rank above Friendly.'
};

/** First-visit roll (pg.218). Vilified/Idolized cannot be rolled — they are
 *  only earned during play. */
export const rollSettlementReputation = (): Reputation => {
  const r = roll(20);
  if (r <= 4) return 'Hostile';
  if (r <= 12) return 'Cautious';
  if (r <= 17) return 'Neutral';
  return 'Friendly';
};

export const REPUTATION_ORDER: Reputation[] = ['Vilified', 'Hostile', 'Cautious', 'Neutral', 'Friendly', 'Idolized'];

export const shiftReputation = (current: Reputation, steps: number): Reputation => {
  const idx = REPUTATION_ORDER.indexOf(current);
  return REPUTATION_ORDER[Math.max(0, Math.min(REPUTATION_ORDER.length - 1, idx + steps))];
};

// ===================== KNOWN VAULTS (pg.58) =====================
export interface KnownVault {
  number: number;
  truths: string[];
  region: string;
}

export const KNOWN_VAULTS: KnownVault[] = [
  { number: 3, truths: ['Control Vault', 'Overrun by Raiders'], region: 'Mojave Wasteland' },
  { number: 8, truths: ['Control Vault', 'A seed for something bigger'], region: 'New California, Vault City' },
  { number: 11, truths: ['False sacrifices', 'Lies of danger'], region: 'Mojave Wasteland' },
  { number: 12, truths: ['Unsealed door', 'Ghoulish city'], region: 'New California, Necropolis' },
  { number: 13, truths: ['Control Vault', 'Schism from fate'], region: 'New California' },
  { number: 15, truths: ['Delayed opening', 'Birthplace of a future'], region: 'New California, Shady Sands' },
  { number: 17, truths: ['Emptied by force', 'Mysteriously empty'], region: 'West Coast' },
  { number: 19, truths: ["Split into 'blue' and 'red' factions", 'Misplaced hate'], region: 'Mojave Wasteland' },
  { number: 21, truths: ['Under new management', 'Gambling solves everything'], region: 'Mojave Wasteland, The Strip' },
  { number: 22, truths: ['Experimental Flora', 'Overrun by Spore Carriers'], region: 'Mojave Wasteland' },
  { number: 29, truths: ['Full of snobs', 'Teenagers without guidance'], region: 'West Coast' },
  { number: 34, truths: ['Overstocked armory', 'Abandoned to Rads'], region: 'Mojave Wasteland' },
  { number: 51, truths: ['Overseen by AI', 'Finding the best—by any means'], region: 'Appalachia, The Forest' },
  { number: 63, truths: ['Mad science experiment', 'Unfinished and Lost'], region: 'Appalachia, Ash Heap' },
  { number: 75, truths: ['Why does it always end with eugenics?', 'Young Soldiers'], region: 'The Commonwealth, Malden Middle School' },
  { number: 76, truths: ['Control Vault', 'Full of promise'], region: 'Appalachia, The Forest' },
  { number: 77, truths: ['One man', 'A lot of puppets'], region: 'Unknown' },
  { number: 79, truths: ['Vault of gold', 'Secret service base'], region: 'Appalachia, Savage Divide' },
  { number: 81, truths: ['Happy people', 'Abandoned and forgotten research facility'], region: 'The Commonwealth, Boston' },
  { number: 87, truths: ['F.E.V. Test Site', 'Super Mutant home'], region: 'Capital Wasteland' },
  { number: 88, truths: ['Test site for productivity-boosting tech', 'One driven woman'], region: 'The Commonwealth, Quincy' },
  { number: 92, truths: ['Aggression experiments', 'Infested with bloatflies and mirelurks'], region: 'Capital Wasteland, Olney' },
  { number: 94, truths: ['Pacifist ideals', 'Killed to the last'], region: 'Appalachia, The Mire' },
  { number: 95, truths: ['Chem addicts cleaned up', 'Free chems!'], region: 'The Commonwealth' },
  { number: 96, truths: ['Wildlife Studies', 'Understaffed and overpressured'], region: 'Appalachia, Savage Divide' },
  { number: 101, truths: ['Unlimited Overseer Authority', 'Isolationist society'], region: 'Capital Wasteland' },
  { number: 106, truths: ['Chem-laced air', 'Maddened populous'], region: 'Capital Wasteland' },
  { number: 108, truths: ['No leader, no fun, lots of guns', 'GARY!'], region: 'Capital Wasteland' },
  { number: 111, truths: ['Cryogenic Storage', 'Cold Tomb'], region: 'The Commonwealth, Sanctuary Hills' },
  { number: 112, truths: ['Virtual reality prison', 'Tranquility Lane'], region: "Capital Wasteland, Smith Casey's Garage" },
  { number: 114, truths: ['Wealthy people made poor', 'Unfinished'], region: 'The Commonwealth, Boston' },
  { number: 118, truths: ['10 Rich — 300 Poor', 'Robotic immortality'], region: "The Island, Cliff's Edge Hotel" }
];

// ===================== FOE GENERATION (pg.189-194) =====================
export type FoeType =
  | 'Creature'
  | 'Super Mutants'
  | 'Feral Ghouls'
  | 'Robots'
  | 'Raiders'
  | 'Institute'
  | 'Brotherhood of Steel'
  | 'Zetans';

/** Foe Type table (pg.189). */
export const rollFoeType = (): FoeType => {
  const r = roll(20);
  if (r <= 6) return 'Creature';
  if (r <= 8) return 'Super Mutants';
  if (r <= 10) return 'Feral Ghouls';
  if (r <= 12) return 'Robots';
  if (r <= 15) return 'Raiders';
  if (r <= 17) return 'Institute';
  if (r <= 19) return 'Brotherhood of Steel';
  return 'Zetans';
};

export interface FoeScenario {
  range: [number, number];
  scenario: string;
  /** 'reroll-twice' = the table instructs rolling twice on itself. */
  special?: 'reroll-twice';
}

export const CREATURE_FOE_TABLE: FoeScenario[] = [
  { range: [1, 1], scenario: 'A Radroach skitters across the floor, leading you toward a pile of bones — something recently feasted here.' },
  { range: [2, 2], scenario: 'A swarm of 6 Radroaches scatter from a half-eaten corpse, but one remains, gnawing persistently on a metallic limb.' },
  { range: [3, 3], scenario: 'A Radscorpion is eerily still, half-buried in the sand — until you step too close.' },
  { range: [4, 4], scenario: 'The ground trembles slightly as a Radscorpion scouts the area, circling like a shark.' },
  { range: [5, 5], scenario: '2 Stingwings twitch violently through the air.' },
  { range: [6, 6], scenario: 'The remains of a bloatfly nest lie cracked open; 4 Bloatflies harass a Mirelurk.' },
  { range: [7, 7], scenario: 'A Bloodbug is feasting on a lifeless Molerat.' },
  { range: [8, 8], scenario: "A Deathclaw stands motionless ahead, sniffing the air. You realize that it's tracking something… and you might be that something." },
  { range: [9, 9], scenario: "A pile of bones marks a Deathclaw's recent kill, but mixed in are shredded scraps of a Vault jumpsuit." },
  { range: [10, 10], scenario: 'A stray Dog barks frantically at a half-buried Radscorpion, scratching at the sand to expose it.' },
  { range: [11, 11], scenario: 'A Molerat bursts from the ground, shaking dirt from its skin.' },
  { range: [12, 12], scenario: 'A half-eaten dog lies in the dirt, and the culprit — a satisfied-looking Yao Guai — slowly lifts its head to meet your gaze.' },
  { range: [13, 13], scenario: 'A Mirelurk corpse lies rotting in the sun before it suddenly twitches, releasing a swarm of 4 Mirelurk Hatchlings.' },
  { range: [14, 14], scenario: 'A Mirelurk Hunter watches from the shallows, submerged up to its eyes. The water ripples, revealing a Mirelurk Queen rising behind it.' },
  { range: [15, 15], scenario: 'A group of 3 Mirelurks trundle across the Wasteland in search of prey.' },
  { range: [16, 16], scenario: 'A Radroach scuttles across the floor, only to be speared mid-stride by a diving Stingwing.' },
  { range: [17, 17], scenario: 'A wounded Dog limps toward you, whining pitifully, but before you can react, a massive shadow looms behind it — a Yao Guai is watching.' },
  { range: [18, 18], scenario: 'A Bloatfly buzzes lazily over a shallow swamp, only to be yanked under in a sudden splash as a Mirelurk Hunter snaps it up.' },
  { range: [19, 20], scenario: 'Roll twice on this table.', special: 'reroll-twice' }
];

export const SUPER_MUTANT_FOE_TABLE: FoeScenario[] = [
  { range: [1, 2], scenario: 'A Super Mutant stands over a ruined car, gleefully smashing it with a rebar club, completely unaware of your presence.' },
  { range: [3, 4], scenario: "A Super Mutant Hound growls at a pile of meat, unsure if it's food or a trap." },
  { range: [5, 6], scenario: 'A Super Mutant Brute shouts orders at a pair of Super Mutants, kicking one to the ground for questioning his commands.' },
  { range: [7, 8], scenario: 'A Super Mutant Suicider stands completely still, cradling its mini-nuke as if it were a newborn child.' },
  { range: [9, 10], scenario: 'Three Super Mutants are playing a game of "keep away" with a Super Mutant Hound and a "ball" that whimpers each time it is thrown.' },
  { range: [11, 12], scenario: 'Three Super Mutants hurl chunks of concrete off a rooftop, laughing at the sound of crashing metal below.' },
  { range: [13, 14], scenario: 'A Super Mutant, a Super Mutant Brute, and a Super Mutant Suicider are huddled around a fire, roasting what looks suspiciously like a Vault-Tec jumpsuit.' },
  { range: [15, 16], scenario: 'A Super Mutant Behemoth slouches against crumbling ruins, snoring loudly, bent metal crushed in its massive grip.' },
  { range: [17, 18], scenario: 'A Super Mutant Brute, a Super Mutant Hound, and two Super Mutants march in formation, loudly chanting, "HUMANS WEAK, MUTANTS STRONG!"' },
  { range: [19, 20], scenario: 'A Super Mutant Behemoth drinks from a broken fire hydrant while two Super Mutants cheer it on.' }
];

export const FERAL_GHOUL_FOE_TABLE: FoeScenario[] = [
  { range: [1, 2], scenario: 'A lone Feral Ghoul stands in the middle of the road, staring at the sky, completely still.' },
  { range: [3, 4], scenario: 'Two Feral Ghouls fight over a human skull, gnawing and pulling like wild dogs.' },
  { range: [5, 6], scenario: 'A pair of Feral Ghouls sit slumped against a rusted sign, their hands resting on long-empty Nuka-Cola bottles.' },
  { range: [7, 8], scenario: 'Three Feral Ghouls claw at a locked pre-war door, moaning in frustration as if something is inside.' },
  { range: [9, 10], scenario: "Four Feral Ghouls suddenly stop and look up in unison, as if listening to something you can't hear." },
  { range: [11, 12], scenario: 'Five Feral Ghouls stand in a circle around a skeleton, their heads jerking as they sniff the air.' },
  { range: [13, 14], scenario: 'A Glowing One presses its face against a cracked terminal screen, bathing the dead electronics in sickly green light.' },
  { range: [15, 16], scenario: 'A Glowing One stands atop a pile of corpses, its body pulsing with radiation as two nearby Feral Ghouls twitch with energy.' },
  { range: [17, 18], scenario: 'A Glowing One kneels over a pile of dead Feral Ghouls, its hands twitching as if trying to wake them up.' },
  { range: [19, 20], scenario: 'A Glowing One lies huddled together with four Feral Ghouls, light pulsing out from the pile with regularity.' }
];

export const ROBOT_FOE_TABLE: FoeScenario[] = [
  { range: [1, 2], scenario: 'A Mr. Handy hovers over the bare ground, carefully watering non-existent plants while mumbling about crop schedules.' },
  { range: [3, 4], scenario: 'A Protectron (Medic) scans a skeleton with a broken leg and repeats, "ADMINISTERING FIRST AID".' },
  { range: [5, 6], scenario: 'A Mr. Gutsy patrols the area, its speakers crackling as it demands to see identification.' },
  { range: [7, 8], scenario: 'A Sentry Bot stands completely still in the open, then blasts a Molerat to bits with its minigun.' },
  { range: [9, 10], scenario: 'A Protectron (Fire Brigadier) trudges through the ruins, spraying foam at the smoldering remains of a decades-old fire.' },
  { range: [11, 12], scenario: 'Three Eyebots hover in formation, broadcasting a distorted pre-war news report on repeat.' },
  { range: [13, 14], scenario: 'An Assaultron paces back and forth, muttering, "DEFENSE PROTOCOLS ENGAGED."' },
  { range: [15, 16], scenario: 'A Mr. Handy is locked in a verbal argument with a Protectron (Utility) over who has jurisdiction in the ruins.' },
  { range: [17, 18], scenario: 'A Turret suddenly powers on, scanning for threats in the area.' },
  { range: [19, 20], scenario: 'An Assaultron and a Sentry Bot appear locked in a standoff, both weapons primed but neither making the first move.' }
];

export const RAIDER_FOE_TABLE: FoeScenario[] = [
  { range: [1, 2], scenario: 'A Raider sits on a pile of bones, idly sharpening a knife and whistling an off-key tune.' },
  { range: [3, 4], scenario: 'Two Scavvers argue over a locked safe, neither willing to back down — but neither willing to be the first to crack it open.' },
  { range: [5, 6], scenario: 'Three Raiders stand around a battered pre-war vending machine, kicking it and yelling, "WHERE\'S OUR NUKA-COLA?!"' },
  { range: [7, 8], scenario: 'A Scavver frantically loads a bag with loot while a Psycho screams at them to "Leave the boring junk behind!"' },
  { range: [9, 10], scenario: 'A Raider, a Psycho, and a Scavver sit around a fire, roasting what is very clearly a human arm.' },
  { range: [11, 12], scenario: 'A Raider Boss stands over a kneeling Raider, berating them for a botched ambush.' },
  { range: [13, 14], scenario: 'A Psycho spins in circles, waving a pipe wrench while chanting, "BLOOD, BLOOD, BLOOD!"' },
  { range: [15, 16], scenario: 'A Raider Boss, flanked by two Psychos, has set up a toll for passage through "their land."' },
  { range: [17, 18], scenario: 'A group of three Raiders cheer as two Scavvers are forced to fight each other for sport in a makeshift cage.' },
  { range: [19, 20], scenario: "A Raider Boss sits on a wrecked car, flipping a pre-war coin and making 4 Raiders bet on which of them they'll shoot first; curiously, they all seem happy about this." }
];

export const INSTITUTE_FOE_TABLE: FoeScenario[] = [
  { range: [1, 2], scenario: 'A lone Institute Scientist stands in front of a disabled First Generation Synth, trying to repair it before something else finds them.' },
  { range: [3, 4], scenario: 'A First Generation Synth clutches a broken laser rifle, repeating, "Error. Recalibrating. Error."' },
  { range: [5, 6], scenario: 'A lone Synth Strider patrols the area, repeating, "The Director will not be pleased," over and over.' },
  { range: [7, 8], scenario: 'A wounded Institute Scientist frantically types on a holopad while a Synth Courser stands guard, scanning the area for threats.' },
  { range: [9, 10], scenario: 'A Synth Courser stands over a downed Synth Strider, running diagnostics while an Institute Scientist anxiously checks their notes.' },
  { range: [11, 12], scenario: 'Two Synth Striders methodically dismantle an abandoned radio tower while a Synth Courser supervises, stating, "No evidence must remain."' },
  { range: [13, 14], scenario: 'A Synth Trooper and a Synth Strider stand guard while an Institute Scientist carefully works on a blueprint, muttering.' },
  { range: [15, 16], scenario: 'A Synth Trooper, a Synth Strider, and an Institute Scientist are examining a human corpse, taking turns between scanning and taking notes.' },
  { range: [17, 18], scenario: 'A Synth Courser, a First Generation Synth, and a Synth Strider stand in eerie silence, watching a pre-war holotape replay on a loop.' },
  { range: [19, 20], scenario: 'A group of three Synth Troopers stand in perfect formation, waiting silently while a Synth Courser uploads new orders.' }
];

export const BROTHERHOOD_FOE_TABLE: FoeScenario[] = [
  { range: [1, 2], scenario: 'A Paladin and a Knight patrol the area, scanning for any signs of life.' },
  { range: [3, 4], scenario: 'A Scribe studies an old terminal, completely absorbed in their work while a Paladin keeps watch, muttering, "Hurry up, Scribe."' },
  { range: [5, 6], scenario: 'A Scribe quietly murmurs to themselves while cataloging ancient relics, while a Knight and Paladin argue over a tactical map.' },
  { range: [7, 8], scenario: 'A Paladin checks the power cores on their Power Armor, ensuring everything is charged, while an Initiate looks on, nervous about the upcoming journey.' },
  { range: [9, 10], scenario: 'A Paladin sternly orders an Initiate to stay behind while they scout ahead, the Initiate reluctantly nodding as they adjust their gear.' },
  { range: [11, 12], scenario: 'A Scribe hesitates as they try to repair a piece of pre-war tech, while a Knight impatiently urges them to hurry and keep up.' },
  { range: [13, 14], scenario: 'A Scribe is taking the Power Armor from their fallen Knight, giving themselves an impromptu field promotion.' },
  { range: [15, 16], scenario: 'An Elder speaks with a Scribe, their conversation about rare pre-war tech, while a Paladin listens with crossed arms, waiting for an order.' },
  { range: [17, 18], scenario: "An Elder inspects a Scribe's findings, nodding approvingly before turning to the Paladin to discuss their next mission." },
  { range: [19, 20], scenario: 'An Elder gives a stern speech to a group of three Knights, explaining their next mission with cold, military precision.' }
];

export const ZETAN_FOE_TABLE: FoeScenario[] = [
  { range: [1, 5], scenario: 'A Zetan has been carefully watching you from a distance; it has not been subtle about it — but the reason why still eludes you.' },
  { range: [6, 10], scenario: 'A pair of Zetans are carefully arranging the bodies of two farmers and a brahmin in a curated crop of tatoes.' },
  { range: [11, 15], scenario: 'A sudden explosion, the smell of ozone and burning oil, and the sound of screeching metal alert you to a Zetan lying near-dead in a nearby cave, luminescent metals destroyed all around it. It beckons for you.' },
  { range: [16, 20], scenario: 'Three Zetans advance towards the nearest Settlement, each armed and cackling madly in their alien tongue.' }
];

export const FOE_TABLES: Record<FoeType, FoeScenario[]> = {
  'Creature': CREATURE_FOE_TABLE,
  'Super Mutants': SUPER_MUTANT_FOE_TABLE,
  'Feral Ghouls': FERAL_GHOUL_FOE_TABLE,
  'Robots': ROBOT_FOE_TABLE,
  'Raiders': RAIDER_FOE_TABLE,
  'Institute': INSTITUTE_FOE_TABLE,
  'Brotherhood of Steel': BROTHERHOOD_FOE_TABLE,
  'Zetans': ZETAN_FOE_TABLE
};

export interface GeneratedFoeEncounter {
  foeType: FoeType;
  scenarios: string[];
}

/** Full pipeline (pg.189): Foe Type → faction scenario table. The Creature
 *  table's 19-20 "roll twice" is resolved automatically. Pass `forcedType`
 *  when the encounter text dictates the faction (e.g. "[RAIDERS]"). */
export const generateFoeEncounter = (forcedType?: FoeType): GeneratedFoeEncounter => {
  const foeType = forcedType ?? rollFoeType();
  const table = FOE_TABLES[foeType];
  const scenarios: string[] = [];
  const rollScenario = () => {
    const result = fromRange(table, roll(20));
    if (result.special === 'reroll-twice') {
      rollScenario();
      rollScenario();
    } else {
      scenarios.push(result.scenario);
    }
  };
  rollScenario();
  return { foeType, scenarios };
};
