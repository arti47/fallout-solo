// Location & Encounter generation — complete from Appendix 2 (pg.159-167):
// Inhabitants Generator, Icons, Wasteland/Settlement Truths, both Encounter
// tables with their narrative questions, and Combat States with effects.

export type EncounterType = 'empty' | 'scavenge' | 'enemy' | 'hazard' | 'settlement' | 'wasteland';

export interface EncounterResult {
  type: EncounterType;
  description: string;
  /** The book's narrative prompt question — answer it in your Journal. */
  question?: string;
  effect?: {
    hp?: number;
    ap?: number;
    rads?: number;
  };
}

const roll = (max: number) => Math.floor(Math.random() * max) + 1;

// ===================== INHABITANTS GENERATOR (pg.159) =====================
export type InhabitantsResult = 'wasteland' | 'settlement-if-none-within-2' | 'settlement-if-none-adjacent' | 'settlement';

/** Raw table roll. The caller resolves the conditional results against the map
 *  (settlement spacing rules). */
export const rollInhabitants = (): InhabitantsResult => {
  const r = roll(20);
  if (r <= 10) return 'wasteland';
  if (r <= 15) return 'settlement-if-none-within-2';
  if (r <= 18) return 'settlement-if-none-adjacent';
  return 'settlement';
};

/** Resolves the Inhabitants roll using the book's spacing rules.
 *  @param settlementWithin2 are there settlements within 2 Locations?
 *  @param settlementAdjacent are there adjacent settlements? */
export const resolveInhabitants = (
  result: InhabitantsResult,
  settlementWithin2: boolean,
  settlementAdjacent: boolean
): 'wasteland' | 'settlement' => {
  switch (result) {
    case 'wasteland': return 'wasteland';
    case 'settlement-if-none-within-2': return settlementWithin2 ? 'wasteland' : 'settlement';
    case 'settlement-if-none-adjacent': return settlementAdjacent ? 'wasteland' : 'settlement';
    case 'settlement': return 'settlement';
  }
};

// ===================== LOCATION ICONS (pg.159) =====================
export const LOCATION_ICONS = [
  'Bunker',
  'Cave/Sewer',
  'Restaurant/Drumlin Diner',
  'Factory/Warehouse',
  'Farm',
  'Hospital/Medical Tent',
  'Junkyard',
  'Metro',
  'Military Base',
  'Museum/Church',
  'Office Tower/Business Park',
  'Playground/Park',
  'Heritage Site',
  'Police Station',
  'Mass Fusion Power Plant',
  'Radio Tower',
  'Red Rocket Gas Station',
  'Super Duper Mart',
  'Satellite Station',
  'Stadium'
];

export const rollIcon = (): string => LOCATION_ICONS[roll(20) - 1];

// ===================== WASTELAND TRUTHS (pg.160) =====================
export const WASTELAND_TRUTHS = [
  'Windswept: Constant gusts carry dust and whispers of the past.',
  'Flooded: Water pools in unexpected places, hiding dangers below.',
  'Cracked: The ground is riddled with deep fractures and fissures.',
  'Overgrown: Nature has started to reclaim the ruins, vines creeping over wreckage.',
  'Charred: The remains of a fire still linger, the air thick with soot.',
  'Irradiated: The land glows faintly, twisted by years of radiation.',
  'Bone-Dry: The air is parched, and nothing has lived here in a long time.',
  'Ash-Covered: A thick layer of fine, gray dust coats everything like snow.',
  'Quaking: The ground shifts unpredictably, as if ready to swallow intruders.',
  'Crumbling: Buildings have collapsed into shapeless mounds of debris.',
  "Eerie: There's a strange silence, as if something is watching.",
  'Claustrophobic: Tight passages and debris make movement difficult.',
  'Echoing: Every sound carries too far, making whispers feel like shouts.',
  'Festering: The air is thick with decay, rot, and something unidentifiable.',
  'Marked: Graffiti and symbols of past [FACTIONS] litter the walls.',
  'Littered: Skeletons, wreckage, and rusting vehicles choke the streets.',
  'Choked with Fog: A thick mist clings to the ruins, muffling sight and sound.',
  'Booby-Trapped: Every step could set off something deadly.',
  'Battlescarred: Bullet casings, scorch marks, and spent explosives tell of a violent past.',
  'Almost Intact: Somehow, this place remains eerily preserved, as if expecting its old occupants to return.'
];

export const rollWastelandTruth = (): string => WASTELAND_TRUTHS[roll(20) - 1];

// ===================== SETTLEMENT TRUTHS (pg.161) =====================
export const SETTLEMENT_TRUTHS = [
  'Haphazard: Buildings are stacked, patched together, and barely holding up.',
  'Crowded: Narrow streets packed with stalls, people, and makeshift homes.',
  'Fortified: Heavy barricades, guard towers, and a clear sense of paranoia.',
  'Sunken: Built into a crater, canyon, or deep valley for protection.',
  'Elevated: Perched on stilts, bridges, or the remains of pre-war skyscrapers.',
  'Rebuilt: The bones of the old world are repurposed into something livable.',
  'Divided: Different factions, classes, or groups control distinct areas.',
  'Underground: Tunnels, bunkers, or subway stations serve as the heart of the community.',
  'Bustling: Noise, movement, and the smell of cooking food fill the air.',
  'Jovial: Laughter, music, and a sense of resilience despite hardship.',
  'Lawless: No real authority exists—whoever has the most guns makes the rules.',
  'Oppressive: A ruling faction or leader keeps the people in line through fear.',
  'Desperate: People here are just barely scraping by, clinging to survival.',
  'Converted Vehicles: Buses, planes, or even rusting ships serve as homes.',
  'Reclaimed Nature: Overgrown vines and gardens weave through the settlement.',
  'Music & Celebration: Regular festivals, performances, or impromptu parties.',
  'Struggling Farmers: Small plots of crops grow in unlikely places.',
  'Secretive Residents: People whisper behind closed doors, and something feels off.',
  'Hi-tech: Some central pre-War technology makes this settlement feasible.',
  'Vertical Living: People stack homes on top of each other, creating precarious walkways.'
];

export const rollSettlementTruth = (): string => SETTLEMENT_TRUTHS[roll(20) - 1];

// ===================== SETTLEMENT ENCOUNTERS (pg.162-163) =====================
export interface EncounterEntry {
  name: string;
  description: string;
  question: string;
}

export const SETTLEMENT_ENCOUNTERS: EncounterEntry[] = [
  { name: 'Siege', description: 'A [FACTION] is attacking the settlement. If you decide to oppose them, the settlement will remember your aid.', question: 'How well defended is the settlement? Could you use this attack to your advantage?' },
  { name: 'Security', description: 'A patrol of what passes for the law around here is questioning residents. They demand to see your papers.', question: 'What are they looking for? How will they react if you refuse?' },
  { name: 'Friendly Face', description: "Someone in the settlement recognizes you. If the settlement doesn't have an NPC, generate an [NPC]; otherwise choose a random NPC to be visiting.", question: 'What do they want?' },
  { name: 'Gathering Crowd', description: 'A charismatic [NPC] is making a speech. People are listening intently.', question: 'What are they rallying for?' },
  { name: 'Travelling Merchant', description: 'A friendly trader has set up shop in a back alley, offering rare goods. If you make the Trade Action this Round, you may roll twice for the [CONDITION] of any goods they have to sell and choose the best.', question: 'Why are they leaving soon?' },
  { name: 'Drunk and Disorderly', description: 'Two [NPC] settlers are arguing over a pointless topic. One of them turns to you for backup.', question: 'Will you lose face if you stay out of it, or a few teeth if you get involved?' },
  { name: 'Runaway Brahmin', description: 'A loaded pack brahmin breaks free, scattering supplies everywhere as its owner [NPC] runs after it.', question: 'Can you help catch it, or grab something before its owner notices?' },
  { name: 'Street Performer', description: 'An [NPC] wastelander is juggling knives, playing music, or doing card tricks for caps.', question: 'Are they actually talented, or just a distraction for a pickpocket?' },
  { name: 'Stray', description: 'A scruffy-looking Dog watches you from the shadows, tail wagging hopefully.', question: 'Does it belong to someone, or is it looking for a new home?' },
  { name: 'Mysterious Note', description: 'A scrap of paper is slipped into your pocket without explanation. Gain a [SIDE QUEST].', question: "Who gave you this, and why didn't they show their face?" },
  { name: 'Skeleton', description: "Either pre-War or more recent, the body at the settlement's entrance tells a story of someone's final moments.", question: 'These bones were a person once; how did they die?' },
  { name: 'Border Town', description: 'The Settlement is built on the border of a new location. You may choose to immediately Travel to an unexplored adjacent Location. If you do, journal about this discovery and then begin a new Round.', question: 'Would you be able to find this path again?' },
  { name: 'Clue', description: "Choose a side quest you have yet to complete. There is something related to that side quest here, from the item you're searching for to another [NPC] with similar goals.", question: 'How does this forward your goals? Does it also complicate them?' },
  { name: 'A Symbol of Hope', description: 'There is something here that reminds you of your purpose.', question: 'What is it?' },
  { name: 'Mercenary Squatters', description: 'A band of [DANGEROUS NPCS] have moved into the settlement and refuse to leave without good reason. They are disrupting trade and people and could turn violent at a moment\'s notice.', question: 'Who are they? Why are they here, and what could I gain by moving them on?' },
  { name: 'Traveller', description: 'A non-local [NPC] is visiting the town and catches your eye.', question: "If you've met this NPC before, how might their opinion of you change? Why are they here?" },
  { name: 'Billboard', description: "An old advertisement, torn and faded, sits in the center of the settlement — the cause not only of the town's name, but a large portion of its community.", question: 'What does it advertise? Why is it ironic?' },
  { name: 'Charity', description: 'A cough can be heard from the side of the street. Huddled against the corrugated iron is the blanketed shape of an unfortunate [NPC].', question: 'What draws your eye to them? Why can they not thrive in this settlement?' },
  { name: 'Trader', description: 'A suspicious trader offers deals too good to be true. You can make the Trade Action with them, halving the cost of whatever you buy (rounding up).', question: 'Have you seen the trader before? Why do you trust them this time?' },
  { name: 'Incursion', description: 'Somehow, a [FOE] has made their way into the settlement, and you appear to be the first living soul to know.', question: 'Why and how are they here?' }
];

// ===================== WASTELAND ENCOUNTERS (pg.164-165) =====================
export const WASTELAND_ENCOUNTERS: EncounterEntry[] = [
  { name: 'Help!', description: 'An [NPC] is surrounded by [FOES]. If you oppose the foes here, the NPC will immediately give you a [SIDE QUEST].', question: 'Perhaps choosing not to help them would aid you in your next action?' },
  { name: 'Hunted', description: 'A pack of hungry [CREATURES] has picked up your scent.', question: 'Are the creatures hungry or territorial?' },
  { name: 'Raiders', description: 'A group of [RAIDERS] are in the area.', question: 'Why are they here? What would they do if you failed to Oppose them?' },
  { name: 'Not Your Business', description: 'You hear distant gunfire, then silence.', question: 'Perhaps your next encounter will explain the story you missed.' },
  { name: 'Authority', description: 'A heavily armed patrol of [FOES] demands to know your business. Failure to comply may lead to combat.', question: 'Why are they interested? What do you have to hide?' },
  { name: 'Lost', description: 'Fog, night, or general incompetence leads you to immediately travel to a random adjacent location, then roll another encounter for the new location.', question: 'Could you roll a skill check to avoid getting lost?' },
  { name: 'Minefield', description: 'Beep. An old minefield lies along the main road of an old town. The stores are littered with untouched goods; if only you could bypass the minefield.', question: 'How could your skills and equipment help you across safely?' },
  { name: 'Signal', description: 'A radio station crackles to life. Roll a random Location — that is its source.', question: 'What do they say across the radio? What might happen if you arrive at the source?' },
  { name: 'Radstorm', description: 'A radstorm rolls in fast. Your Location gains the Irradiated Truth until the end of the Round.', question: 'How could your Chems and surroundings help you survive?' },
  { name: 'Holotape', description: 'An old Holotape is buried in the dirt. Playing it reveals a message, leading to a [SIDE QUEST].', question: 'What [NPC] left this here?' },
  { name: 'Malfunctioning Robot', description: 'A [ROBOT] is repeating the same phrase over and over and over.', question: 'What is it saying?' },
  { name: 'Lost Child', description: 'A small child [NPC] is wandering the Wasteland, clearly lost.', question: 'Where are their parents, and why were they left alone?' },
  { name: 'War Never Changes…', description: 'A [FOE] in open conflict with a [DANGEROUS NPC].', question: 'What has caused this fight? What do each side have to gain from this?' },
  { name: 'Stolen Item', description: 'A [DANGEROUS NPC] has captured an [NPC] and seems to be threatening them for information on a stolen item.', question: 'Do you intervene, or mind your own business?' },
  { name: 'Supplies', description: 'A small settlement has been abandoned and picked clean — barring a single dose of a [CHEM] you find square in the center of town.', question: 'Who did these belong to?' },
  { name: 'Tracks', description: 'Bloodied footprints lead directly inside a cave or building; even a cursory glance reveals they belong to a [FOE]. Who knows what they\'re doing in there?', question: 'How have they defended themselves? Are they dangerous?' },
  { name: 'Mutants…', description: 'A [SUPER MUTANT] war-tribe is in the area.', question: "What is the tribe's style? What do they want?" },
  { name: 'Musician', description: 'An elderly busker [NPC] plays old songs for a different age.', question: 'The cap in front of him — is it empty or full? Does his music fill you with hope or nostalgia?' },
  { name: 'Stories', description: 'A half-dead traveller lies on the side of the road, coughing as they warn of dangers in a nearby location. Add the Mysterious Danger truth to the location rolled.', question: 'What type of danger did the traveller speak of? Monsters, raiders, radiation, or something stranger still?' },
  { name: 'Weird Wasteland', description: 'A [FOE] is found in an unusual circumstance.', question: 'What situation is the Foe in? Why and how did they get in that situation?' }
];

export const rollSettlementEncounter = (): EncounterEntry => SETTLEMENT_ENCOUNTERS[roll(20) - 1];
export const rollWastelandEncounter = (): EncounterEntry => WASTELAND_ENCOUNTERS[roll(20) - 1];

/** Look up an encounter by an explicit d20 result (1-20). Lets Play the Odds
 *  adjust the roll rather than re-roll blindly (pg.94). */
export const encounterAt = (isSettlement: boolean, n: number): EncounterEntry => {
  const table = isSettlement ? SETTLEMENT_ENCOUNTERS : WASTELAND_ENCOUNTERS;
  return table[Math.max(1, Math.min(20, n)) - 1];
};

// ===================== COMBAT STATES (pg.166-167) =====================
export interface CombatState {
  name: string;
  description: string;
}

export const COMBAT_STATES: CombatState[] = [
  { name: 'High Ground', description: 'Your foes have taken the high ground against you. Melee weapons will be of little use.' },
  { name: 'Low Ground', description: 'You have the high ground over your foes. Melee weapons will be of little use, but a scoped or accurate weapon would be perfect.' },
  { name: 'Explosives', description: "The area has explosives! As an Additional Success or Complication to any roll during this combat, an explosion occurs, either dealing you 2 Damage or reducing a Foe's Threat by 2." },
  { name: 'Killing Field', description: 'An open street, an exposed bluff. There is no cover to speak of here.' },
  { name: 'High Morale', description: 'After rolling any Complication, a random Foe will take an action.' },
  { name: 'Heavy Cover', description: 'The area has ample cover, making ranged attacks and explosives less effective.' },
  { name: 'Difficult Terrain', description: 'The area is difficult to traverse and will slow down most moving through it.' },
  { name: 'Light Cover', description: 'The area has thin cover, enough to stop pistols and small guns, but useless against heavy weaponry.' },
  { name: 'Rubble Cover', description: 'The ample cover makes weapons that rely on direct line of sight less useful, but grenades and similar arcing weapons are perfect for the situation.' },
  { name: 'Traps', description: 'The area is infested with Traps. Any Complications rolled will deal 2 Damage in place of any other effect.' },
  { name: 'Chokepoint', description: 'A clear view with a space to set up a heavy weapon. Whoever controls that space has solid eye-lines in every direction.' },
  { name: 'Danger Zone', description: 'A chasm, irradiated pit, or other dangerous area dominates the combat. If any creature enters the danger zone, they are defeated. If you enter the danger zone, you immediately gain an [INJURY].' },
  { name: 'Clustered', description: "The area has several chokepoints that it's impossible to not bunch up in. Explosives will be more effective in these spots." },
  { name: 'Enclosed Area', description: 'The area is enclosed, either made up of tunnels, corridors, caves, or the inside of a building. Close quarters combat is the standard.' },
  { name: 'Secret Path', description: "A tunnel's concealed entrance is nearby. If you were attacked, the encounter starts with you surrounded by ambushing foes." },
  { name: 'Radiation', description: 'There is either a deadly level of ambient radiation or a sudden spike. At the end of each Action, the acting character suffers 1 Radiation Damage. Foes not immune to radiation have their Threat reduced by 1 after each Action.' },
  { name: 'Moment of Silence', description: 'The combat momentarily pauses, or there is a relative peace before violence breaks out. Both the De-escalate and Retreat actions are at -1 Difficulty.' },
  { name: 'Dead End', description: 'Retreat is impossible.' },
  { name: 'Reinforcements', description: 'A [FOE] arrives, allied with the enemy you are currently fighting. Re-roll the Combat State.' },
  { name: 'Low Morale', description: 'After any Foe is defeated, the rest will flee!' }
];

export const rollCombatStateEntry = (): CombatState => {
  const state = COMBAT_STATES[roll(20) - 1];
  if (state.name === 'Reinforcements') {
    // The book: a Foe arrives, then re-roll the Combat State.
    let rerolled = COMBAT_STATES[roll(20) - 1];
    while (rerolled.name === 'Reinforcements') rerolled = COMBAT_STATES[roll(20) - 1];
    return { name: `Reinforcements + ${rerolled.name}`, description: `${state.description} New state — ${rerolled.name}: ${rerolled.description}` };
  }
  return state;
};

/** Back-compatible string version. */
export const rollCombatState = (): string => {
  const s = rollCombatStateEntry();
  return `${s.name}: ${s.description}`;
};

// ===================== LOCATION + ENCOUNTER ROLLUPS =====================

/** Generates a full new location per the book: Inhabitants → Icon → Truth.
 *  Spacing flags default to false (no nearby settlements known). */
export const rollLocation = (settlementWithin2 = false, settlementAdjacent = false) => {
  const inhabitants = resolveInhabitants(rollInhabitants(), settlementWithin2, settlementAdjacent);
  const isSettlement = inhabitants === 'settlement';
  const icon = rollIcon();
  const truth = isSettlement ? rollSettlementTruth() : rollWastelandTruth();
  return { isSettlement, icon, truth };
};

/** App-level encounter roll used by the Map tab. Mixes the book's encounter
 *  tables with scavenge/combat/hazard outcomes. */
export const rollEncounter = (): EncounterResult => {
  const r = roll(20);

  if (r <= 5) {
    const { isSettlement, icon, truth } = rollLocation();
    const type = isSettlement ? 'settlement' : 'wasteland';
    const enc = isSettlement ? rollSettlementEncounter() : rollWastelandEncounter();
    return {
      type,
      description: `[${icon}] ${truth}\n\n${enc.name}: ${enc.description}`,
      question: enc.question
    };
  } else if (r <= 10) {
    return { type: 'scavenge', description: "You spot an abandoned structure. It looks like it hasn't been looted yet." };
  } else if (r <= 15) {
    const state = rollCombatStateEntry();
    return {
      type: 'enemy',
      description: `You've stumbled into hostile territory! Enemies spotted ahead.\n\nCombat State — ${state.name}: ${state.description}`
    };
  } else {
    const hazardRoll = roll(3);
    const hazards: EncounterResult[] = [
      { type: 'hazard', description: 'You walked into a highly irradiated zone. (Take 1 RAD)', effect: { rads: 1 } },
      { type: 'hazard', description: 'You triggered a rusted tripwire! (Take 1 Damage)', effect: { hp: -1 } },
      { type: 'hazard', description: 'A sudden radstorm rolls in, forcing you to seek shelter. (Lose 1 AP)', effect: { ap: -1 } }
    ];
    return hazards[hazardRoll - 1];
  }
};
