import { ChevronRight, Swords, Flag } from 'lucide-react';
import type { DirectorStep } from '../utils/director';

/** The big "do this next" button. It is the loudest thing on the Round tab on
 *  purpose: a player who reads nothing else can press this every time and the
 *  game will still play correctly from start to finish. */
export default function NextStep({ step, onGo }: { step: DirectorStep; onGo: (step: DirectorStep) => void }) {
  const danger = step.kind === 'fight' || step.kind === 'inCombat' || step.kind === 'dying';
  const terminal = !!step.terminal;

  const accent = terminal
    ? 'border-amber-400 text-amber-400 hover:bg-amber-400'
    : danger
      ? 'border-red-500 text-red-500 hover:bg-red-500'
      : 'border-[#14FF00] text-[#14FF00] hover:bg-[#14FF00]';

  // Combat drives itself — show the instruction, but do not offer a button
  // that would fight the combat UI for the same tap.
  const actionable = step.kind !== 'inCombat' && step.kind !== 'dying';

  return (
    <div className={`border-2 p-3 space-y-2 bg-[#051a05] ${terminal ? 'border-amber-400' : danger ? 'border-red-500' : 'border-[#14FF00]'}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
        Do this next
      </div>

      {actionable ? (
        <button
          onClick={() => onGo(step)}
          className={`w-full border-2 rounded-sm p-4 font-bold text-base uppercase flex items-center justify-between gap-2 transition-colors hover:text-black ${accent}`}
        >
          <span className="flex items-center gap-2 text-left">
            {terminal ? <Flag size={18} className="shrink-0" /> : danger ? <Swords size={18} className="shrink-0" /> : null}
            {step.label}
          </span>
          <ChevronRight size={20} className="shrink-0" />
        </button>
      ) : (
        <div className={`w-full border-2 rounded-sm p-4 font-bold text-base uppercase flex items-center gap-2 ${terminal ? 'border-amber-400 text-amber-400' : 'border-red-500 text-red-500'}`}>
          <Swords size={18} className="shrink-0" /> {step.label}
        </div>
      )}

      <p className="text-xs normal-case opacity-80">{step.why}</p>
    </div>
  );
}
