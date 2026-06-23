import { useState, useEffect } from 'react';
import { useGameState } from '../../store/gameState';
import type { Skill } from '../../store/gameState';
import { GOAT_TEMPLATES, rollD20 } from '../../data/creationTables';

type Mode = 'goat' | 'assign';

export default function Step3Skills({ onComplete }: { onComplete?: () => void }) {
  const { special, skills, setSkills } = useGameState();
  const [mode, setMode] = useState<Mode>('goat');
  const [localSkills, setLocalSkills] = useState<Skill[]>(skills);
  // Template ranks are free in the G.O.A.T. path; only ranks above the base
  // count against the bonus pool.
  const [baseRanks, setBaseRanks] = useState<Record<string, number>>({});
  const [goatResult, setGoatResult] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  const selectedTagsCount = localSkills.filter(s => s.isTag).length;

  // Book rules (pg.64-68):
  //  - G.O.A.T.: template ranks + additional ranks equal to INT.
  //  - Assign your own: 15 + INT ranks from zero.
  const pool = mode === 'goat' ? special.I : 15 + special.I;
  const spent = localSkills.reduce(
    (total, s) => total + Math.max(0, s.rank - (mode === 'goat' ? (baseRanks[s.name] ?? 0) : 0)),
    0
  );
  const pointsRemaining = pool - spent;

  const applyTemplate = (templateName: string) => {
    const template = GOAT_TEMPLATES.find(t => t.name === templateName);
    if (!template) return;
    setGoatResult(template.name);
    const bases: Record<string, number> = {};
    const newSkills = localSkills.map(skill => {
      const rank = (template.skills as Partial<Record<string, number>>)[skill.name] || 0;
      bases[skill.name] = rank;
      return { ...skill, rank };
    });
    setBaseRanks(bases);
    setLocalSkills(newSkills);
    setShowTemplates(false);
  };

  const handleRandomizeGOAT = () => {
    const roll = rollD20();
    const template = GOAT_TEMPLATES.find(t => t.roll === roll);
    if (template) applyTemplate(template.name);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setGoatResult('');
    setBaseRanks({});
    setLocalSkills(localSkills.map(s => ({ ...s, rank: 0 })));
  };

  const handleAdjustRank = (skillName: string, amount: number) => {
    const skillIndex = localSkills.findIndex(s => s.name === skillName);
    if (skillIndex === -1) return;

    const currentRank = localSkills[skillIndex].rank;
    const newRank = currentRank + amount;
    const minRank = mode === 'goat' ? (baseRanks[skillName] ?? 0) : 0;

    if (newRank < minRank || newRank > 5) return;
    if (amount > 0 && pointsRemaining <= 0) return;

    const updated = [...localSkills];
    updated[skillIndex] = { ...updated[skillIndex], rank: newRank };
    setLocalSkills(updated);
  };

  const handleToggleTag = (skillName: string) => {
    const skillIndex = localSkills.findIndex(s => s.name === skillName);
    if (skillIndex === -1) return;
    const isCurrentlyTagged = localSkills[skillIndex].isTag;
    if (!isCurrentlyTagged && selectedTagsCount >= 2) return;
    const updated = [...localSkills];
    updated[skillIndex] = { ...updated[skillIndex], isTag: !isCurrentlyTagged };
    setLocalSkills(updated);
  };

  useEffect(() => {
    setSkills(localSkills);
  }, [localSkills, setSkills]);

  // Auto-advance once all ranks are spent and both Tag skills are chosen.
  const stepDone = pointsRemaining === 0 && selectedTagsCount === 2 &&
    localSkills.some(s => s.rank > 0);
  useEffect(() => {
    if (stepDone && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [stepDone, onComplete]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-1">Stage 3: Skills</h3>

      {/* Path selection */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode('goat')}
          className={`flex-1 border-2 p-2 text-sm uppercase transition-colors ${mode === 'goat' ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00] hover:bg-[#14FF00]/20'}`}
        >
          Take the G.O.A.T.
        </button>
        <button
          onClick={() => switchMode('assign')}
          className={`flex-1 border-2 p-2 text-sm uppercase transition-colors ${mode === 'assign' ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold' : 'border-[#14FF00] hover:bg-[#14FF00]/20'}`}
        >
          Assign Your Own
        </button>
      </div>

      <p className="opacity-80 text-sm normal-case">
        {mode === 'goat'
          ? `Roll or pick a Career Template, then distribute ${special.I} bonus ranks (your INT). Template ranks are free.`
          : `Distribute ${15 + special.I} ranks (15 + your INT) however you like. Max 5 per skill.`}
        {' '}Then select exactly 2 Tag Skills.
      </p>

      {mode === 'goat' && (
        <div className="flex gap-2">
          <button
            onClick={handleRandomizeGOAT}
            className="flex-1 border-2 border-[#14FF00] p-2 text-center uppercase hover:bg-[#14FF00] hover:text-black transition-colors"
          >
            Roll the G.O.A.T.
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex-1 border-2 border-[#14FF00] p-2 text-center uppercase hover:bg-[#14FF00] hover:text-black transition-colors"
          >
            Pick Template…
          </button>
        </div>
      )}

      {showTemplates && (
        <div className="border border-[#14FF00] bg-[#051a05] max-h-48 overflow-y-auto custom-scrollbar">
          {GOAT_TEMPLATES.map(t => (
            <button
              key={t.name}
              onClick={() => applyTemplate(t.name)}
              className="block w-full text-left p-2 border-b border-[#14FF00]/20 hover:bg-[#14FF00]/10 text-sm"
            >
              <span className="font-bold text-white">{t.name}</span>
              <span className="opacity-60 text-xs ml-2 normal-case">
                {Object.entries(t.skills).map(([s, r]) => `${s} ${r}`).join(', ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {goatResult && (
        <div className="text-center font-bold text-lg text-white">
          G.O.A.T. Result: {goatResult}
        </div>
      )}

      <div className="flex justify-between items-center py-2 border-y border-[#14FF00]">
        <div className="font-bold text-sm">
          {mode === 'goat' ? 'BONUS ' : ''}PTS REMAINING: <span className={pointsRemaining === 0 ? 'text-white' : 'text-amber-400'}>{pointsRemaining}</span>
        </div>
        <div className="font-bold text-sm">
          TAGS: <span className={selectedTagsCount === 2 ? 'text-white' : 'text-amber-400'}>{selectedTagsCount}/2</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {localSkills.map((skill) => {
          const minRank = mode === 'goat' ? (baseRanks[skill.name] ?? 0) : 0;
          return (
            <div key={skill.name} className="flex flex-col border-b border-[#051a05] pb-1">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => handleToggleTag(skill.name)}
                  className={`w-4 h-4 border border-[#14FF00] flex items-center justify-center ${skill.isTag ? 'bg-[#14FF00] text-black' : ''}`}
                >
                  {skill.isTag ? '*' : ''}
                </button>
                <span className={`text-sm truncate ${skill.isTag ? 'font-bold text-white' : ''}`}>{skill.name}</span>
              </div>

              <div className="flex gap-2 items-center justify-between pl-6">
                <button
                  onClick={() => handleAdjustRank(skill.name, -1)}
                  disabled={skill.rank <= minRank}
                  className="w-6 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black disabled:opacity-30 flex justify-center items-center"
                >-</button>
                <span className="w-4 text-center text-white">{skill.rank}</span>
                <button
                  onClick={() => handleAdjustRank(skill.name, 1)}
                  disabled={skill.rank === 5 || pointsRemaining === 0}
                  className="w-6 border border-[#14FF00] hover:bg-[#14FF00] hover:text-black disabled:opacity-30 flex justify-center items-center"
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
