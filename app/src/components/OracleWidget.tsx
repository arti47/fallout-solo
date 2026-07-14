import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import DiceRoller from './dice/DiceRoller';
import AnswerBox from './AnswerBox';
import { useGameState } from '../store/gameState';
import { sfx } from '../utils/sound';

// The Oracle (pg.93):
//  - Likely:   1d20 — No on 1-5, Yes on 6-20.
//  - 50/50:    2d20, note the LOWEST — No on 1-10, Yes on 11-20.
//  - Unlikely: 2d20, note the HIGHEST — No on 1-15, Yes on 16-20.
type Probability = { name: 'Likely' | '50/50' | 'Unlikely'; dice: number };

const PROBABILITIES: Probability[] = [
  { name: 'Likely', dice: 1 },
  { name: '50/50', dice: 2 },
  { name: 'Unlikely', dice: 2 }
];

const decide = (name: Probability['name'], rolls: number[]): { isYes: boolean; deciding: number } => {
  switch (name) {
    case 'Likely': {
      const r = rolls[0];
      return { isYes: r >= 6, deciding: r };
    }
    case '50/50': {
      const r = Math.min(...rolls);
      return { isYes: r >= 11, deciding: r };
    }
    case 'Unlikely': {
      const r = Math.max(...rolls);
      return { isYes: r >= 16, deciding: r };
    }
  }
};

export default function OracleWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [activeProbability, setActiveProbability] = useState<Probability | null>(null);
  const [result, setResult] = useState<{
    isYes: boolean;
    rolls: number[];
    deciding: number;
    probability: Probability;
    cheated: boolean;
    questionId: string;
  } | null>(null);

  const { appendJournal, luck, updateLuck } = useGameState();

  const handleRollComplete = (rolls: number[]) => {
    setIsRolling(false);
    if (!activeProbability) return;
    const { isYes, deciding } = decide(activeProbability.name, rolls);
    if (isYes) sfx.success(); else sfx.failure();
    appendJournal(`Oracle (${activeProbability.name}): rolled ${rolls.join(', ')} → ${isYes ? 'YES' : 'NO'}`);
    setResult({ isYes, rolls, deciding, probability: activeProbability, cheated: false, questionId: `oracle-${Date.now()}` });
    setActiveProbability(null);
  };

  // Cheat the Oracle (pg.94): spend 1 Luck Point to re-roll one die, once per question.
  const cheatTheOracle = () => {
    if (!result || result.cheated || luck < 1) return;
    updateLuck(-1);
    const rolls = [...result.rolls];
    // Re-roll the die that decided the answer.
    const decidingIndex = rolls.indexOf(result.deciding);
    rolls[decidingIndex] = Math.floor(Math.random() * 20) + 1;
    const { isYes, deciding } = decide(result.probability.name, rolls);
    appendJournal(`Cheated the Oracle (1 LP): re-rolled → ${rolls.join(', ')} → ${isYes ? 'YES' : 'NO'}`);
    setResult({ ...result, isYes, rolls, deciding, cheated: true });
  };

  const initiateRoll = (prob: Probability) => {
    setActiveProbability(prob);
    setIsRolling(true);
    setIsOpen(false);
  };

  const handleClose = () => {
    setResult(null);
  };

  return (
    <>
      <div className="fixed bottom-20 left-4 z-40 flex flex-col-reverse items-start gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-black border-2 border-[#14FF00] rounded-full flex items-center justify-center text-[#14FF00] hover:bg-[#14FF00] hover:text-black transition-colors shadow-[0_0_15px_#14FF00]"
        >
          {isOpen ? <X size={28} /> : <HelpCircle size={28} />}
        </button>

        {isOpen && (
          <div className="bg-black border-2 border-[#14FF00] p-3 flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_15px_#14FF00]">
            <div className="text-center font-bold text-sm opacity-80 border-b border-[#14FF00] pb-1 uppercase">Ask Oracle</div>
            {PROBABILITIES.map(prob => (
              <button
                key={prob.name}
                onClick={() => initiateRoll(prob)}
                className="px-4 py-2 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black transition-colors uppercase text-sm font-bold"
              >
                {prob.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-black border-2 border-[#14FF00] w-full max-w-sm p-6 text-center uppercase shadow-[0_0_15px_#14FF00]">
            <div className="opacity-80 text-sm mb-2">ORACLE SAYS</div>
            <h2 className={`text-4xl font-bold mb-1 ${result.isYes ? 'text-[#14FF00]' : 'text-red-500'}`}>
              {result.isYes ? 'YES' : 'NO'}
            </h2>

            <div className="mt-4 mb-2 opacity-80 border-t border-[#051a05] pt-4 text-sm">
              {result.probability.name}: rolled {result.rolls.join(' & ')}
              {result.rolls.length > 1 && ` → counts ${result.deciding}`}
            </div>

            {!result.cheated && luck >= 1 && (
              <button
                onClick={cheatTheOracle}
                className="w-full border border-amber-400 text-amber-400 p-2 text-sm mb-4 hover:bg-amber-400 hover:text-black transition-colors"
              >
                Cheat the Oracle (1 LP): re-roll the deciding die
              </button>
            )}

            <div className="mb-6 text-left">
              <AnswerBox
                id={result.questionId}
                type="oracle"
                question={`Oracle (${result.probability.name}) → ${result.isYes ? 'YES' : 'NO'}. What did you ask, and what does this answer mean for your story?`}
                showQuestion
                placeholder="Tap to record your question and what the answer means…"
              />
            </div>

            <button
              onClick={handleClose}
              className="w-full border-2 border-[#14FF00] p-3 font-bold hover:bg-[#14FF00] hover:text-black transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {isRolling && activeProbability && (
        <DiceRoller numDice={activeProbability.dice} onComplete={handleRollComplete} />
      )}
    </>
  );
}
