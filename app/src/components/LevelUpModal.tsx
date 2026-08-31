import { useState } from 'react';
import { X, Wand2 } from 'lucide-react';
import { useGameState } from '../store/gameState';
import { PERKS, meetsPerkRequirements } from '../data/perks';
import { sfx } from '../utils/sound';
import type { Perk, Special as SpecialAbbrev } from '../data/perks';
import { perkOnTake, untaggedSkills } from '../utils/perkEffects';
import type { Special } from '../store/gameState';

interface Props {
  onClose: () => void;
}

/** Maps the store's one-letter SPECIAL keys to the perk data's abbreviations. */
const ATTR_MAP: Record<string, SpecialAbbrev> = {
  S: 'STR', P: 'PER', E: 'END', C: 'CHA', I: 'INT', A: 'AGI', L: 'LCK'
};

export default function LevelUpModal({ onClose }: Props) {
  const { xp, level, special, skills, perks, addPerk, raiseAttribute, addTagSkill, addSkillRank } = useGameState();
  const [filter, setFilter] = useState<'available' | 'all'>('available');
  // A perk whose pay-off still needs the player to pick something.
  const [pending, setPending] = useState<{ name: string; choose: 'attribute' | 'tagSkill' | 'skillRanks' } | null>(null);
  const [ranksLeft, setRanksLeft] = useState(0);

  const take = (perk: Perk) => {
    sfx.levelUp();
    addPerk(perk.name);
    const onTake = perkOnTake(perk.name);
    if (onTake) {
      setPending({ name: perk.name, choose: onTake.choose });
      setRanksLeft(onTake.ranks ?? 1);
    }
  };

  /** Picks a sensible Perk and resolves its pay-off, so a player who does not
   *  want to read forty Perk descriptions can still Level Up. */
  const chooseForMe = () => {
    const options = PERKS.filter(canTake);
    if (options.length === 0) return;
    const perk = options[Math.floor(Math.random() * options.length)];
    sfx.levelUp();
    addPerk(perk.name);
    const onTake = perkOnTake(perk.name);
    if (!onTake) { onClose(); return; }
    // Resolve the choice the same way a thoughtful player would.
    if (onTake.choose === 'attribute') {
      const best = (Object.keys(special) as (keyof Special)[])
        .filter(k => special[k] < 10)
        .sort((a, b) => special[b] - special[a])[0];
      if (best) raiseAttribute(best);
    } else if (onTake.choose === 'tagSkill') {
      const best = untaggedSkills(skills).sort((a, b) => b.rank - a.rank)[0];
      if (best) addTagSkill(best.name);
    } else if (onTake.choose === 'skillRanks') {
      const targets = [...skills].filter(k => k.rank < 6).sort((a, b) => b.rank - a.rank);
      for (let i = 0; i < (onTake.ranks ?? 1); i++) {
        const t = targets[i % Math.max(1, targets.length)];
        if (t) addSkillRank(t.name, 1);
      }
    }
    onClose();
  };

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
      <div className="relative bg-black border-2 border-[#14FF00] w-full max-w-lg p-4 uppercase max-h-[85vh] flex flex-col">
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

        <button
          onClick={chooseForMe}
          disabled={xp < 1 || visiblePerks.filter(canTake).length === 0}
          className="w-full border-2 border-amber-400 text-amber-400 p-3 mb-3 font-bold uppercase text-sm hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
        >
          <Wand2 size={16} /> Choose a Perk for me
        </button>

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
                    onClick={() => take(perk)}
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

        {/* ---- Perk pay-offs that need a choice (pg.150-157) ---- */}
        {pending && (
          <div className="absolute inset-0 z-10 bg-black/95 flex items-center justify-center p-4">
            <div className="border-2 border-amber-400 bg-black w-full max-w-sm p-4 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h3 className="font-bold text-amber-400">{pending.name}</h3>

              {pending.choose === 'attribute' && (
                <>
                  <p className="text-xs normal-case opacity-80">Raise one S.P.E.C.I.A.L. by 1 (max 10).</p>
                  <div className="grid grid-cols-4 gap-1">
                    {(Object.keys(special) as (keyof Special)[]).map(k => (
                      <button
                        key={k}
                        disabled={special[k] >= 10}
                        onClick={() => { raiseAttribute(k); setPending(null); }}
                        className="border border-amber-400 p-2 text-sm hover:bg-amber-400 hover:text-black disabled:opacity-30"
                      >
                        {k} {special[k]}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {pending.choose === 'tagSkill' && (
                <>
                  <p className="text-xs normal-case opacity-80">Choose an additional Tag skill.</p>
                  <div className="grid grid-cols-2 gap-1">
                    {untaggedSkills(skills).map(sk => (
                      <button
                        key={sk.name}
                        onClick={() => { addTagSkill(sk.name); setPending(null); }}
                        className="border border-amber-400 p-1.5 text-xs text-left hover:bg-amber-400 hover:text-black"
                      >
                        {sk.name} ({sk.rank})
                      </button>
                    ))}
                  </div>
                </>
              )}

              {pending.choose === 'skillRanks' && (
                <>
                  <p className="text-xs normal-case opacity-80">
                    Spend {ranksLeft} rank{ranksLeft === 1 ? '' : 's'} — two Skills at +1, or one Skill at +2. No Skill may exceed 6.
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {skills.map(sk => (
                      <button
                        key={sk.name}
                        disabled={sk.rank >= 6}
                        onClick={() => {
                          addSkillRank(sk.name, 1);
                          const left = ranksLeft - 1;
                          setRanksLeft(left);
                          if (left <= 0) setPending(null);
                        }}
                        className="border border-amber-400 p-1.5 text-xs text-left hover:bg-amber-400 hover:text-black disabled:opacity-30"
                      >
                        {sk.name} ({sk.rank})
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
