import { useState } from 'react';
import { useGameState } from '../store/gameState';
import { useUIState } from '../store/uiState';
import LevelUpModal from '../components/LevelUpModal';

export default function StatsTab() {
  const { name, level, xp, hp, maxHp, ap, maxAp, luck, maxLuck, rads, special, skills, updateHp, updateAp, updateLuck, supplies, updateSupplies, appendJournal, perks, injuries } = useGameState();
  const { showAlert } = useUIState();
  const [showLevelUp, setShowLevelUp] = useState(false);

  const handleMakeCamp = () => {
    if (supplies < 1) {
      showAlert("Not enough supplies to make camp!");
      return;
    }
    updateSupplies(-1);
    
    updateHp(maxHp); // Heal to max (which already accounts for rads)
    updateAp(maxAp); // Restore all AP
    
    appendJournal(`Made Camp. Consumed 1 supply. HP and AP fully restored.`);
    showAlert(`Made Camp! Restored HP and AP.`);
  };

  return (
    <div className="flex flex-col gap-6 uppercase">
      {/* Header Info */}
      <div className="grid grid-cols-2 border border-[#14FF00] p-3 gap-2">
        <div className="col-span-2">NAME: <span className="text-white">{name || 'UNKNOWN VAULT DWELLER'}</span></div>
        <div className="flex justify-between items-center pr-2">
          <span>LEVEL: <span className="text-white">{level}</span></span>
          <span className="opacity-50">XP: <span className="text-white">{xp}</span></span>
        </div>
        <div className="text-right">
          <button
            onClick={handleMakeCamp}
            className="border border-[#14FF00] px-3 py-1 hover:bg-[#14FF00] hover:text-black transition-colors font-bold text-xs"
          >
            MAKE CAMP (1 Supply)
          </button>
        </div>
        {xp >= 1 && (
          <div className="col-span-2">
            <button
              onClick={() => setShowLevelUp(true)}
              className="w-full border-2 border-amber-400 text-amber-400 p-2 font-bold hover:bg-amber-400 hover:text-black transition-colors animate-pulse"
            >
              ▲ LEVEL UP — {xp} XP ready (pick a Perk)
            </button>
          </div>
        )}
        {(perks.length > 0 || injuries.length > 0) && (
          <div className="col-span-2 text-xs space-y-1 border-t border-[#14FF00]/30 pt-2">
            {perks.length > 0 && (
              <div>PERKS: <span className="text-white normal-case">{perks.map(p => p.rank > 1 ? `${p.name} (R${p.rank})` : p.name).join(', ')}</span></div>
            )}
            {injuries.length > 0 && (
              <div className="text-red-400">INJURIES: <span className="normal-case">{injuries.join(' • ')}</span></div>
            )}
          </div>
        )}
      </div>

      {showLevelUp && <LevelUpModal onClose={() => setShowLevelUp(false)} />}

      {/* Vital Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="border border-[#14FF00] p-2">
          <div className="text-xs opacity-80">HP</div>
          <div className="text-xl flex justify-center items-center gap-1">
            <button onClick={() => updateHp(-1)} className="hover:bg-[#14FF00] hover:text-black px-1">-</button>
            <span className={`font-bold ${hp <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{hp}/{Math.max(1, maxHp - rads)}</span>
            <button onClick={() => updateHp(1)} className="hover:bg-[#14FF00] hover:text-black px-1">+</button>
          </div>
        </div>
        <div className="border border-[#14FF00] p-2">
          <div className="text-xs opacity-80">AP</div>
          <div className="text-xl flex justify-center items-center gap-1">
            <button onClick={() => updateAp(-1)} className="hover:bg-[#14FF00] hover:text-black px-1">-</button>
            <span className="text-white font-bold">{ap}/{maxAp}</span>
            <button onClick={() => updateAp(1)} className="hover:bg-[#14FF00] hover:text-black px-1">+</button>
          </div>
        </div>
        <div className="border border-amber-400 p-2 text-amber-400">
          <div className="text-xs opacity-80">RADS</div>
          <div className="text-xl flex justify-center items-center gap-1">
            <span className="font-bold text-amber-400">{rads}</span>
          </div>
        </div>
        <div className="border border-[#14FF00] p-2">
          <div className="text-xs opacity-80">LUCK</div>
          <div className="text-xl flex justify-center items-center gap-1">
            <button onClick={() => updateLuck(-1)} className="hover:bg-[#14FF00] hover:text-black px-1">-</button>
            <span className="text-white font-bold">{luck}/{maxLuck}</span>
            <button onClick={() => updateLuck(1)} className="hover:bg-[#14FF00] hover:text-black px-1">+</button>
          </div>
        </div>
      </div>

      {/* S.P.E.C.I.A.L. */}
      <div>
        <h3 className="border-b-2 border-[#14FF00] mb-2 font-bold tracking-widest text-lg">S.P.E.C.I.A.L.</h3>
        <div className="grid grid-cols-7 text-center gap-1">
          {Object.entries(special).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <div className="font-bold border-b border-[#14FF00] opacity-80">{key}</div>
              <div className="text-xl mt-1 text-white">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <h3 className="border-b-2 border-[#14FF00] mb-2 font-bold tracking-widest text-lg">SKILLS</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {skills.map((skill) => (
            <div key={skill.name} className="flex justify-between items-center">
              <span className={skill.isTag ? 'text-white' : 'opacity-80'}>
                {skill.isTag && '* '}{skill.name}
              </span>
              <span className="text-white">{skill.rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
