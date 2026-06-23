import { useEffect, useState } from 'react';
import { useGameState } from '../../store/gameState';
import { EQUIPMENT_MAPPING } from '../../data/creationTables';

const STARTING_GEAR_PREFIX = 'start-skill-';

export default function Step5Equipment({ onComplete }: { onComplete?: () => void }) {
  const { skills, gear } = useGameState();

  // Book rule (pg.69): choose TWO skills with at least 3 ranks; gain the
  // equipment tied to them, plus 2 Supplies (added on finish).
  const eligibleSkills = skills.filter(s => s.rank >= 3 && EQUIPMENT_MAPPING[s.name]);

  const [selected, setSelected] = useState<string[]>(() => {
    // Default: keep any previous picks, else preselect the two highest.
    const previous = gear
      .filter(g => g.id.startsWith(STARTING_GEAR_PREFIX))
      .map(g => g.id.slice(STARTING_GEAR_PREFIX.length));
    if (previous.length > 0) return previous;
    return [...eligibleSkills].sort((a, b) => b.rank - a.rank).slice(0, 2).map(s => s.name);
  });

  const toggleSkill = (name: string) => {
    setSelected(prev => {
      if (prev.includes(name)) return prev.filter(s => s !== name);
      if (prev.length >= 2) return prev;
      return [...prev, name];
    });
  };

  // Keep the gear list in sync with the selection.
  useEffect(() => {
    useGameState.setState(state => {
      const kept = state.gear.filter(g => !g.id.startsWith(STARTING_GEAR_PREFIX));
      const added = selected
        .filter(name => EQUIPMENT_MAPPING[name])
        .map(name => {
          const item = EQUIPMENT_MAPPING[name];
          return {
            id: `${STARTING_GEAR_PREFIX}${name}`,
            name: item.name,
            weight: item.weight,
            type: 'Equipment',
            quantity: item.quantity,
            description: `Starting equipment (${name})`
          };
        });
      return { gear: [...kept, ...added] };
    });
  }, [selected]);

  // Auto-advance once both skill items are picked (or none are available).
  const stepDone = selected.length === 2 || eligibleSkills.length < 2;
  useEffect(() => {
    if (stepDone && onComplete) {
      const timer = setTimeout(onComplete, 1800);
      return () => clearTimeout(timer);
    }
  }, [stepDone, onComplete]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-1">Stage 5: Equipment</h3>
      <p className="opacity-80 normal-case">
        Choose <span className="font-bold text-white">two</span> skills with Rank 3 or higher.
        You receive the equipment tied to each, plus 2 Supplies when you finish.
      </p>

      {eligibleSkills.length === 0 ? (
        <div className="italic text-amber-400 border border-amber-400 p-3">
          No skills at Rank 3 or higher — go back to Stage 3 and raise at least one skill to 3.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-bold border-b border-[#14FF00] pb-1">
            SELECTED: <span className={selected.length === 2 ? 'text-white' : 'text-amber-400'}>{selected.length}/2</span>
          </div>
          {eligibleSkills.map(skill => {
            const item = EQUIPMENT_MAPPING[skill.name];
            const isSelected = selected.includes(skill.name);
            return (
              <button
                key={skill.name}
                onClick={() => toggleSkill(skill.name)}
                disabled={!isSelected && selected.length >= 2}
                className={`w-full flex justify-between items-center border p-3 transition-colors ${
                  isSelected
                    ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold'
                    : 'border-[#14FF00] hover:bg-[#14FF00]/10 disabled:opacity-40'
                }`}
              >
                <span>{skill.name} (Rank {skill.rank})</span>
                <span className="text-sm">{item.quantity > 1 ? `x${item.quantity} ` : ''}{item.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 border border-[#14FF00] p-4 bg-[#051a05]">
        <h4 className="font-bold mb-2 opacity-80">STARTING INVENTORY:</h4>
        <ul className="space-y-1">
          {gear.map(item => (
            <li key={item.id} className="flex justify-between border-b border-[#14FF00]/30 pb-1">
              <span className="text-white">{item.name} <span className="opacity-70 text-xs">x{item.quantity}</span></span>
              <span className="opacity-70 text-xs">{item.description}</span>
            </li>
          ))}
          <li className="text-white pt-1">+ 2 Supplies (added when you enter the Wasteland)</li>
        </ul>
      </div>
    </div>
  );
}
