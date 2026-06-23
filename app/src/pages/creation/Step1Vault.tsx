import { useState } from 'react';
import { Dices } from 'lucide-react';
import { useGameState } from '../../store/gameState';
import {
  VAULT_EXPERIMENTS,
  VAULT_POPULATIONS,
  VAULT_REPUTATIONS,
  rollVaultNpc,
  getRandomValue,
  rollD20
} from '../../data/creationTables';
import { KNOWN_VAULTS } from '../../data/characterTables';

const REGIONS = [
  'New California (West Coast)',
  'Mojave Wasteland',
  'Capital Wasteland',
  'The Commonwealth',
  'Appalachia',
  'The Island',
  'Unknown'
];

export default function Step1Vault() {
  const { vault, setVault } = useGameState();
  const [showKnownVaults, setShowKnownVaults] = useState(false);

  // Book order (pg.51-58): Experiment → Population → Reputation → Linked NPC
  // (4 rolls) → Vault Number and Region.
  const randomizeVault = () => {
    const experiment = VAULT_EXPERIMENTS.find(e => e.roll === rollD20());
    const popRoll = rollD20();
    const population = VAULT_POPULATIONS.find(p => popRoll >= p.min && popRoll <= p.max);

    // Sole survivor (1-4) skips Step 3: Reputation.
    const soleSurvivor = popRoll <= 4;
    const repRoll = rollD20();
    const reputation = soleSurvivor
      ? undefined
      : VAULT_REPUTATIONS.find(r => repRoll >= r.min && repRoll <= r.max);

    const npc = rollVaultNpc();

    setVault({
      number: getRandomValue(122),
      experiment: experiment?.name || 'Unknown',
      population: population?.name || 'Unknown',
      reputation: soleSurvivor ? 'N/A (Sole Survivor)' : (reputation?.name || 'Unknown'),
      npcName: npc.name,
      npcDetails: `${npc.appearance}, ${npc.personality} ${npc.position}`,
      truths: [...(experiment?.truths ?? []), ...(population?.truths ?? [])],
      region: REGIONS[Math.floor(Math.random() * (REGIONS.length - 1))]
    });
  };

  const applyKnownVault = (vaultNumber: number) => {
    const known = KNOWN_VAULTS.find(v => v.number === vaultNumber);
    if (!known) return;
    const npc = vault ? { npcName: vault.npcName, npcDetails: vault.npcDetails } : (() => {
      const n = rollVaultNpc();
      return { npcName: n.name, npcDetails: `${n.appearance}, ${n.personality} ${n.position}` };
    })();
    setVault({
      number: known.number,
      experiment: vault?.experiment || known.truths[0],
      population: vault?.population || 'Unknown',
      reputation: vault?.reputation || 'Unknown',
      ...npc,
      truths: known.truths,
      region: known.region
    });
    setShowKnownVaults(false);
  };

  const setRegion = (region: string) => {
    if (!vault) return;
    setVault({ ...vault, region });
  };

  const rerollNpc = () => {
    if (!vault) return;
    const npc = rollVaultNpc();
    setVault({ ...vault, npcName: npc.name, npcDetails: `${npc.appearance}, ${npc.personality} ${npc.position}` });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-2 font-bold">Stage 1: Create Your Vault</h3>
      <p className="opacity-80 normal-case">
        Six steps per the book: Experiment, Population, Reputation, a Linked NPC (4 rolls),
        then Vault Number and Region. Sole survivors (Population 1-4) skip Reputation.
      </p>

      <div className="flex gap-2">
        <button
          onClick={randomizeVault}
          className="flex-1 border-2 border-[#14FF00] p-3 text-lg text-center font-bold hover:bg-[#14FF00] hover:text-black transition-colors"
        >
          Roll Vault (All Steps)
        </button>
        <button
          onClick={() => setShowKnownVaults(!showKnownVaults)}
          className="flex-1 border-2 border-[#14FF00] p-3 text-center hover:bg-[#14FF00] hover:text-black transition-colors"
        >
          Known Vaults…
        </button>
      </div>

      {showKnownVaults && (
        <div className="border border-[#14FF00] bg-[#051a05] max-h-64 overflow-y-auto custom-scrollbar">
          {KNOWN_VAULTS.map(v => (
            <button
              key={v.number}
              onClick={() => applyKnownVault(v.number)}
              className="block w-full text-left p-2 border-b border-[#14FF00]/20 hover:bg-[#14FF00]/10"
            >
              <span className="font-bold text-white">Vault {v.number}</span>
              <span className="opacity-70 text-xs ml-2">{v.truths.join(' / ')} — {v.region}</span>
            </button>
          ))}
        </div>
      )}

      {vault && (
        <div className="mt-4 border border-[#14FF00] p-4 bg-[#051a05] space-y-3">
          <div className="flex flex-col mb-3">
            <span className="opacity-70 text-sm">Step 5 — Vault Number:</span>
            <span className="font-bold text-white text-2xl mt-1">Vault {vault.number}</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-70 text-sm">Step 1 — Experiment:</span>
            <span className="font-bold text-white text-lg mt-1">{vault.experiment}</span>
            <span className="text-xs opacity-70 normal-case">
              {VAULT_EXPERIMENTS.find(e => e.name === vault.experiment)?.desc}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-70 text-sm">Step 2 — Population:</span>
            <span className="font-bold text-white text-lg mt-1">{vault.population}</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-70 text-sm">Step 3 — Your Reputation:</span>
            <span className="font-bold text-white text-lg mt-1">{vault.reputation}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="opacity-70 text-sm">Step 4 — Linked NPC (4 rolls):</span>
              <button onClick={rerollNpc} className="hover:text-white transition-colors"><Dices size={16} /></button>
            </div>
            <span className="font-bold text-white text-lg mt-1">{vault.npcName}</span>
            {vault.npcDetails && <span className="text-xs opacity-70">{vault.npcDetails}</span>}
          </div>
          {vault.truths && vault.truths.length > 0 && (
            <div className="flex flex-col">
              <span className="opacity-70 text-sm">Vault Truths:</span>
              <span className="text-white text-sm mt-1">{vault.truths.join(' • ')}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="opacity-70 text-sm">Step 5 — Region:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`text-xs border px-2 py-1 transition-colors ${
                    vault.region === r
                      ? 'bg-[#14FF00] text-black border-[#14FF00] font-bold'
                      : 'border-[#14FF00]/50 hover:border-[#14FF00]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
