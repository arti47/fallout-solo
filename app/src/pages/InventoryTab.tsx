import { useGameState } from '../store/gameState';
import { useUIState } from '../store/uiState';
import { sfx } from '../utils/sound';

export default function InventoryTab() {
  const { special, caps, supplies, gear, equipGear, consumeItem, combatActive, ap, updateAp } = useGameState();
  const { showAlert } = useUIState();
  
  // Calculate Strict Weight System capacity
  const maxWeight = special.S * 10;
  const currentWeight = gear.reduce((total, item) => total + item.weight * item.quantity, 0);
  const isEncumbered = currentWeight > maxWeight;

  return (
    <div className="flex flex-col gap-6 uppercase h-full">
      <h2 className="text-2xl border-b border-[#14FF00] pb-2 font-bold tracking-widest text-center">
        INVENTORY
      </h2>

      {/* Currency & Consumables */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-[#14FF00] p-3 text-center">
          <div className="text-sm opacity-80">CAPS</div>
          <div className="text-2xl text-white mt-1">{caps}</div>
        </div>
        <div className="border border-[#14FF00] p-3 text-center">
          <div className="text-sm opacity-80">SUPPLIES</div>
          <div className="text-2xl text-white mt-1">{supplies}</div>
        </div>
      </div>

      {/* Weight Tracker */}
      <div className={`p-3 text-center border ${isEncumbered ? 'border-red-500 text-red-500' : 'border-[#14FF00]'}`}>
        <div className="text-sm">TOTAL WEIGHT</div>
        <div className="text-xl mt-1">
          {Number(currentWeight.toFixed(1))} / <span className="text-white">{maxWeight}</span>
        </div>
        {isEncumbered && <div className="text-xs mt-1 animate-pulse">OVERENCUMBERED: AP PENALTY APPLIED</div>}
      </div>

      {/* Gear List */}
      <div className="flex-1 flex flex-col">
        <h3 className="border-b border-[#14FF00] mb-2 font-bold opacity-80 flex justify-between">
          <span>GEAR</span>
          <span>WT / QTY</span>
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {gear.length === 0 ? (
            <div className="text-center opacity-50 italic mt-4">Inventory Empty</div>
          ) : (
            gear.map((item) => (
              <div key={item.id} className={`flex justify-between items-center border-b pb-1 p-1 transition-colors ${item.equipped ? 'border-[#14FF00] bg-[#14FF00]/10' : 'border-[#051a05] hover:bg-[#051a05]'}`}>
                <div>
                  <div className="text-white flex items-center gap-2">
                    {item.name} 
                    {item.equipped && <span className="text-xs bg-[#14FF00] text-black px-1 rounded">EQUIPPED</span>}
                  </div>
                  {item.description && <div className="text-xs opacity-70 normal-case">{item.description}</div>}
                  <div className="mt-2 flex gap-2">
                    {(item.type === 'Weapon' || item.type === 'Armor') && (
                      <button 
                        onClick={() => equipGear(item.id)}
                        className="text-xs border border-[#14FF00] px-2 py-0.5 hover:bg-[#14FF00] hover:text-black"
                      >
                        {item.equipped ? 'UNEQUIP' : 'EQUIP'}
                      </button>
                    )}
                    {item.type === 'Consumable' && (
                      <button 
                        onClick={() => {
                          if (combatActive) {
                            if (ap < 1) {
                              showAlert("Not enough AP to use items in combat!");
                              return;
                            }
                            updateAp(-1);
                          }
                          sfx.consume();
                          consumeItem(item.id);
                        }}
                        className="text-xs border border-[#14FF00] px-2 py-0.5 hover:bg-[#14FF00] hover:text-black"
                      >
                        USE
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div>
                    <span className="opacity-80 mr-2">{item.weight} w</span>
                    <span className="text-white">x{item.quantity}</span>
                  </div>
                  {item.effects && (
                    <div className="text-xs opacity-70">
                      {Object.entries(item.effects).map(([k, v]) => `${k.toUpperCase()}: ${v > 0 ? '+' : ''}${v}`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
