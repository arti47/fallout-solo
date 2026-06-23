import { useEffect } from 'react';
import { useGameState } from '../../store/gameState';

export default function Step4Vitals({ onComplete }: { onComplete?: () => void }) {
  const { special, setVitals } = useGameState();

  // Book rules (pg.69): Max HP = 5 + END; Max Luck Points = half LCK, rounded up.
  // AP is earned through extra Successes during play, capped by Agility (pg.95).
  const calcHp = 5 + special.E;
  const calcLuck = Math.ceil(special.L / 2);
  const calcMaxAp = special.A;

  useEffect(() => {
    setVitals(calcHp, calcMaxAp, calcLuck);
  }, [calcHp, calcMaxAp, calcLuck, setVitals]);

  // Purely informational — show the numbers briefly, then move on.
  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-1">Stage 4: Health & Luck</h3>
      <p className="opacity-80">Your vitals are calculated automatically from your S.P.E.C.I.A.L. attributes.</p>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="border border-[#14FF00] p-4 text-center bg-[#051a05]">
          <div className="text-sm opacity-80 mb-2">MAX HP (5 + END)</div>
          <div className="text-4xl font-bold text-white">{calcHp}</div>
        </div>

        <div className="border border-[#14FF00] p-4 text-center bg-[#051a05]">
          <div className="text-sm opacity-80 mb-2">MAX LUCK (½ LCK ↑)</div>
          <div className="text-4xl font-bold text-white">{calcLuck}</div>
        </div>

        <div className="border border-[#14FF00] p-4 text-center bg-[#051a05]">
          <div className="text-sm opacity-80 mb-2">MAX AP (= AGI)</div>
          <div className="text-4xl font-bold text-white">{calcMaxAp}</div>
        </div>
      </div>

      <div className="text-center mt-4 opacity-70 text-sm italic normal-case">
        Action Points start at 0 — you earn them by rolling more Successes than a
        test requires, and can never hold more than your Agility.
      </div>
    </div>
  );
}
