import { useMemo, useState } from 'react';
import { useGameState } from '../store/gameState';
import type { JournalEntryType } from '../store/gameState';
import AnswerBox from '../components/AnswerBox';
import { sfx } from '../utils/sound';

const TYPE_META: Record<JournalEntryType, { label: string; text: string; border: string }> = {
  main: { label: 'MAIN', text: 'text-red-400', border: 'border-red-400' },
  side: { label: 'SIDE', text: 'text-amber-400', border: 'border-amber-400' },
  encounter: { label: 'ENCOUNTER', text: 'text-[#14FF00]', border: 'border-[#14FF00]' },
  oracle: { label: 'ORACLE', text: 'text-cyan-400', border: 'border-cyan-400' },
};

type Filter = 'all' | JournalEntryType;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'main', label: 'Main' },
  { key: 'side', label: 'Side' },
  { key: 'encounter', label: 'Encounter' },
  { key: 'oracle', label: 'Oracle' },
];

export default function JournalTab() {
  const { journalText, setJournalText, journalEntries } = useGameState();
  const [filter, setFilter] = useState<Filter>('all');

  // Newest first; apply the active type filter.
  const entries = useMemo(() => {
    const list = filter === 'all' ? journalEntries : journalEntries.filter(e => e.type === filter);
    return [...list].sort((a, b) => b.createdTs - a.createdTs);
  }, [journalEntries, filter]);

  return (
    <div className="flex flex-col gap-4 uppercase">
      <h2 className="text-2xl border-b border-[#14FF00] pb-2 font-bold tracking-widest text-center">
        PERSONAL LOG
      </h2>

      {/* ===== STORY LOG: answered prompts, chronological + filter ===== */}
      <div className="flex flex-col gap-2">
        <div className="text-sm opacity-80">STORY LOG — {journalEntries.length} ENTR{journalEntries.length === 1 ? 'Y' : 'IES'}</div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-2 py-1 border uppercase tracking-wider transition-colors ${
                filter === f.key
                  ? 'bg-[#14FF00] text-black border-[#14FF00]'
                  : 'border-[#14FF00]/50 text-[#14FF00] hover:bg-[#14FF00]/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {entries.length === 0 ? (
          <div className="border border-[#14FF00]/30 p-4 text-center opacity-50 italic text-sm normal-case">
            No entries yet. Answer a quest, encounter, or Oracle prompt and it lands here.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map(entry => {
              const meta = TYPE_META[entry.type];
              return (
                <div key={entry.id} className={`border-l-2 ${meta.border} pl-2`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase border px-1.5 py-0.5 ${meta.text} ${meta.border}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] uppercase opacity-50">Day {entry.day} • Rd {entry.round}</span>
                  </div>
                  <AnswerBox id={entry.id} type={entry.type} question={entry.question} showQuestion />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== FREE-FORM TERMINAL LOG ===== */}
      <div className="flex flex-col border border-[#14FF00] p-2 bg-[#051a05] bg-opacity-50">
        <div className="flex justify-between items-center border-b border-[#14FF00] pb-2 mb-2">
          <span className="opacity-80 text-sm">ROBCO TERMINAL OS V. 85.2</span>
          <span className="text-xs opacity-50">FREE LOG</span>
        </div>
        <textarea
          value={journalText}
          onChange={(e) => { sfx.type(); setJournalText(e.target.value); }}
          className="h-64 bg-transparent text-[#14FF00] resize-none outline-none custom-scrollbar p-1 normal-case"
          placeholder="Start typing your entry..."
          spellCheck="false"
        />
      </div>
    </div>
  );
}
