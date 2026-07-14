import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Special {
  S: number; P: number; E: number; C: number; I: number; A: number; L: number;
}

export interface Skill {
  name: string;
  rank: number;
  isTag: boolean;
}

export interface GearItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  weight: number;
  equipped?: boolean;
  description?: string;
  effects?: Record<string, number>;
  /** Book item Value: worth this many Stacks of Caps when Trading. */
  value?: number;
  /** Condition rolled from the Conditions table (e.g. "Rusted, mouldy, corroded"). */
  condition?: string;
  /** Modifications applied to this item (e.g. "Scoped", "Padded"). */
  mods?: string[];
}

export interface VaultData {
  number: number;
  experiment: string;
  population: string;
  reputation: string;
  npcName: string;
  /** Vault Truths gathered during creation (experiment + population truths). */
  truths?: string[];
  /** Region of the Wasteland the adventure takes place in. */
  region?: string;
  /** Linked NPC details: appearance, personality, vault position. */
  npcDetails?: string;
}

export interface QuestData {
  goal: string;
  blocker: string;
  status: string;
  /** Full description of the rolled Goal. */
  goalDesc?: string;
  /** Full description of the rolled Blocker. */
  blockerDesc?: string;
  /** Map square (1-25) on the outer edge where the Blocker lies; null while unknown. */
  blockerLocation?: number | null;
  /** Hunted blocker: d20 threshold for the Hunter to appear (starts 19, drops 1 per quiet Travel). */
  hunterThreshold?: number;
}

export interface SectorInfo {
  explored: boolean;
  scavengeAvailable: boolean;
  isSettlement?: boolean;
  faction?: string;
  icon?: string;
  truths?: string[];
  reputation?: string;
}

export interface TrackedNpc {
  name: string;
  description: string;
  location: number;
}

export interface TrackedSideQuest {
  goalType: string;
  goal: string;
  questions: string;
  reward: string;
  rewardDesc: string;
  location: number;
  giver?: string;
  status: 'Active' | 'Completed' | 'Abandoned';
  /** True once the reward has been renegotiated (LP re-roll or Barter test). */
  renegotiated?: boolean;
}

/** The four stages of a Round (Chapter 5). */
export type RoundStage = 'travel' | 'encounter' | 'action' | 'journal';

/** Category of a structured journal answer, used for grouping/filtering. */
export type JournalEntryType = 'main' | 'side' | 'encounter' | 'oracle' | 'muse';

/** A player-written answer to an in-game prompt (main quest, side quest,
 *  encounter hook, Oracle question, or a Wanderer's Muse inspiration roll).
 *  Keyed by a stable `id` so re-opening the same prompt edits the same entry
 *  rather than creating duplicates. */
export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  question: string;
  answer: string;
  day: number;
  round: number;
  createdTs: number;
  updatedTs: number;
}

export interface EncounterInfo {
  type: string;
  title: string;
  description: string;
  question?: string;
}

export interface GameState {
  // Character Stats
  name: string;
  appearance: string;
  personality: string;
  motivation: string;
  level: number;
  xp: number;
  special: Special;
  skills: Skill[];
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  luck: number;
  maxLuck: number;
  rads: number;
  
  // Inventory
  caps: number;
  supplies: number;
  gear: GearItem[];

  // World State
  currentSector: number;
  journalText: string;
  journalEntries: JournalEntry[];
  sectorData: Record<number, SectorInfo>;

  // Round Engine (Chapter 5: Travel → Encounter → Take Action → Journal)
  round: number;
  day: number;
  stage: RoundStage;
  inDanger: boolean;
  scavengedThisRound: boolean;
  tradedThisRound: boolean;
  currentEncounter: EncounterInfo | null;
  /** Carried difficulty modifier for the NEXT skill test (from complications/boons). */
  nextTestModifier: number;

  // Character progression & data
  perks: { name: string; rank: number }[];
  injuries: string[];
  npcs: TrackedNpc[];
  sideQuests: TrackedSideQuest[];

  // Creation Temporary Data
  vault: VaultData | null;
  mainQuest: QuestData | null;
  
  // Settings / Tutorial
  tutorialEnabled: boolean;
  soundEnabled: boolean;
  /** Tutorial tips already shown (keyed by route). */
  seenTutorials: string[];
  
  // Combat Tracker
  combatActive: boolean;
  activeFoes: Array<{ id: string; template: any; currentThreat: number; buffs: string[] }>;
  combatLog: string[];
  /** Combat State truth rolled at the start of combat (pg.166). */
  combatState: string | null;
  
  // Actions
  setName: (name: string) => void;
  setDescription: (appearance: string, personality: string, motivation: string) => void;
  setSpecial: (special: Special) => void;
  setSkills: (skills: Skill[]) => void;
  setVitals: (hp: number, ap: number, luck: number) => void;
  setVault: (vault: VaultData) => void;
  setMainQuest: (quest: QuestData) => void;
  updateHp: (amount: number) => void;
  updateRads: (amount: number) => void;
  updateAp: (amount: number) => void;
  updateLuck: (amount: number) => void;
  updateSupplies: (amount: number) => void;
  updateCaps: (amount: number) => void;
  updateXp: (amount: number) => void;
  addGear: (item: GearItem) => void;
  removeGear: (id: string) => void;
  equipGear: (id: string) => void;
  consumeItem: (id: string) => void;
  toggleTutorial: () => void;
  toggleSound: () => void;
  markTutorialSeen: (key: string) => void;
  setCurrentSector: (sector: number) => void;
  updateSectorData: (sector: number, data: Partial<SectorInfo>) => void;

  // Round Engine actions
  setStage: (stage: RoundStage) => void;
  setDanger: (inDanger: boolean) => void;
  setEncounter: (encounter: EncounterInfo | null) => void;
  markScavenged: () => void;
  markTraded: () => void;
  completeRound: () => void;
  setNextTestModifier: (value: number) => void;

  // Progression actions
  addPerk: (name: string) => void;
  addInjury: (description: string) => void;
  removeInjury: (index: number) => void;
  addNpc: (npc: TrackedNpc) => void;
  addSideQuest: (quest: TrackedSideQuest) => void;
  setSideQuestStatus: (index: number, status: TrackedSideQuest['status']) => void;
  setJournalText: (text: string) => void;
  appendJournal: (text: string) => void;
  /** Create or update a structured journal answer by stable id. An empty
   *  answer removes the entry (nothing to keep). */
  upsertJournalEntry: (entry: { id: string; type: JournalEntryType; question: string; answer: string }) => void;
  removeJournalEntry: (id: string) => void;
  
  // Combat Actions
  startCombat: (foes: any[]) => void;
  endCombat: () => void;
  addCombatLog: (message: string) => void;
  updateFoeThreat: (id: string, amount: number) => void;
  addFoe: (foe: any) => void;
  removeFoe: (id: string) => void;
  setFoeBuffs: (id: string, buffs: string[]) => void;
  setCombatState: (state: string | null) => void;
}

const initialSkills: Skill[] = [
  { name: 'Athletics', rank: 0, isTag: false },
  { name: 'Barter', rank: 0, isTag: false },
  { name: 'Big Guns', rank: 0, isTag: false },
  { name: 'Energy Weapons', rank: 0, isTag: false },
  { name: 'Explosives', rank: 0, isTag: false },
  { name: 'Lockpick', rank: 0, isTag: false },
  { name: 'Medicine', rank: 0, isTag: false },
  { name: 'Melee Weapons', rank: 0, isTag: false },
  { name: 'Pilot', rank: 0, isTag: false },
  { name: 'Repair', rank: 0, isTag: false },
  { name: 'Science', rank: 0, isTag: false },
  { name: 'Small Guns', rank: 0, isTag: false },
  { name: 'Sneak', rank: 0, isTag: false },
  { name: 'Speech', rank: 0, isTag: false },
  { name: 'Survival', rank: 0, isTag: false },
  { name: 'Throwing', rank: 0, isTag: false },
  { name: 'Unarmed', rank: 0, isTag: false },
];

/** Fresh-character defaults. Used at store creation AND by the Hard Reset so a
 *  wipe always produces a clean slate, even if a stray write races the reload. */
export const getInitialGameData = () => ({
  name: '',
  appearance: '',
  personality: '',
  motivation: '',
  level: 1,
  xp: 0,
  // Book rule (pg.61): every Attribute starts at 4; creation distributes +12.
  special: { S: 4, P: 4, E: 4, C: 4, I: 4, A: 4, L: 4 },
  skills: initialSkills.map(s => ({ ...s })),
  hp: 10,
  maxHp: 10,
  ap: 0,
  maxAp: 5,
  luck: 5,
  maxLuck: 5,
  rads: 0,

  caps: 0,
  // Book rule (pg.69): character creation grants exactly 2 starting Supplies.
  supplies: 2,
  // Book rule (Stage 5): starting equipment comes from two chosen skills
  // with rank 3+, plus 2 Supplies. The Vault Suit is the clothes on your back.
  gear: [
    {
      id: 'start-vault-suit',
      name: 'Vault Suit',
      type: 'Armor',
      quantity: 1,
      weight: 1,
      value: 1,
      description: 'Standard issue Vault-Tec jumpsuit.'
    }
  ],

  currentSector: 13,
  sectorData: { 13: { explored: true, scavengeAvailable: false } } as Record<number, SectorInfo>,
  journalText: "Entry 1: Left the Vault today. The sun is too bright.\n\n[SYSTEM] Ready to explore the Wasteland.\n",
  journalEntries: [] as JournalEntry[],

  round: 1,
  day: 1,
  stage: 'travel' as RoundStage,
  inDanger: false,
  scavengedThisRound: false,
  tradedThisRound: false,
  currentEncounter: null as EncounterInfo | null,
  nextTestModifier: 0,

  perks: [] as { name: string; rank: number }[],
  injuries: [] as string[],
  npcs: [] as TrackedNpc[],
  sideQuests: [] as TrackedSideQuest[],

  vault: null as VaultData | null,
  mainQuest: null as QuestData | null,

  combatActive: false,
  activeFoes: [] as Array<{ id: string; template: any; currentThreat: number; buffs: string[] }>,
  combatLog: [] as string[],
  combatState: null as string | null,

  tutorialEnabled: true,
  soundEnabled: true,
  seenTutorials: [] as string[]
});

export const useGameState = create<GameState>()(
  persist(
    (set) => ({
      ...getInitialGameData(),

      setName: (name) => set({ name }),
      setDescription: (appearance, personality, motivation) => set({ appearance, personality, motivation }),
      setSpecial: (special) => set({ special }),
      setSkills: (skills) => set({ skills }),
      // Book rules: HP = 5 + END (start full); AP is gained through play and
      // capped by Agility (start at 0); Luck Points start at maximum.
      setVitals: (hp, maxAp, luck) => set({ hp, maxHp: hp, ap: 0, maxAp, luck, maxLuck: luck, rads: 0 }),
      setVault: (vault) => set({ vault }),
      setMainQuest: (mainQuest) => set({ mainQuest }),
      updateHp: (amount) => set((state) => {
        // Max HP is reduced by rads
        const currentMaxHp = state.maxHp - state.rads;
        return { hp: Math.max(0, Math.min(currentMaxHp, state.hp + amount)) };
      }),
      updateRads: (amount) => set((state) => {
        const newRads = Math.max(0, state.rads + amount);
        const currentMaxHp = Math.max(1, state.maxHp - newRads);
        return { 
          rads: newRads,
          hp: Math.min(state.hp, currentMaxHp) // Cap HP if Rads push MaxHP below current HP
        };
      }),
      updateAp: (amount) => set((state) => ({ ap: Math.max(0, Math.min(state.maxAp, state.ap + amount)) })),
      updateLuck: (amount) => set((state) => ({ luck: Math.max(0, Math.min(state.maxLuck, state.luck + amount)) })),
      updateSupplies: (amount) => set((state) => ({ supplies: Math.max(0, state.supplies + amount) })),
      updateCaps: (amount) => set((state) => ({ caps: Math.max(0, state.caps + amount) })),
      // Book rule (pg.78/130): XP accumulates and is SPENT via the Level Up
      // action — 1 XP buys 1 Perk and raises your Level by 1.
      updateXp: (amount) => set((state) => ({ xp: Math.max(0, state.xp + amount) })),
      addGear: (item) => set((state) => ({ gear: [...state.gear, item] })),
      removeGear: (id) => set((state) => ({ gear: state.gear.filter(g => g.id !== id) })),
      equipGear: (id) => set((state) => {
        const itemToEquip = state.gear.find(g => g.id === id);
        if (!itemToEquip) return state;
        
        return {
          gear: state.gear.map(g => {
            if (g.id === id) {
              return { ...g, equipped: !g.equipped };
            }
            // If equipping a weapon/armor, unequip other weapons/armor
            if (g.type === itemToEquip.type && itemToEquip.type !== 'Consumable' && itemToEquip.type !== 'Misc' && itemToEquip.type !== 'Junk') {
              if (!itemToEquip.equipped) {
                return { ...g, equipped: false };
              }
            }
            return g;
          })
        };
      }),
      consumeItem: (id) => set((state) => {
        const item = state.gear.find(g => g.id === id);
        if (!item || item.type !== 'Consumable') return state;

        let newHp = state.hp;
        let newAp = state.ap;
        let newRads = state.rads;
        let newJournal = state.journalText;

        if (item.effects) {
          if (item.effects.hp) newHp = Math.max(0, Math.min(state.maxHp - state.rads, state.hp + item.effects.hp));
          if (item.effects.ap) newAp = Math.max(0, Math.min(state.maxAp, state.ap + item.effects.ap));
          if (item.effects.rads) {
            newRads = Math.max(0, state.rads + item.effects.rads);
            newHp = Math.min(newHp, Math.max(1, state.maxHp - newRads));
          }
          newJournal += `\n[SYSTEM] Consumed ${item.name}. Effects applied.\n`;
        }

        return {
          hp: newHp,
          ap: newAp,
          rads: newRads,
          journalText: newJournal,
          gear: state.gear.map(g => {
            if (g.id === id) {
              return { ...g, quantity: g.quantity - 1 };
            }
            return g;
          }).filter(g => g.quantity > 0)
        };
      }),
      toggleTutorial: () => set((state) => ({ tutorialEnabled: !state.tutorialEnabled })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      markTutorialSeen: (key) => set((state) => ({
        seenTutorials: state.seenTutorials.includes(key) ? state.seenTutorials : [...state.seenTutorials, key]
      })),
      setCurrentSector: (sector) => set({ currentSector: sector }),
      updateSectorData: (sector, data) => set((state) => ({ 
        sectorData: { 
          ...state.sectorData, 
          [sector]: { ...(state.sectorData[sector] || { explored: false, scavengeAvailable: false }), ...data } 
        } 
      })),
      setJournalText: (text) => set({ journalText: text }),

      // Round Engine
      setStage: (stage) => set({ stage }),
      setDanger: (inDanger) => set({ inDanger }),
      setEncounter: (currentEncounter) => set({ currentEncounter }),
      markScavenged: () => set({ scavengedThisRound: true }),
      markTraded: () => set({ tradedThisRound: true }),
      setNextTestModifier: (nextTestModifier) => set({ nextTestModifier }),
      completeRound: () => set((state) => ({
        round: state.round + 1,
        day: state.day + 1,
        stage: 'travel',
        inDanger: false,
        scavengedThisRound: false,
        tradedThisRound: false,
        currentEncounter: null
      })),

      // Progression
      addPerk: (name) => set((state) => {
        if (state.xp < 1) return state;
        const existing = state.perks.find(p => p.name === name);
        const perks = existing
          ? state.perks.map(p => p.name === name ? { ...p, rank: p.rank + 1 } : p)
          : [...state.perks, { name, rank: 1 }];
        return {
          perks,
          xp: state.xp - 1,
          level: state.level + 1,
          journalText: state.journalText + `\n[SYSTEM] Level Up! Gained Perk: ${name}. Now Level ${state.level + 1}.\n`
        };
      }),
      addInjury: (description) => set((state) => ({
        injuries: [...state.injuries, description],
        journalText: state.journalText + `\n[SYSTEM] Suffered Injury: ${description}\n`
      })),
      removeInjury: (index) => set((state) => ({
        injuries: state.injuries.filter((_, i) => i !== index)
      })),
      addNpc: (npc) => set((state) => ({
        npcs: [...state.npcs, npc],
        // Book rule (pg.117): meeting a brand new NPC grants 1 XP.
        xp: state.xp + 1
      })),
      addSideQuest: (quest) => set((state) => ({ sideQuests: [...state.sideQuests, quest] })),
      setSideQuestStatus: (index, status) => set((state) => ({
        sideQuests: state.sideQuests.map((q, i) => i === index ? { ...q, status } : q)
      })),
      appendJournal: (text) => set((state) => ({ journalText: state.journalText + `\n[SYSTEM] ${text}\n` })),
      upsertJournalEntry: ({ id, type, question, answer }) => set((state) => {
        const trimmed = answer.trim();
        const existing = state.journalEntries.find(e => e.id === id);
        // Empty answer: drop any existing entry, otherwise no-op.
        if (!trimmed) {
          return existing ? { journalEntries: state.journalEntries.filter(e => e.id !== id) } : state;
        }
        const now = Date.now();
        if (existing) {
          return {
            journalEntries: state.journalEntries.map(e =>
              e.id === id ? { ...e, question, answer: trimmed, updatedTs: now } : e),
          };
        }
        return {
          journalEntries: [
            ...state.journalEntries,
            { id, type, question, answer: trimmed, day: state.day, round: state.round, createdTs: now, updatedTs: now },
          ],
        };
      }),
      removeJournalEntry: (id) => set((state) => ({
        journalEntries: state.journalEntries.filter(e => e.id !== id),
      })),
      
      startCombat: (foes) => set({ 
        combatActive: true, 
        activeFoes: foes.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          template: f,
          currentThreat: f.threat,
          buffs: []
        })),
        combatLog: ['Combat started!']
      }),
      endCombat: () => set({ combatActive: false, activeFoes: [], combatLog: [], combatState: null }),
      removeFoe: (id) => set((state) => ({ activeFoes: state.activeFoes.filter(f => f.id !== id) })),
      setFoeBuffs: (id, buffs) => set((state) => ({
        activeFoes: state.activeFoes.map(f => f.id === id ? { ...f, buffs } : f)
      })),
      setCombatState: (combatState) => set({ combatState }),
      addCombatLog: (message) => set((state) => ({ combatLog: [...state.combatLog, message] })),
      updateFoeThreat: (id, amount) => set((state) => ({
        activeFoes: state.activeFoes.map(f => {
          if (f.id === id) {
            const newThreat = Math.max(0, f.currentThreat + amount);
            return { ...f, currentThreat: newThreat };
          }
          return f;
        }).filter(f => f.currentThreat > 0) // Automatically remove defeated foes
      })),
      addFoe: (foe) => set((state) => ({
        activeFoes: [...state.activeFoes, {
          id: Math.random().toString(36).substr(2, 9),
          template: foe,
          currentThreat: foe.threat,
          buffs: []
        }],
        combatLog: [...state.combatLog, `A ${foe.name} joins the fight!`]
      }))
    }),
    {
      name: 'wasteland-wanderer-storage',
    }
  )
);
