import { useState, useEffect } from 'react';
import { useGameState } from '../../store/gameState';
import type { Special } from '../../store/gameState';

const SPECIAL_NAMES: Record<string, string> = {
  S: 'Strength',
  P: 'Perception',
  E: 'Endurance',
  C: 'Charisma',
  I: 'Intelligence',
  A: 'Agility',
  L: 'Luck'
};

export default function Step2Special({ onComplete }: { onComplete?: () => void }) {
  const { special, setSpecial } = useGameState();
  const [localSpecial, setLocalSpecial] = useState<Special>(special);

  const calculatePointsSpent = () => {
    return Object.values(localSpecial).reduce((total, val) => total + (val - 4), 0);
  };

  const pointsRemaining = 12 - calculatePointsSpent();

  // Auto-advance once every point is spent (with a beat to review).
  useEffect(() => {
    if (pointsRemaining === 0 && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [pointsRemaining, onComplete]);

  const handleAdjust = (attr: keyof Special, amount: number) => {
    const current = localSpecial[attr];
    const newAmount = current + amount;
    
    // Constraints: Min 4, Max 10
    if (newAmount < 4 || newAmount > 10) return;
    
    // Constraint: Can't spend more than 12 points total
    if (amount > 0 && pointsRemaining <= 0) return;

    setLocalSpecial({ ...localSpecial, [attr]: newAmount });
  };

  // Sync to global state when component unmounts or changes
  useEffect(() => {
    setSpecial(localSpecial);
  }, [localSpecial, setSpecial]);

  // Book example spreads (pg.61). Values are assigned in S.P.E.C.I.A.L. order;
  // adjust afterwards to taste.
  const PRESETS: Record<string, number[]> = {
    Balanced: [6, 6, 6, 6, 6, 5, 5],
    Focused: [8, 7, 6, 6, 5, 4, 4],
    Specialized: [9, 8, 5, 5, 5, 4, 4]
  };

  const applyPreset = (values: number[]) => {
    const keys: (keyof Special)[] = ['S', 'P', 'E', 'C', 'I', 'A', 'L'];
    const next = { ...localSpecial };
    keys.forEach((k, i) => { next[k] = values[i]; });
    setLocalSpecial(next);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-1">Stage 2: S.P.E.C.I.A.L.</h3>
      <p className="opacity-80">Allocate your 12 points across the 7 attributes. Each starts at 4 and can go up to 10.</p>

      <div className="flex gap-2">
        {Object.entries(PRESETS).map(([name, values]) => (
          <button
            key={name}
            onClick={() => applyPreset(values)}
            className="flex-1 border border-[#14FF00] p-2 text-sm uppercase hover:bg-[#14FF00] hover:text-black transition-colors"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="text-center font-bold text-xl py-2 border-y border-[#14FF00]">
        POINTS REMAINING: <span className={pointsRemaining === 0 ? 'text-white' : 'text-amber-400'}>{pointsRemaining}</span>
      </div>

      <div className="space-y-2 mt-4">
        {Object.entries(localSpecial).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between border border-[#14FF00] p-2 bg-[#051a05]">
            <span className="font-bold w-32 text-left text-lg pl-2">
              <span className="text-white opacity-80 mr-2">{key}.</span> 
              {SPECIAL_NAMES[key]}
            </span>
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => handleAdjust(key as keyof Special, -1)}
                disabled={val === 4}
                className="px-3 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#14FF00]"
              >
                -
              </button>
              <span className="w-6 text-center text-white text-xl">{val}</span>
              <button 
                onClick={() => handleAdjust(key as keyof Special, 1)}
                disabled={val === 10 || pointsRemaining === 0}
                className="px-3 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#14FF00]"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
