// Per-screen "what do I do here" guidance.
//
// The TutorialOverlay fires once per tab and is then gone forever, so a player
// who dismissed it (or came back a month later) has nothing on screen telling
// them what a stage is for. These hints are persistent, compact, collapsible
// per screen, and can be switched off wholesale in Data → SYS.MGMT.
//
// Keep every line imperative and short — this is a signpost, not a manual. The
// Codex "Start Here" chapter is where the long explanation lives.

export interface ScreenHint {
  /** One-line answer to "what is this screen for?". */
  summary: string;
  /** The concrete steps, in the order you do them. */
  steps: string[];
  /** Optional single gotcha worth knowing. */
  tip?: string;
}

export const SCREEN_HINTS: Record<string, ScreenHint> = {
  // ---------- The Round loop ----------
  'round-travel': {
    summary: 'Choose where to go next.',
    steps: [
      'Tap a square next to you — no diagonals — then Travel.',
      'Travel costs 1 Supply; with none it costs 2 HP.',
      'Dashed squares are unexplored and get generated when you arrive.'
    ],
    tip: '! is your Main Quest Blocker. ? is a Side Quest. Head for the ! when you are ready.'
  },
  'round-encounter': {
    summary: 'Read the scene, then decide whether it is trouble.',
    steps: [
      'Answer the journal prompt — that is the actual play, not busywork.',
      'The app judges Safe or Dangerous for you; tap the override if you disagree.',
      'Then Proceed (safe) or Fight / Talk Down / Outwit / Flee (dangerous).'
    ],
    tip: '"Add to scene" is optional GM tooling — skip it unless you want more going on.'
  },
  'round-action': {
    summary: 'Do something about what you found.',
    steps: [
      'Only actions that are legal right now are listed.',
      'Meet needs an NPC here; Trade needs a settlement; Scavenge is once per Round.',
      'When you are done, End Actions → Journal.'
    ],
    tip: 'In Danger? You have to resolve the threat before the Round can end.'
  },
  'round-journal': {
    summary: 'Write what it meant — not a list of what happened.',
    steps: [
      'Answer any prompt shown above.',
      'A sentence or two is plenty. What did it cost you? What are you afraid of?',
      'Complete the Round to advance a day and start again at Travel.'
    ],
    tip: 'The other tabs already track the facts. This is for the feelings.'
  },
  combat: {
    summary: 'Tap a foe to attack it.',
    steps: [
      'All five modes are real choices: Attack, Slaughter, Outwit, Talk Down, Flee.',
      'Your best weapon is pre-selected — tap the chip to change it.',
      'When something hits you, ENDURE to shrug most of it off.'
    ],
    tip: 'Fleeing is not losing. Living to fight another day is a legitimate outcome.'
  },

  // ---------- Reference tabs ----------
  stats: {
    summary: 'Your character sheet and vitals.',
    steps: [
      'Level Up whenever you have 1+ XP — it buys a Perk and a Level.',
      'Make Camp spends 1 Supply to restore HP and AP.',
      'Tagged skills (*) crit more often; TN = Attribute + Skill rank.'
    ],
    tip: 'Radiation lowers your maximum HP until you clear it.'
  },
  inventory: {
    summary: 'Your gear, caps and consumables.',
    steps: [
      'EQUIP one weapon and one armor — combat uses whatever is equipped.',
      'USE a chem or stimpak to apply its effect immediately.',
      "An item's Value is what it is worth in Stacks of Caps when you Trade."
    ],
    tip: 'Keep an Ammo Box: it cancels an "out of ammunition" complication.'
  },
  data: {
    summary: 'Quest log, people you have met, dice tools and your save.',
    steps: [
      'GEN rolls anything on demand — NPCs, foes, loot, a Side Quest — and files it.',
      'Your Main and Side Quests live here, with their prompts.',
      'Export Save before anything heroic. Export Story when your tale ends.'
    ],
    tip: 'Hard Reset erases everything permanently. Export first.'
  },
  map: {
    summary: 'Free-roam view of the 25 squares.',
    steps: [
      'For the guided game — supply costs, location generation, encounters — use the Round tab.',
      'This view is for looking around and jumping between explored squares.'
    ],
    tip: '! marks your Blocker, ? marks a Side Quest, ⌂ marks a settlement.'
  },
  journal: {
    summary: 'Everything you have written, newest first.',
    steps: [
      'Filter by category to find a thread you left open.',
      'Tap any answer to edit it — entries stay linked to their prompt.',
      'The free-form terminal log sits below the timeline.'
    ],
    tip: 'Unanswered prompts are the fastest cure for "I do not know what happens next".'
  },
  codex: {
    summary: 'The complete rulebook, searchable.',
    steps: [
      'Start Here explains how to actually play a session start to finish.',
      'Search for a rule by name — "complication", "endure", "reputation".',
      'Chapter 7 holds every table the app rolls on.'
    ]
  }
};
