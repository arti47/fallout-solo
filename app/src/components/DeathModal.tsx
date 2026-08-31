import { useState } from 'react';
import { useGameState } from '../store/gameState';
import { rollMiraculousEscape } from '../data/characterTables';
import { rollIcon, rollWastelandTruth, rollSettlementTruth, rollInhabitants, resolveInhabitants } from '../data/encounters';
import { generateFullNpc, rollFaction } from '../data/npcTables';
import { rollSettlementReputation } from '../data/characterTables';
import EpilogueModal from './EpilogueModal';
import { Skull, HeartCrack, Sparkles } from 'lucide-react';

// Death (pg.97): when an Injury could kill you, YOU decide. The questions below
// are the book's guideposts. Miraculous Escape (pg.97/218): spend ALL Luck
// Points (minimum 1) to survive — the table decides how.
const DEATH_QUESTIONS = [
  'In their current situation, would this Injury make it impossible for my character to survive?',
  'Does this Injury remove a core aspect of the character I enjoy playing?',
  'Would this be a narratively satisfying moment for my character to die?',
  'Has my character accrued so many Injuries that it would make no sense for them to survive?'
];

export default function DeathModal() {
  const { hp, maxHp, rads, luck, updateHp, updateLuck, appendJournal, injuries } = useGameState();
  const [escape, setEscape] = useState<{ name: string; description: string } | null>(null);
  const [epilogue, setEpilogue] = useState(false);

  // The Epilogue outlives the death screen: once it is open it stays open even
  // after a heal, so closing it never strands the player on a blank page.
  if (epilogue) return <EpilogueModal kind="death" onClose={() => setEpilogue(false)} />;
  if (hp > 0) return null;

  const handleLiveOn = () => {
    updateHp(1);
    appendJournal('Knocked to the brink, but this is not the end. The story continues.');
  };

  // Each Escape result carries a real mechanical consequence (pg.218); they
  // used to be flavour text with a flat 1 HP.
  const applyEscapeEffect = (name: string) => {
    const s = useGameState.getState();
    const adjacent = [s.currentSector - 5, s.currentSector + 5,
      ...(s.currentSector % 5 !== 1 ? [s.currentSector - 1] : []),
      ...(s.currentSector % 5 !== 0 ? [s.currentSector + 1] : [])]
      .filter(n => n >= 1 && n <= 25 && ![3, 8, 21, 24].includes(n));
    const pick = <T,>(a: T[]): T | undefined => a[Math.floor(Math.random() * a.length)];

    switch (name) {
      case 'Captured': {
        // Generate a Location and move there as a prisoner.
        const target = pick(adjacent) ?? s.currentSector;
        const isSettlement = resolveInhabitants(rollInhabitants(), false, false) === 'settlement';
        s.updateSectorData(target, {
          explored: true, scavengeAvailable: true, isSettlement,
          icon: rollIcon(),
          truths: [isSettlement ? rollSettlementTruth() : rollWastelandTruth(), 'You are a captive here'],
          faction: isSettlement ? rollFaction() : undefined,
          reputation: isSettlement ? rollSettlementReputation() : undefined
        });
        s.setCurrentSector(target);
        appendJournal(`Captured — you wake in their camp at Square ${target}. Plan your escape.`);
        break;
      }
      case 'Fell': {
        const target = pick(adjacent) ?? s.currentSector;
        s.updateSectorData(target, {
          explored: true,
          scavengeAvailable: s.sectorData[target]?.scavengeAvailable ?? true,
          truths: [...(s.sectorData[target]?.truths ?? []), 'Metro: a buried transit line runs beneath']
        });
        s.setCurrentSector(target);
        appendJournal(`Fell through into the metro — you surface at Square ${target}, which gains the Metro Truth.`);
        break;
      }
      case 'Unconscious': {
        const settlement = Object.entries(s.sectorData).find(([, i]) => i.isSettlement)?.[0];
        const target = settlement ? Number(settlement) : s.currentSector;
        s.setCurrentSector(target);
        const n = generateFullNpc();
        s.addNpc({
          name: n.name,
          description: `${n.age} ${n.demeanor} ${n.profession} (${n.faction}) — watched over you while you were out. Truth: ${n.truth}`,
          location: target
        });
        appendJournal(`Unconscious — you wake at Square ${target} with ${n.name} watching over you. (+1 XP)`);
        break;
      }
      case 'Mysterious Stranger': {
        // Granted regardless of requirements, so this bypasses addPerk's XP cost.
        useGameState.setState(st => ({
          perks: st.perks.some(p => p.name === 'Mysterious Stranger')
            ? st.perks
            : [...st.perks, { name: 'Mysterious Stranger', rank: 1 }]
        }));
        appendJournal('A man in a trenchcoat finishes the job — you gain the Mysterious Stranger Perk.');
        break;
      }
      case 'Dragged to Safety': {
        useGameState.setState({
          gear: [{
            id: `dog-${Date.now()}`, name: 'Dog (name them)', type: 'Companion',
            quantity: 1, weight: 0, description: 'Woke you by licking your face. Yours now.'
          }]
        });
        appendJournal('Looted and left for dead — you lose all your equipment, but a Dog wakes you. Name them.');
        break;
      }
    }
  };

  const handleMiraculousEscape = () => {
    const result = rollMiraculousEscape();
    // Spend ALL Luck Points (must spend at least 1).
    updateLuck(-luck);
    setEscape(result);
    appendJournal(`MIRACULOUS ESCAPE (spent all Luck) — ${result.name}: ${result.description}`);
    if (result.name === 'Grit') {
      updateHp(Math.ceil(Math.max(1, maxHp - rads) / 2));
    } else if (result.name !== 'This Is It…') {
      updateHp(1);
      applyEscapeEffect(result.name);
    }
  };

  const handleEndStory = () => {
    appendJournal('The end of the road. Writing the Epilogue.');
    setEpilogue(true);
  };

  if (escape) {
    const fatal = escape.name === 'This Is It…';
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 font-mono uppercase text-center">
        <div className={`relative z-10 flex flex-col items-center max-w-md w-full border-4 p-8 bg-black ${fatal ? 'border-red-500 text-red-500' : 'border-amber-400 text-amber-400 shadow-[0_0_50px_rgba(255,200,0,0.4)]'}`}>
          <Sparkles size={48} className="mb-4" />
          <h1 className="text-2xl font-bold mb-3 tracking-widest">{escape.name}</h1>
          <p className="opacity-90 mb-8 normal-case text-sm">{escape.description}</p>
          {fatal ? (
            <button onClick={handleEndStory} className="w-full border-2 border-red-500 p-4 font-bold hover:bg-red-500 hover:text-black transition-colors">
              <Skull className="inline mr-2" size={18} /> Write the Epilogue
            </button>
          ) : (
            <button onClick={() => { setEscape(null); if (hp === 0) updateHp(1); }} className="w-full border-2 border-amber-400 p-4 font-bold hover:bg-amber-400 hover:text-black transition-colors">
              Wake Up…
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 text-red-500 font-mono uppercase text-center overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,0,0.2)_0%,rgba(0,0,0,1)_80%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full border-4 border-red-500 p-6 bg-black shadow-[0_0_50px_rgba(255,0,0,0.5)]">
        <HeartCrack size={48} className="mb-3 animate-pulse" />
        <h1 className="text-3xl font-bold mb-2 tracking-widest">0 HP — AT DEATH'S DOOR</h1>

        {injuries.length > 0 && (
          <div className="text-xs normal-case opacity-80 mb-3 border border-red-500/50 p-2 w-full">
            Injuries: {injuries.join(' • ')}
          </div>
        )}

        <p className="opacity-80 mb-3 normal-case text-sm">
          Your character's death is in your hands. Ask yourself the book's questions:
        </p>
        <ul className="text-left text-xs normal-case opacity-80 mb-5 space-y-1.5 list-disc pl-5">
          {DEATH_QUESTIONS.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
        <p className="text-xs normal-case opacity-60 mb-4">If any answer is "yes", it may be time for this story to end.</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleLiveOn}
            className="w-full border-2 border-[#14FF00] text-[#14FF00] p-3 font-bold tracking-widest hover:bg-[#14FF00] hover:text-black transition-colors"
          >
            The Answer Is No — Live On (1 HP)
          </button>

          <button
            onClick={handleMiraculousEscape}
            disabled={luck < 1}
            className="w-full border-2 border-amber-400 text-amber-400 p-3 font-bold tracking-widest hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-amber-400"
          >
            <Sparkles className="inline mr-1" size={16} /> Miraculous Escape (spend ALL {luck} LP)
          </button>

          <button
            onClick={handleEndStory}
            className="w-full border-2 border-red-500 p-3 font-bold tracking-widest hover:bg-red-500 hover:text-black transition-colors flex justify-center items-center gap-2"
          >
            <Skull size={18} /> This Is the End — Epilogue
          </button>
        </div>
      </div>
    </div>
  );
}
