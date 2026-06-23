import { useState } from 'react';
import { X } from 'lucide-react';
import { useGameState } from '../store/gameState';
import { PERKS, meetsPerkRequirements } from '../data/perks';
import { sfx } from '../utils/sound';
import type { Perk, Special as SpecialAbbrev } from '../data/perks';

interface Props {
  onClose: () => void;
}

/** Maps the store's one-letter SPECIAL keys to the perk data's abbreviations. */
const ATTR_MAP: Record<string, SpecialAbbrev> = {
  S: 'STR', P: 'PER', E: 'END', C: 'CHA', I: 'INT', A: 'AGI', L: 'LCK'
};

export default function LevelUpModal({ onClose }: Props) {
  const { xp, level, special, perks, addPerk } = useGameState();
  const [filter, setFilter] = useState<'available' | 'all'>('available');

  const attributes: Partial<Record<SpecialAbbrev, number>> = {};
  Object.entries(special).forEach(([k, v]) => { attributes[ATTR_MAP[k]] = v; });

  const currentRank = (perk: Perk) => perks.find(p => p.name === perk.name)?.rank ?? 0;

  const canTake = (perk: Perk) =>
    xp >= 1 &&
    currentRank(perk) < perk.ranks &&
    meetsPerkRequirements(perk, attributes, level);

  const requirementText = (perk: Perk) => {
    const parts: string[] = [];
    if (perk.requirements.attribute) {
      parts.push(Object.entries(perk.requirements.attribute).map(([a, v]) => `${a} ${v}`).join(', '));
    }
    if (perk.requirements.level) parts.push(`Level ${perk.requirements.level}+`);
    return parts.length ? parts.join(' • ') : 'None';
  };

  const visiblePerks = filter === 'available' ? PERKS.filter(canTake) : PERKS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-black border-2 border-[#14FF00] w-full max-w-lg p-4 uppercase max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center border-b-2 border-[#14FF00] pb-2 mb-3">
          <h2 className="text-xl font-bold">Level Up — Choose a Perk</h2>
          <button onClick={onClose} className="hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex justify-between items-center mb-3 text-sm">
          <span>XP: <span className="text-white font-bold">{xp}</span> (1 XP = 1 Perk = +1 Level)</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('available')}
              className={`border px-2 py-1 text-xs ${filter === 'available' ? 'bg-[#14FF00] text-black border-[#14FF00]' : 'border-[#14FF00]/50'}`}
            >Available</button>
            <button
              onClick={() => setFilter('all')}
              className={`border px-2 py-1 text-xs ${filter === 'all' ? 'bg-[#14FF00] text-black border-[#14FF00]' : 'border-[#14FF00]/50'}`}
            >All</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {visiblePerks.length === 0 && (
            <div className="italic text-amber-400 normal-case p-3">
              {xp < 1 ? 'No XP to spend. Complete quests and meet new NPCs to earn XP.' : 'No perks available — raise your attributes or level.'}
            </div>
          )}
          {visiblePerks.map(perk => {
            const rank = currentRank(perk);
            const available = canTake(perk);
            return (
              <div key={perk.name} className={`border p-3 ${available ? 'border-[#14FF00]' : 'border-[#14FF00]/30 opacity-60'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-bold text-white">{perk.name}</span>
                    {rank > 0 && <span className="text-xs ml-2">(Rank {rank}{perk.ranks !== Infinity ? `/${perk.ranks}` : ''})</span>}
                    <div className="text-xs opacity-70">Req: {requirementText(perk)}{perk.ranks !== 1 ? ` • Ranks: ${perk.ranks === Infinity ? 'Unlimited' : perk.ranks}` : ''}</div>
                  </div>
                  <button
                    onClick={() => { sfx.levelUp(); addPerk(perk.name); }}
                    disabled={!available}
                    className="border border-[#14FF00] px-3 py-1 text-sm hover:bg-[#14FF00] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#14FF00] shrink-0"
                  >
                    Take
                  </button>
                </div>
                <p className="text-xs opacity-80 normal-case mt-2">
                  {(perk.rankDescriptions ?? [perk.description]).join(' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
