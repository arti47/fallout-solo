import { useNavigate } from 'react-router-dom';
import { useGameState } from '../store/gameState';
import { getRandomFoe } from '../data/bestiary';
import { rollCombatStateEntry } from '../data/encounters';
import CombatView from '../components/CombatView';
import { Skull } from 'lucide-react';

// Hidden quick-skirmish sandbox. The canonical encounter → combat flow now
// lives inside the Round loop (RoundTab renders CombatView inline); this route
// is kept only for spinning up a fast one-off fight for testing.
export default function CombatTab() {
  const { combatActive, startCombat, setCombatState, setDanger } = useGameState();
  const navigate = useNavigate();

  const startSkirmish = () => {
    const numFoes = Math.floor(Math.random() * 3) + 1;
    const foes = Array.from({ length: numFoes }).map(() => getRandomFoe());
    startCombat(foes);
    const state = rollCombatStateEntry();
    setCombatState(`${state.name}: ${state.description}`);
    setDanger(true);
  };

  if (combatActive) {
    return (
      <div className="p-1">
        <CombatView onExit={() => navigate('/round')} />
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center h-full space-y-6">
      <h2 className="text-2xl uppercase font-bold text-center border-b border-[#14FF00] pb-2">Quick Skirmish</h2>
      <p className="text-center opacity-80 normal-case max-w-sm">
        Real encounters begin in the <span className="text-[#14FF00] font-bold uppercase">Round</span> loop.
        This is a sandbox for spinning up a fast test fight.
      </p>
      <button
        onClick={startSkirmish}
        className="border-2 border-[#14FF00] p-4 uppercase hover:bg-[#14FF00] hover:text-black transition-colors font-bold text-lg flex items-center gap-2"
      >
        <Skull /> Trigger Random Fight
      </button>
    </div>
  );
}
