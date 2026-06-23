import { useLocation } from 'react-router-dom';
import { useGameState } from '../store/gameState';

// Vault-Tec contextual onboarding: one tip per tab, shown the first time a
// first-time player lands there. Re-enable via Data → SYS.MGMT.
const TIPS: Record<string, { title: string; message: string }> = {
  '/round': {
    title: 'Vault-Tec Tip: The Round',
    message: 'This is your game loop! Each Round: TRAVEL to an adjacent square (1 Supply), face an ENCOUNTER, take ACTIONS (scavenge, trade, quest…), then JOURNAL your story. The stage tracker up top always shows where you are.'
  },
  '/combat': {
    title: 'Vault-Tec Tip: Combat',
    message: 'Pick an action and a weapon skill, then attack — your target\'s Threat sets the difficulty. After every action of yours, one foe acts (highest Threat first). When something hits you, ENDURE to shrug it off. De-escalate or Retreat are always options… usually.'
  },
  '/stats': {
    title: 'Vault-Tec Tip: Stats',
    message: 'Your vitals at a glance. HP = 5 + Endurance (radiation lowers the max!), Luck Points bend fate, and AP is earned by rolling extra successes — spend it on re-rolls and bonuses.'
  },
  '/inventory': {
    title: 'Vault-Tec Tip: Inventory',
    message: 'Equip one weapon and one armor; consume Stimpaks and chems for their effects. Item Value = what it\'s worth in Stacks of Caps when trading. Keep an Ammo Box handy for "out of ammo" emergencies!'
  },
  '/data': {
    title: 'Vault-Tec Tip: Data',
    message: 'Your quest log and address book: the Main Quest with its Blocker, Side Quests, and every NPC you\'ve met. Save management lives here too — export your save before doing anything heroic.'
  },
  '/map': {
    title: 'Vault-Tec Tip: Map',
    message: 'The free-roam map view. For the full guided experience (location generation, encounters, supply costs), travel from the ROUND tab instead. ! marks your Main Quest Blocker, ? marks Side Quests.'
  },
  '/journal': {
    title: 'Vault-Tec Tip: Journal',
    message: 'Your story lives here. The app auto-logs [SYSTEM] events; the Round loop adds dated entries. Write in first person, keep it punchy — and when your story ends, this becomes your Epilogue.'
  },
  '/codex': {
    title: 'Vault-Tec Tip: Codex',
    message: 'The complete rulebook, searchable, on your wrist. Rules fuzzy? Search "complication" or browse Chapter 4. Lore-hungry? Chapter 2 covers every faction in the Wasteland.'
  }
};

export default function TutorialOverlay() {
  const { pathname } = useLocation();
  const { tutorialEnabled, toggleTutorial, seenTutorials, markTutorialSeen } = useGameState();

  const tip = TIPS[pathname];
  if (!tutorialEnabled || !tip || seenTutorials.includes(pathname)) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-[#051A05] border-2 border-[#14FF00] p-4 z-40 shadow-[0_0_10px_#14FF00]">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold uppercase tracking-widest text-[#14FF00]">{tip.title}</h4>
        <button onClick={() => markTutorialSeen(pathname)} className="text-[#14FF00] hover:text-white font-bold">X</button>
      </div>
      <p className="text-sm text-[#14FF00] opacity-90 leading-relaxed mb-4">
        {tip.message}
      </p>
      <div className="flex justify-between items-center text-xs">
        <button
          onClick={toggleTutorial}
          className="uppercase opacity-70 hover:opacity-100 transition-opacity"
        >
          Disable Tutorials
        </button>
        <button
          onClick={() => markTutorialSeen(pathname)}
          className="uppercase border border-[#14FF00] px-3 py-1 hover:bg-[#14FF00] hover:text-black transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
