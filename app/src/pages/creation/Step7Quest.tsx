import { useGameState } from '../../store/gameState';
import { QUEST_GOALS, QUEST_BLOCKERS, rollD20 } from '../../data/creationTables';

// Outer-edge squares of the 5x5 map (numbered 1-25), minus the impassable
// squares used by the Map tab ([3, 8, 21, 24]) and the central Vault (13).
const EDGE_SQUARES = [1, 2, 4, 5, 6, 10, 11, 15, 16, 20, 22, 23, 25];

const rollBlockerLocation = (): number =>
  EDGE_SQUARES[Math.floor(Math.random() * EDGE_SQUARES.length)];

export default function Step7Quest() {
  const { mainQuest, setMainQuest } = useGameState();

  const randomizeQuest = () => {
    const goalRoll = rollD20();
    const blockerRoll = rollD20();

    const goal = QUEST_GOALS.find(g => g.roll === goalRoll);
    const blocker = QUEST_BLOCKERS.find(b => blockerRoll >= b.min && blockerRoll <= b.max);

    // Unknown Location (1-2) skips the Blocker Location step until resolved.
    const skipLocation = blocker?.name === 'Unknown Location';

    setMainQuest({
      goal: goal?.name || 'Unknown Goal',
      goalDesc: goal?.desc,
      blocker: blocker?.name || 'Unknown Blocker',
      blockerDesc: blocker?.desc,
      blockerLocation: skipLocation ? null : rollBlockerLocation(),
      status: 'Active'
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-1">Stage 7: Main Quest</h3>
      <p className="opacity-80 normal-case">
        Generate your Goal, the Blocker standing in your way, and the Blocker Location
        on the outer edge of your map.
      </p>

      <button
        onClick={randomizeQuest}
        className="w-full border-2 border-[#14FF00] p-3 text-center uppercase hover:bg-[#14FF00] hover:text-black transition-colors"
      >
        Randomize Quest
      </button>

      {mainQuest && (
        <div className="mt-4 border border-[#14FF00] p-4 bg-[#051a05] space-y-3">
          <div>
            <div className="opacity-70 text-sm">GOAL:</div>
            <div className="font-bold text-white text-lg">{mainQuest.goal}</div>
            <div className="text-xs opacity-70 mt-1 normal-case">{mainQuest.goalDesc}</div>
          </div>

          <div className="pt-4 border-t border-[#14FF00]/30">
            <div className="opacity-70 text-sm">BLOCKER:</div>
            <div className="font-bold text-white text-lg">{mainQuest.blocker}</div>
            <div className="text-xs opacity-70 mt-1 normal-case">{mainQuest.blockerDesc}</div>
          </div>

          <div className="pt-4 border-t border-[#14FF00]/30">
            <div className="opacity-70 text-sm">BLOCKER LOCATION:</div>
            {mainQuest.blockerLocation ? (
              <div className="font-bold text-white text-lg">
                Map Square {mainQuest.blockerLocation} <span className="text-xs opacity-70">(outer edge)</span>
              </div>
            ) : (
              <div className="font-bold text-amber-400 text-sm normal-case">
                Unknown — find a map or knowledgeable NPC first. Side Quest rewards can be
                exchanged for this information.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
