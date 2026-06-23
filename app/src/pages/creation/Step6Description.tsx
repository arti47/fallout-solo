import { useState, useEffect } from 'react';
import { useGameState } from '../../store/gameState';
import { Dices } from 'lucide-react';
import { 
  RANDOM_NAMES, 
  RANDOM_APPEARANCES, 
  RANDOM_PERSONALITIES, 
  RANDOM_MOTIVATIONS, 
  getRandomItem 
} from '../../data/creationTables';

export default function Step6Description() {
  const { name, setName, appearance: savedAppearance, personality: savedPersonality, motivation: savedMotivation, setDescription } = useGameState();
  const [localName, setLocalName] = useState(name);
  const [appearance, setAppearance] = useState(savedAppearance);
  const [personality, setPersonality] = useState(savedPersonality);
  const [motivation, setMotivation] = useState(savedMotivation);

  useEffect(() => {
    setName(localName);
  }, [localName, setName]);

  // Persist the description answers — they are written into the Journal on finish.
  useEffect(() => {
    setDescription(appearance, personality, motivation);
  }, [appearance, personality, motivation, setDescription]);

  const handleRandomizeAll = () => {
    setLocalName(getRandomItem(RANDOM_NAMES));
    setAppearance(getRandomItem(RANDOM_APPEARANCES));
    setPersonality(getRandomItem(RANDOM_PERSONALITIES));
    setMotivation(getRandomItem(RANDOM_MOTIVATIONS));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl border-b border-[#14FF00] pb-1">Stage 6: Description</h3>
      <p className="opacity-80">Finalize your character's identity before stepping into the Wasteland.</p>

      <button 
        onClick={handleRandomizeAll}
        className="w-full border-2 border-[#14FF00] p-2 text-center flex items-center justify-center gap-2 hover:bg-[#14FF00] hover:text-black transition-colors"
      >
        <Dices size={20} /> Randomize All
      </button>

      <div className="space-y-4 mt-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="opacity-80 font-bold">NAME</label>
            <button onClick={() => setLocalName(getRandomItem(RANDOM_NAMES))} className="hover:text-white transition-colors"><Dices size={16} /></button>
          </div>
          <input 
            type="text" 
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05] transition-colors"
            placeholder="e.g., Nicholas Rose"
            spellCheck="false"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="opacity-80 font-bold">APPEARANCE</label>
            <button onClick={() => setAppearance(getRandomItem(RANDOM_APPEARANCES))} className="hover:text-white transition-colors"><Dices size={16} /></button>
          </div>
          <input 
            type="text" 
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05] transition-colors"
            placeholder="e.g., Tall, muscular, scarred"
            spellCheck="false"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="opacity-80 font-bold">PERSONALITY</label>
            <button onClick={() => setPersonality(getRandomItem(RANDOM_PERSONALITIES))} className="hover:text-white transition-colors"><Dices size={16} /></button>
          </div>
          <input 
            type="text" 
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05] transition-colors"
            placeholder="e.g., Hot-tempered but honest"
            spellCheck="false"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="opacity-80 font-bold">MOTIVATION</label>
            <button onClick={() => setMotivation(getRandomItem(RANDOM_MOTIVATIONS))} className="hover:text-white transition-colors"><Dices size={16} /></button>
          </div>
          <input 
            type="text" 
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="w-full bg-transparent border border-[#14FF00] p-2 text-white outline-none focus:bg-[#051a05] transition-colors"
            placeholder="e.g., Duty, Curiosity"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
