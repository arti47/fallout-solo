import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../store/gameState';
import { useUIState } from '../store/uiState';

import Step1Vault from './creation/Step1Vault';
import Step2Special from './creation/Step2Special';
import Step3Skills from './creation/Step3Skills';
import Step4Vitals from './creation/Step4Vitals';
import Step5Equipment from './creation/Step5Equipment';
import Step6Description from './creation/Step6Description';
import Step7Quest from './creation/Step7Quest';

export default function CharacterCreation() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { vault, mainQuest, special, skills } = useGameState();
  const { showAlert } = useUIState();

  // Book invariants per stage (pg.61-69). "Next Step" used to be unconditional,
  // so a player could walk past Stage 3 with unspent ranks or the wrong number
  // of Tag skills and finish an illegal character.
  const stageProblem = (n: number): string | null => {
    if (n === 1 && !vault) return 'Generate your Vault before continuing (Stage 1).';
    if (n === 2) {
      const spent = Object.values(special).reduce((a, b) => a + b, 0);
      // Every Attribute starts at 4 (28 total) and creation distributes +12.
      if (spent < 40) return `You still have ${40 - spent} S.P.E.C.I.A.L. point(s) to spend.`;
      if (spent > 40) return 'You have spent too many S.P.E.C.I.A.L. points.';
    }
    if (n === 3) {
      const tags = skills.filter(k => k.isTag).length;
      if (tags !== 2) return `Choose exactly 2 Tag skills (you have ${tags}).`;
      if (!skills.some(k => k.rank > 0)) return 'Assign your skill ranks before continuing (Stage 3).';
    }
    return null;
  };

  const handleNext = () => {
    const problem = stageProblem(step);
    if (problem) { showAlert(problem); return; }
    setStep((s) => Math.min(7, s + 1));
  };
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = () => {
    // Basic validation
    if (!vault) {
      showAlert("Please generate a Vault in Step 1 first!");
      setStep(1);
      return;
    }
    // Re-check every earlier stage, so no illegal character can be finished by
    // skipping ahead.
    for (const n of [2, 3]) {
      const problem = stageProblem(n);
      if (problem) { showAlert(problem); setStep(n); return; }
    }
    if (!mainQuest) {
      showAlert("Please generate a Main Quest in Step 7!");
      return;
    }

    // Stage 5: +2 Supplies. Stage 6: the description answers open the Journal.
    useGameState.setState((state) => {
      const v = state.vault;
      const q = state.mainQuest;
      const lines = [
        '== VAULT-TEC OFFICIAL RECORD ==',
        `NAME: ${state.name || 'Unknown Dweller'}`,
        state.appearance ? `APPEARANCE: ${state.appearance}` : null,
        state.personality ? `PERSONALITY: ${state.personality}` : null,
        state.motivation ? `MOTIVATION: ${state.motivation}` : null,
        `VAULT: ${v?.number} — ${v?.experiment} (${v?.population})`,
        v?.region ? `REGION: ${v.region}` : null,
        v?.truths?.length ? `VAULT TRUTHS: ${v.truths.join(', ')}` : null,
        `VAULT REPUTATION: ${v?.reputation}`,
        v?.npcName ? `LINKED NPC: ${v.npcName}${v.npcDetails ? ` — ${v.npcDetails}` : ''}` : null,
        '',
        `MAIN QUEST: ${q?.goal}${q?.goalDesc ? ` — ${q.goalDesc}` : ''}`,
        `BLOCKER: ${q?.blocker}${q?.blockerLocation ? ` (Map Square ${q.blockerLocation})` : ' (location unknown)'}`,
        '',
        'Entry 1: Left the Vault today. The sun is too bright.',
        ''
      ].filter((l): l is string => l !== null);
      return {
        // Book rule (pg.69): creation grants exactly 2 Supplies.
        supplies: 2,
        journalText: lines.join('\n')
      };
    });
    
    // Straight into the game loop — the Round tab opens with a Round 1
    // briefing. Landing on a static stat sheet left new players with no
    // call to action.
    navigate('/round');
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto border-2 border-[#14FF00] p-4 bg-black">
      <h2 className="text-2xl mb-4 text-center uppercase tracking-wider border-b-2 border-[#14FF00] pb-2 font-bold">
        Vault-Tec Registration
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar uppercase">
        {step === 1 && <Step1Vault />}
        {step === 2 && <Step2Special onComplete={handleNext} />}
        {step === 3 && <Step3Skills onComplete={handleNext} />}
        {step === 4 && <Step4Vitals onComplete={handleNext} />}
        {step === 5 && <Step5Equipment onComplete={handleNext} />}
        {step === 6 && <Step6Description />}
        {step === 7 && <Step7Quest />}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-[#14FF00] flex justify-between uppercase font-bold">
        <button 
          onClick={handlePrev} 
          disabled={step === 1}
          className="px-6 py-3 border-2 border-[#14FF00] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#14FF00] hover:bg-[#14FF00] hover:text-black transition-colors"
        >
          Previous
        </button>

        {step < 7 ? (
          <button 
            onClick={handleNext}
            className="px-6 py-3 border-2 border-[#14FF00] hover:bg-[#14FF00] hover:text-black transition-colors"
          >
            Next Step
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="px-6 py-3 border-2 border-[#14FF00] bg-[#051a05] hover:bg-[#14FF00] hover:text-black transition-colors animate-pulse"
          >
            Enter Wasteland
          </button>
        )}
      </div>
    </div>
  );
}
