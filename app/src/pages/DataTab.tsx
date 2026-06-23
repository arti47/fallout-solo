import { useRef, useState } from 'react';
import { useGameState, getInitialGameData } from '../store/gameState';
import {
  Download, Upload, Trash2, UserPlus, MapPin, BookText, Volume2, VolumeX,
  GraduationCap, Sparkles
} from 'lucide-react';
import { downloadStory } from '../utils/storyExport';
import { generateFullNpc, generateDangerousNpc, rollDangerousNpcGroup, rollFaction } from '../data/npcTables';
import { generateSideQuest } from '../data/questTables';
import { generateFoeEncounter } from '../data/characterTables';
import { rollCombatStateEntry, rollWastelandTruth, rollSettlementTruth } from '../data/encounters';
import { rollScavenge, rollChem } from '../data/lootTables';
import { useUIState } from '../store/uiState';

export default function DataTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [genResult, setGenResult] = useState<string | null>(null);

  const { showAlert, showConfirm } = useUIState();
  const {
    soundEnabled, toggleSound, tutorialEnabled, toggleTutorial,
    npcs, sideQuests, mainQuest, currentSector, sectorData,
    addNpc, addSideQuest, addGear, updateSectorData, appendJournal, setSideQuestStatus
  } = useGameState();

  const handleExport = () => {
    const state = useGameState.getState();
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wasteland_save_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        useGameState.setState(importedState);
        showAlert('Save file imported successfully!');
      } catch {
        showAlert('Failed to parse save file. Ensure it is a valid JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleHardReset = () => {
    showConfirm("WARNING: This will permanently delete your character and all progress. Are you sure?", () => {
      showConfirm("FINAL WARNING: This cannot be undone. Proceed?", () => {
        // Reset the live store first so any write that races the reload
        // persists fresh defaults, then clear storage and reload.
        useGameState.setState(getInitialGameData());
        useGameState.persist.clearStorage();
        window.location.reload();
      });
    });
  };

  // ================= GENERATORS =================
  // Every result is persisted where it belongs AND journaled.
  const sector = sectorData[currentSector];

  const genNpc = () => {
    const npc = generateFullNpc();
    addNpc({
      name: npc.name,
      description: `${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction}) — ${npc.features.join('; ')} | Secret: ${npc.secret} | Truth: ${npc.truth}`,
      location: currentSector
    });
    const text = `NPC: ${npc.name} — ${npc.age} ${npc.demeanor} ${npc.profession} (${npc.faction})\nFeatures: ${npc.features.join('; ')}\nSecret: ${npc.secret}\nTruth: ${npc.truth}\n(+1 XP, saved to Known NPCs at Square ${currentSector})`;
    setGenResult(text);
    appendJournal(text);
  };

  const genDangerousNpc = () => {
    const d = generateDangerousNpc();
    addNpc({
      name: `⚠ ${d.name}`,
      description: `DANGEROUS (Threat ${d.threat}) — ${d.weapons} Special: ${d.ability.name} [${d.ability.faction}]: ${d.ability.description}`,
      location: currentSector
    });
    const text = `Dangerous NPC: ${d.name} (Threat ${d.threat})\nWeapons: ${d.weapons}\nSpecial: ${d.ability.name} [${d.ability.faction}] — ${d.ability.description}`;
    setGenResult(text);
    appendJournal(text);
  };

  const genNpcGroup = () => {
    const group = rollDangerousNpcGroup();
    const leader = generateDangerousNpc();
    const text = `Dangerous NPC Group: ${group.count} of them, currently ${group.activity.toLowerCase()}.\nUse one shared stat block — ${leader.name} (Threat ${leader.threat}), ${leader.weapons}\nSpecial: ${leader.ability.name} [${leader.ability.faction}]`;
    setGenResult(text);
    appendJournal(text);
  };

  const genFoes = () => {
    const foes = generateFoeEncounter();
    const text = `Foes (${foes.foeType}): ${foes.scenarios.join(' ')}\n(Fight them from Round → Encounter, or build the fight in the Combat tab.)`;
    setGenResult(text);
    appendJournal(text);
  };

  const genSideQuest = () => {
    const quest = generateSideQuest(currentSector);
    addSideQuest({
      goalType: quest.goalType, goal: quest.goal, questions: quest.questions,
      reward: quest.rewardName, rewardDesc: quest.rewardDescription,
      location: quest.location, status: 'Active'
    });
    const text = `Side Quest [${quest.goalType}]: ${quest.goal}\nReward — ${quest.rewardName}: ${quest.rewardDescription}\nLocation: Square ${quest.location} (marked ? on the map)\nPrompt: ${quest.questions}`;
    setGenResult(text);
    appendJournal(text);
  };

  const genCombatState = () => {
    const st = rollCombatStateEntry();
    const text = `Combat State — ${st.name}: ${st.description}`;
    setGenResult(text);
    appendJournal(text);
  };

  const genLoot = () => {
    const loot = rollScavenge();
    addGear(loot);
    const text = `Loot: ${loot.quantity}x ${loot.name}${loot.description ? ` — ${loot.description}` : ''} (added to Inventory)`;
    setGenResult(text);
    appendJournal(text);
  };

  const genChem = () => {
    const chem = rollChem();
    addGear(chem);
    const text = `Chem: ${chem.name} — ${chem.description} (added to Inventory)`;
    setGenResult(text);
    appendJournal(text);
  };

  const genFaction = () => {
    const faction = rollFaction();
    setGenResult(`Faction: ${faction}`);
    appendJournal(`Faction rolled: ${faction}`);
  };

  const genTruth = () => {
    const truth = sector?.isSettlement ? rollSettlementTruth() : rollWastelandTruth();
    updateSectorData(currentSector, { truths: [...(sector?.truths ?? []), truth] });
    const text = `New Truth for Square ${currentSector}: ${truth}`;
    setGenResult(text);
    appendJournal(text);
  };

  const GENERATORS: { label: string; run: () => void }[] = [
    { label: 'NPC (+1 XP)', run: genNpc },
    { label: 'Dangerous NPC', run: genDangerousNpc },
    { label: 'NPC Group', run: genNpcGroup },
    { label: 'Foes', run: genFoes },
    { label: 'Side Quest', run: genSideQuest },
    { label: 'Combat State', run: genCombatState },
    { label: 'Loot Roll', run: genLoot },
    { label: 'Chem', run: genChem },
    { label: 'Faction', run: genFaction },
    { label: 'Location Truth', run: genTruth }
  ];

  const activeQuests = sideQuests.filter(q => q.status === 'Active');
  const doneQuests = sideQuests.filter(q => q.status !== 'Active');

  return (
    <div className="flex flex-col gap-6 uppercase h-full overflow-y-auto custom-scrollbar p-2">
      <h2 className="text-2xl border-b border-[#14FF00] pb-2 font-bold tracking-widest text-center">
        DATA & LOGS
      </h2>

      <div className="flex flex-col gap-4">
        {/* ============ GENERATORS ============ */}
        <div className="border border-amber-400 p-3 flex flex-col gap-2">
          <h3 className="font-bold border-b border-amber-400 mb-1 text-amber-400 flex items-center gap-2">
            <Sparkles size={16} /> GENERATORS (saved & journaled)
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {GENERATORS.map(g => (
              <button
                key={g.label}
                onClick={g.run}
                className="border border-amber-400/60 text-amber-400 p-1.5 text-xs hover:bg-amber-400 hover:text-black transition-colors"
              >
                {g.label}
              </button>
            ))}
          </div>
          {genResult && (
            <pre className="text-xs whitespace-pre-wrap font-mono normal-case border border-amber-400/40 p-2 bg-amber-400/5 text-amber-100">{genResult}</pre>
          )}
        </div>

        {/* ============ QUESTS ============ */}
        <div className="border border-[#14FF00] p-3 flex flex-col">
          <h3 className="font-bold border-b border-[#14FF00] mb-2 opacity-80 flex justify-between items-center">
            <span>QUESTS</span>
            <button
              onClick={genSideQuest}
              className="text-xs border border-[#14FF00] px-2 py-1 hover:bg-[#14FF00] hover:text-black flex items-center gap-1"
            >
              <MapPin size={14} /> NEW SIDE QUEST
            </button>
          </h3>
          <div className="space-y-2">
            {mainQuest && (
              <div className="border-l-2 border-red-500 pl-2">
                <div className="text-white font-bold text-sm">MAIN: {mainQuest.goal}</div>
                <div className="text-xs opacity-80 normal-case">{mainQuest.goalDesc}</div>
                <div className="text-xs mt-1 text-red-400">
                  Blocker: {mainQuest.blocker}
                  {mainQuest.blockerLocation ? ` (Square ${mainQuest.blockerLocation})` : ' (location unknown)'}
                  {' '}• {mainQuest.status}
                </div>
              </div>
            )}
            {activeQuests.map((q, i) => (
              <div key={i} className="border-l-2 border-dashed border-[#14FF00] pl-2 flex justify-between gap-2">
                <div>
                  <div className="text-white font-bold text-sm">[{q.goalType}] <span className="normal-case">{q.goal}</span></div>
                  <div className="text-xs opacity-80">Sq.{q.location} • Reward: {q.reward}{q.giver ? ` • For ${q.giver}` : ''}</div>
                </div>
                <button
                  onClick={() => { setSideQuestStatus(sideQuests.indexOf(q), 'Abandoned'); }}
                  className="text-[10px] border border-red-500/50 text-red-400 px-1 self-start hover:bg-red-500 hover:text-black"
                >
                  DROP
                </button>
              </div>
            ))}
            {doneQuests.map((q, i) => (
              <div key={`d${i}`} className="border-l-2 border-[#14FF00]/30 pl-2 opacity-50">
                <div className="text-sm line-through normal-case">[{q.goalType}] {q.goal}</div>
                <div className="text-xs">{q.status}</div>
              </div>
            ))}
            {!mainQuest && sideQuests.length === 0 && (
              <div className="opacity-50 italic text-sm text-center">No quests yet.</div>
            )}
          </div>
        </div>

        {/* ============ NPCS ============ */}
        <div className="border border-[#14FF00] p-3 flex flex-col">
          <h3 className="font-bold border-b border-[#14FF00] mb-2 opacity-80 flex justify-between items-center">
            <span>KNOWN NPCs ({npcs.length})</span>
            <button
              onClick={genNpc}
              className="text-xs border border-[#14FF00] px-2 py-1 hover:bg-[#14FF00] hover:text-black flex items-center gap-1"
            >
              <UserPlus size={14} /> NEW NPC
            </button>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {npcs.length === 0 && (
              <div className="opacity-50 italic text-sm text-center">No NPCs met yet.</div>
            )}
            {npcs.map((npc, i) => (
              <div key={i} className="border-b border-[#14FF00]/20 pb-1">
                <div className="font-bold text-white text-sm">{npc.name} <span className="opacity-60 font-normal text-xs">(Sq.{npc.location})</span></div>
                <div className="text-xs opacity-80 normal-case">{npc.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ============ SAVE DATA ============ */}
        <div className="border border-[#14FF00] p-3 flex flex-col gap-3">
          <h3 className="font-bold border-b border-[#14FF00] mb-2 opacity-80">SYS.MGMT (SAVE DATA)</h3>

          <button
            onClick={handleExport}
            className="border border-[#14FF00] p-2 hover:bg-[#14FF00] hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} /> Export Save to File
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="border border-[#14FF00] p-2 hover:bg-[#14FF00] hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} /> Import Save from File
          </button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />

          <button
            onClick={() => { downloadStory(); }}
            className="border border-amber-400 text-amber-400 p-2 hover:bg-amber-400 hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <BookText size={18} /> Export Story (Markdown)
          </button>

          <div className="flex gap-2">
            <button
              onClick={toggleSound}
              className={`flex-1 border p-2 text-sm transition-colors flex items-center justify-center gap-2 ${soundEnabled ? 'border-[#14FF00]' : 'border-[#14FF00]/40 opacity-60'}`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound: {soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={toggleTutorial}
              className={`flex-1 border p-2 text-sm transition-colors flex items-center justify-center gap-2 ${tutorialEnabled ? 'border-[#14FF00]' : 'border-[#14FF00]/40 opacity-60'}`}
            >
              <GraduationCap size={16} /> Tutorial: {tutorialEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            onClick={handleHardReset}
            className="border border-red-500 text-red-500 p-2 hover:bg-red-500 hover:text-black transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Trash2 size={18} /> HARD RESET (WIPE DATA)
          </button>
        </div>
      </div>
    </div>
  );
}
