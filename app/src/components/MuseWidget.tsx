import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import AnswerBox from './AnswerBox';
import { useGameState } from '../store/gameState';
import { rollMusePair } from '../data/museTable';
import { sfx } from '../utils/sound';

// The Wanderer's Muse — a d100 Elements Meaning Table (two words per roll).
// A floating inspiration roller stacked above the Oracle button: when the
// story stalls, roll a pair of evocative words and interpret what they mean.
const SHUFFLE_TICKS = 12;
const SHUFFLE_INTERVAL = 55; // ms per flicker

type Phase = 'idle' | 'rolling' | 'result';

export default function MuseWidget() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [display, setDisplay] = useState<[string, string]>(['???', '???']);
  const [result, setResult] = useState<{ pair: [string, string]; questionId: string } | null>(null);

  const appendJournal = useGameState(s => s.appendJournal);

  // Quick digital shuffle: flicker random words, then settle on the real roll.
  useEffect(() => {
    if (phase !== 'rolling') return;
    sfx.diceRoll();
    let tick = 0;
    const final = rollMusePair();
    const timer = setInterval(() => {
      tick += 1;
      if (tick >= SHUFFLE_TICKS) {
        clearInterval(timer);
        setDisplay(final);
        sfx.pip();
        appendJournal(`Wanderer's Muse: ${final[0]} + ${final[1]}`);
        setResult({ pair: final, questionId: `muse-${Date.now()}` });
        setPhase('result');
      } else {
        setDisplay(rollMusePair());
      }
    }, SHUFFLE_INTERVAL);
    return () => clearInterval(timer);
  }, [phase, appendJournal]);

  const roll = () => { setResult(null); setPhase('rolling'); };
  const close = () => { setPhase('idle'); setResult(null); };

  return (
    <>
      {/* Floating button — sits just above the Oracle FAB (which is at bottom-20). */}
      <button
        onClick={roll}
        disabled={phase === 'rolling'}
        aria-label="Consult the Wanderer's Muse"
        className="fixed bottom-[9.25rem] left-4 z-40 w-14 h-14 bg-black border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-400 hover:bg-amber-400 hover:text-black transition-colors shadow-[0_0_15px_#fbbf24] disabled:opacity-60"
      >
        <Sparkles size={26} />
      </button>

      {/* Shuffle + result share one centered modal. */}
      {(phase === 'rolling' || (phase === 'result' && result)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-black border-2 border-amber-400 w-full max-w-sm p-6 text-center shadow-[0_0_15px_#fbbf24]">
            <div className="opacity-80 text-sm mb-3 uppercase text-amber-400 tracking-widest">
              The Wanderer's Muse
            </div>

            {/* The two words (flickering while rolling, settled in result). */}
            <div className={`flex items-center justify-center gap-3 my-4 ${phase === 'rolling' ? 'opacity-60' : ''}`}>
              <span className="text-2xl font-bold uppercase text-amber-400 flex-1 break-words">{display[0]}</span>
              <span className="text-xl opacity-50">+</span>
              <span className="text-2xl font-bold uppercase text-amber-400 flex-1 break-words">{display[1]}</span>
            </div>

            {phase === 'rolling' && (
              <div className="text-xs opacity-60 uppercase tracking-wider animate-pulse">Consulting the wasteland…</div>
            )}

            {phase === 'result' && result && (
              <>
                <button
                  onClick={roll}
                  className="w-full flex items-center justify-center gap-2 border border-amber-400 text-amber-400 p-2 text-sm mb-4 hover:bg-amber-400 hover:text-black transition-colors uppercase"
                >
                  <RefreshCw size={14} /> Re-roll
                </button>

                <div className="mb-6 text-left">
                  <AnswerBox
                    id={result.questionId}
                    type="muse"
                    question={`The Muse offers "${result.pair[0]}" + "${result.pair[1]}". What do these spark for your story?`}
                    showQuestion
                    placeholder="Tap to record what these words mean here…"
                  />
                </div>

                <button
                  onClick={close}
                  className="w-full border-2 border-amber-400 text-amber-400 p-3 font-bold uppercase hover:bg-amber-400 hover:text-black transition-colors"
                >
                  Acknowledge
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
