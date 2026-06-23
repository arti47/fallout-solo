import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../store/gameState';
import { useUIState } from '../store/uiState';
import { rollEncounter } from '../data/encounters';
import type { EncounterResult } from '../data/encounters';
import { rollScavenge } from '../data/lootTables';
import { getRandomFoe } from '../data/bestiary';
import { Map as MapIcon, Search, AlertTriangle, Skull } from 'lucide-react';

export default function MapTab() {
  const navigate = useNavigate();
  const {
    currentSector, sectorData, setCurrentSector, updateSectorData,
    supplies, updateSupplies, appendJournal, startCombat,
    updateHp, updateAp, updateRads, updateCaps, ap, addGear, mainQuest
  } = useGameState();
  const { showAlert } = useUIState();
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [encounterResult, setEncounterResult] = useState<EncounterResult | null>(null);

  // 5x5 grid = 25 squares
  const mapSquares = Array.from({ length: 25 }, (_, i) => i + 1);

  const vaultSquare = 13; // Center
  const impassableSquares = [3, 8, 21, 24];
  // Main Quest Blocker Location rolled during character creation (null = Unknown Location blocker).
  const questSquare = mainQuest?.blockerLocation ?? null;

  const handleTravel = () => {
    if (!selectedSquare || selectedSquare === currentSector) return;
    
    if (supplies < 1) {
      showAlert("Not enough Supplies to travel! You need at least 1.");
      return;
    }
    
    const isExplored = sectorData[selectedSquare]?.explored;
    
    updateSupplies(-1);
    setCurrentSector(selectedSquare);
    
    if (!isExplored) {
      const encounter = rollEncounter();
      setEncounterResult(encounter);
      updateSectorData(selectedSquare, { 
        explored: true, 
        scavengeAvailable: encounter.type === 'scavenge' 
      });
      appendJournal(`Traveled to unexplored Sector ${selectedSquare}. (-1 Supply)\nEncounter: ${encounter.description}`);
    } else {
      appendJournal(`Traveled to explored Sector ${selectedSquare}. (-1 Supply)`);
    }
  };

  const handleCloseEncounter = () => {
    if (!encounterResult) return;
    
    if (encounterResult.type === 'enemy') {
      const numFoes = Math.floor(Math.random() * 3) + 1;
      const foes = Array.from({ length: numFoes }).map(() => getRandomFoe());
      startCombat(foes);
      setEncounterResult(null);
      navigate('/combat');
      return;
    }
    
    if (encounterResult.type === 'hazard' && encounterResult.effect) {
      if (encounterResult.effect.hp) updateHp(encounterResult.effect.hp);
      if (encounterResult.effect.ap) updateAp(encounterResult.effect.ap);
      if (encounterResult.effect.rads) updateRads(encounterResult.effect.rads);
    }
    
    setEncounterResult(null);
  };

  const handleScavenge = () => {
    if (ap < 1) {
      showAlert("Not enough AP to scavenge! Wait or make camp.");
      return;
    }
    
    updateAp(-1);
    
    const loot = rollScavenge();
    if (loot.name === 'Caps Stash') {
      updateCaps(loot.quantity);
    } else if (loot.name === 'Supply Cache') {
      updateSupplies(loot.quantity);
    } else {
      addGear(loot);
    }
    
    updateSectorData(currentSector, { scavengeAvailable: false });
    appendJournal(`Scavenged Sector ${currentSector} (-1 AP). Found: ${loot.quantity}x ${loot.name}`);
    
    showAlert(`Scavenged: ${loot.quantity}x ${loot.name}\n${loot.description}`);
  };

  return (
    <div className="flex flex-col gap-4 uppercase h-full relative">
      <h2 className="text-2xl border-b border-[#14FF00] pb-2 font-bold tracking-widest text-center">
        REGION MAP
      </h2>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="grid grid-cols-5 gap-1 border-2 border-[#14FF00] p-1 bg-[#051a05]">
          {mapSquares.map((num) => {
            const isVault = num === vaultSquare;
            const isImpassable = impassableSquares.includes(num);
            const isQuest = num === questSquare;
            const isSelected = selectedSquare === num;
            const isCurrent = currentSector === num;
            const isExplored = sectorData[num]?.explored;
            const canScavenge = sectorData[num]?.scavengeAvailable;

            return (
              <button
                key={num}
                onClick={() => !isImpassable && setSelectedSquare(num)}
                disabled={isImpassable}
                className={`
                  w-12 h-12 flex items-center justify-center border text-xs transition-all relative
                  ${isImpassable ? 'border-[#14FF00] opacity-20 bg-black cursor-not-allowed' : 'border-[#14FF00] hover:bg-[#14FF00] hover:text-black cursor-pointer'}
                  ${isSelected ? 'bg-[#14FF00] text-black font-bold' : ''}
                  ${isCurrent && !isSelected ? 'bg-[#14FF00] text-black opacity-70' : ''}
                  ${!isExplored && !isImpassable ? 'opacity-50 border-dashed' : ''}
                `}
              >
                {isVault ? (
                  <span className="text-[10px] text-center leading-tight">VAULT<br/>13</span>
                ) : isImpassable ? (
                  'X'
                ) : (
                  num
                )}
                
                {isQuest && (
                  <div className={`absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse ${isSelected || isCurrent ? 'mix-blend-multiply' : ''}`} />
                )}
                {isCurrent && (
                  <div className="absolute bottom-0 w-full h-1 bg-[#14FF00]" />
                )}
                {canScavenge && !isSelected && (
                  <Search size={10} className="absolute bottom-1 right-1 opacity-70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Square Details Panel */}
      <div className="h-32 border-t border-[#14FF00] p-2 mt-auto">
        {selectedSquare ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center border-b border-[#14FF00] pb-1 mb-2">
              <span className="font-bold text-white">SECTOR {selectedSquare}</span>
              {selectedSquare !== currentSector ? (
                <button 
                  onClick={handleTravel}
                  className="text-xs border border-[#14FF00] px-2 py-1 hover:bg-[#14FF00] hover:text-black transition-colors flex items-center gap-1"
                >
                  TRAVEL <span className="opacity-70">(1 Supply)</span>
                </button>
              ) : (
                <span className="text-xs px-2 opacity-50 border border-transparent">CURRENT LOCATION</span>
              )}
            </div>
            
            <div className="text-xs opacity-80 flex-1 overflow-y-auto space-y-1">
              {selectedSquare === questSquare && (
                <div className="text-amber-400 font-bold">! ACTIVE QUEST: Clear out the Radroaches</div>
              )}
              {selectedSquare === vaultSquare && (
                <div className="text-white">HOME: Vault 13</div>
              )}
              <div>Status: {sectorData[selectedSquare]?.explored ? 'Explored' : 'Unexplored'}</div>
              {sectorData[selectedSquare]?.scavengeAvailable && (
                <div className="flex justify-between items-center bg-[#14FF00]/10 p-2 mt-2 border border-[#14FF00]">
                  <span className="text-[#14FF00] animate-pulse font-bold flex items-center gap-1">
                    <Search size={14} /> Scavenge Location
                  </span>
                  {selectedSquare === currentSector ? (
                    <button 
                      onClick={handleScavenge}
                      className="text-xs bg-[#14FF00] text-black px-3 py-1 font-bold hover:opacity-80 transition-opacity"
                    >
                      SCAVENGE (1 AP)
                    </button>
                  ) : (
                    <span className="text-xs opacity-50">Travel here to search</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-50 italic text-sm">
            Select a sector to view details
          </div>
        )}
      </div>

      {/* Encounter Modal */}
      {encounterResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-black border-2 border-[#14FF00] w-full max-w-sm p-6 text-center uppercase shadow-[0_0_20px_#14FF00]">
            <div className="flex justify-center mb-4">
              {encounterResult.type === 'enemy' && <Skull size={48} className="text-red-500 animate-pulse" />}
              {encounterResult.type === 'scavenge' && <Search size={48} className="text-[#14FF00]" />}
              {encounterResult.type === 'hazard' && <AlertTriangle size={48} className="text-amber-400" />}
              {encounterResult.type === 'empty' && <MapIcon size={48} className="text-white opacity-50" />}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              {encounterResult.type === 'empty' && 'Sector Clear'}
              {encounterResult.type === 'scavenge' && 'Location Found'}
              {encounterResult.type === 'enemy' && <span className="text-red-500">Hostiles Detected</span>}
              {encounterResult.type === 'hazard' && <span className="text-amber-400">Environmental Hazard</span>}
            </h2>
            
            <p className="mb-6 opacity-80 leading-relaxed normal-case">
              {encounterResult.description}
            </p>

            <button 
              onClick={handleCloseEncounter}
              className="w-full border-2 border-[#14FF00] p-3 font-bold hover:bg-[#14FF00] hover:text-black transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
