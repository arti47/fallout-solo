import { useState } from 'react';
import { useGameState } from '../store/gameState';
import type { Special } from '../store/gameState';
import { useUIState } from '../store/uiState';
import DiceRoller from './dice/DiceRoller';
import { Dices } from 'lucide-react';
import { sfx } from '../utils/sound';

export default function SkillTestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    results: number[];
    successes: number;
    difficulty: number;
    complications: number;
  } | null>(null);
  const [journalNote, setJournalNote] = useState("");

  const { special, skills, ap, updateAp, appendJournal } = useGameState();
  const { showAlert } = useUIState();

  const [selectedAttr, setSelectedAttr] = useState<keyof Special>('S');
  const [selectedSkill, setSelectedSkill] = useState<string>('Athletics');
  const [difficulty, setDifficulty] = useState<number>(1);
  const [extraDice, setExtraDice] = useState<number>(0);

  const skillObj = skills.find(s => s.name === selectedSkill) || skills[0];
  const targetNumber = special[selectedAttr] + (skillObj?.rank || 0);
  const criticalThreshold = skillObj?.isTag ? (skillObj.rank || 1) : 1;
  const totalDice = 2 + extraDice;

  const handleRollComplete = (results: number[]) => {
    setIsRolling(false);

    let successes = 0;
    let complications = 0;

    results.forEach(r => {
      if (r <= criticalThreshold) {
        successes += 2; // Critical success grants 2 successes
      } else if (r <= targetNumber) {
        successes += 1; // Standard success
      } else if (r === 20) {
        complications += 1; // Complication
      }
    });

    const isTestPassed = successes >= difficulty;
    if (isTestPassed) sfx.success(); else sfx.failure();

    appendJournal(`Skill Test: ${selectedSkill} (TN ${targetNumber})\nRolled: ${results.join(', ')}\nResult: ${isTestPassed ? 'PASSED' : 'FAILED'} (${successes}/${difficulty} successes, ${complications} complications)`);
    
    setTestResult({
      passed: isTestPassed,
      results,
      successes,
      difficulty,
      complications
    });
    
    // Reset modal inputs
    setExtraDice(0);
    setDifficulty(1);
    setJournalNote("");
  };

  const handleInitiate = () => {
    if (extraDice > 0) {
      if (ap < extraDice) {
        showAlert("Not enough AP!");
        return;
      }
      updateAp(-extraDice);
    }
    setIsRolling(true);
  };

  const handleClose = () => {
    if (journalNote.trim()) {
      appendJournal(`> ${journalNote.trim()}`);
    }
    setTestResult(null);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-black border-2 border-[#14FF00] rounded-full flex items-center justify-center text-[#14FF00] hover:bg-[#14FF00] hover:text-black transition-colors z-40 shadow-[0_0_15px_#14FF00]"
      >
        <Dices size={28} />
      </button>

      {isOpen && !isRolling && !testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-black border-2 border-[#14FF00] w-full max-w-sm p-4 uppercase">
            <h2 className="text-xl font-bold border-b-2 border-[#14FF00] pb-2 mb-4 text-center">Skill Test</h2>

            <div className="space-y-4">
              <div className="text-xs text-center text-[#14FF00] opacity-80 mb-2 border border-[#14FF00]/30 p-2 bg-[#14FF00]/10">
                Rule: Pick an Attribute + a Skill. Their sum forms your Target Number (TN). Roll equal to or under the TN to get a success!
              </div>
              
              <div>
                <label className="block text-sm opacity-80 mb-1">Attribute</label>
                <select 
                  value={selectedAttr} 
                  onChange={(e) => setSelectedAttr(e.target.value as keyof Special)}
                  className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05]"
                >
                  {Object.entries(special).map(([k, v]) => {
                    const fullNames: Record<string, string> = {
                      S: 'Strength', P: 'Perception', E: 'Endurance', 
                      C: 'Charisma', I: 'Intelligence', A: 'Agility', L: 'Luck'
                    };
                    return (
                      <option key={k} value={k} className="bg-black">
                        {fullNames[k]} ({v})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm opacity-80 mb-1">Skill</label>
                <select 
                  value={selectedSkill} 
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05]"
                >
                  {skills.map(s => (
                    <option key={s.name} value={s.name} className="bg-black">
                      {s.isTag ? '* ' : ''}{s.name} ({s.rank})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center my-4">
                <div className="border border-[#14FF00] p-2 bg-[#051a05]">
                  <div className="text-xs opacity-80">TARGET (TN)</div>
                  <div className="text-2xl font-bold">{targetNumber}</div>
                </div>
                <div className="border border-[#14FF00] p-2 bg-[#051a05]">
                  <div className="text-xs opacity-80">CRIT RANGE</div>
                  <div className="text-2xl font-bold">1{criticalThreshold > 1 ? `-${criticalThreshold}` : ''}</div>
                </div>
              </div>

              <div className="flex justify-between items-center border border-[#14FF00] p-2">
                <span className="opacity-80">DIFFICULTY</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDifficulty(Math.max(0, difficulty - 1))} className="w-8 h-8 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black">-</button>
                  <span className="w-4 text-center">{difficulty}</span>
                  <button onClick={() => setDifficulty(difficulty + 1)} className="w-8 h-8 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black">+</button>
                </div>
              </div>

              <div className="flex justify-between items-center border border-[#14FF00] p-2">
                <span className="opacity-80">BUY DICE (1 AP/EA)</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setExtraDice(Math.max(0, extraDice - 1))} className="w-8 h-8 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black">-</button>
                  <span className="w-4 text-center">{extraDice}</span>
                  <button onClick={() => setExtraDice(Math.min(3, extraDice + 1))} className="w-8 h-8 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black">+</button>
                </div>
              </div>

              <div className="text-center font-bold">ROLLING {totalDice}d20</div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 border-2 border-[#14FF00] p-3 hover:bg-[#14FF00] hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleInitiate}
                  className="flex-1 border-2 border-[#14FF00] p-3 bg-[#051a05] hover:bg-[#14FF00] hover:text-black transition-colors animate-pulse"
                >
                  Initiate
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {isOpen && !isRolling && testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-black border-2 border-[#14FF00] w-full max-w-sm p-6 text-center uppercase">
            <h2 className={`text-3xl font-bold mb-4 ${testResult.passed ? 'text-[#14FF00]' : 'text-red-500'}`}>
              TEST {testResult.passed ? 'PASSED' : 'FAILED'}
            </h2>
            
            <div className="space-y-3 mb-4 text-lg">
              <div className="flex justify-between border-b border-[#051a05] pb-1">
                <span className="opacity-80">Results</span>
                <span className="font-bold text-white">{testResult.results.join(', ')}</span>
              </div>
              <div className="flex justify-between border-b border-[#051a05] pb-1">
                <span className="opacity-80">Successes</span>
                <span className={`font-bold ${testResult.successes >= testResult.difficulty ? 'text-[#14FF00]' : 'text-amber-400'}`}>
                  {testResult.successes} / {testResult.difficulty}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#051a05] pb-1">
                <span className="opacity-80">Complications</span>
                <span className={`font-bold ${testResult.complications > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {testResult.complications}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <input 
                type="text" 
                value={journalNote} 
                onChange={(e) => setJournalNote(e.target.value)} 
                placeholder="Add optional journal note..." 
                className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05]"
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

      {isRolling && (
        <DiceRoller numDice={totalDice} onComplete={handleRollComplete} />
      )}
    </>
  );
}
