import { useGameState } from '../store/gameState';
import { sfx } from '../utils/sound';

export default function JournalTab() {
  const { journalText, setJournalText } = useGameState();

  return (
    <div className="flex flex-col gap-4 uppercase h-full">
      <h2 className="text-2xl border-b border-[#14FF00] pb-2 font-bold tracking-widest text-center">
        PERSONAL LOG
      </h2>

      <div className="flex-1 flex flex-col border border-[#14FF00] p-2 bg-[#051a05] bg-opacity-50">
        <div className="flex justify-between items-center border-b border-[#14FF00] pb-2 mb-2">
          <span className="opacity-80 text-sm">ROBCO TERMINAL OS V. 85.2</span>
          <button className="text-xs border border-[#14FF00] px-2 hover:bg-[#14FF00] hover:text-black">SAVE LOG</button>
        </div>
        
        <textarea 
          value={journalText}
          onChange={(e) => { sfx.type(); setJournalText(e.target.value); }}
          className="flex-1 bg-transparent text-[#14FF00] resize-none outline-none custom-scrollbar p-1"
          placeholder="Start typing your entry..."
          spellCheck="false"
        />
      </div>
    </div>
  );
}
