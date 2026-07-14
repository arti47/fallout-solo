import { useEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useGameState } from '../store/gameState';
import type { JournalEntryType } from '../store/gameState';
import { sfx } from '../utils/sound';

/** Visual identity per journal category (tag label + text/border colors). */
const TYPE_META: Record<JournalEntryType, { label: string; text: string; border: string }> = {
  main: { label: 'MAIN QUEST', text: 'text-red-400', border: 'border-red-400' },
  side: { label: 'SIDE QUEST', text: 'text-amber-400', border: 'border-amber-400' },
  encounter: { label: 'ENCOUNTER', text: 'text-[#14FF00]', border: 'border-[#14FF00]' },
  oracle: { label: 'ORACLE', text: 'text-cyan-400', border: 'border-cyan-400' },
  muse: { label: 'MUSE', text: 'text-amber-400', border: 'border-amber-400' },
};

interface AnswerBoxProps {
  /** Stable key so re-opening the same prompt edits the same entry. */
  id: string;
  type: JournalEntryType;
  question: string;
  placeholder?: string;
  /** Render the question text above the box (for screens where it isn't shown otherwise). */
  showQuestion?: boolean;
  /** Small Day/Round caption shown above the box (used in the Journal timeline). */
  stamp?: string;
}

/** A tappable answer field that expands into a full-screen focused editor.
 *  Reads/writes a structured journal entry in the store by stable `id`. */
export default function AnswerBox({ id, type, question, placeholder = 'Tap to write your answer…', showQuestion = false, stamp }: AnswerBoxProps) {
  const answer = useGameState(s => s.journalEntries.find(e => e.id === id)?.answer ?? '');
  const upsert = useGameState(s => s.upsertJournalEntry);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(answer);
  const ref = useRef<HTMLTextAreaElement>(null);
  const meta = TYPE_META[type];

  const openEditor = () => { setDraft(answer); setOpen(true); };
  const save = () => { upsert({ id, type, question, answer: draft }); setOpen(false); };

  // Lock body scroll and focus the editor while the overlay is open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => ref.current?.focus(), 60);
    return () => { document.body.style.overflow = ''; clearTimeout(t); };
  }, [open]);

  return (
    <div className="normal-case">
      {(showQuestion || stamp) && (
        <div className="flex items-center justify-between gap-2 mb-1">
          {showQuestion
            ? <div className={`text-xs font-bold ${meta.text}`}>{question}</div>
            : <span />}
          {stamp && <span className="text-[10px] uppercase opacity-50 shrink-0">{stamp}</span>}
        </div>
      )}
      <button
        onClick={openEditor}
        className="w-full text-left border border-[#14FF00]/50 bg-[#051a05] p-2 min-h-[3rem] flex justify-between gap-2 hover:border-[#14FF00] transition-colors"
      >
        <span className={`text-sm flex-1 whitespace-pre-line break-words ${answer ? 'text-white' : 'text-[#14FF00]/40 italic'}`}>
          {answer || placeholder}
        </span>
        <Maximize2 size={14} className="shrink-0 opacity-50 mt-0.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4">
          <div className="flex items-center justify-between border-b border-[#14FF00] pb-2 mb-3">
            <span className={`text-xs font-bold uppercase border px-2 py-0.5 ${meta.text} ${meta.border}`}>{meta.label}</span>
            <button onClick={() => setOpen(false)} className="text-[#14FF00] hover:text-white"><X size={24} /></button>
          </div>
          <div className="text-sm text-amber-400 mb-3">{question}</div>
          <textarea
            ref={ref}
            value={draft}
            onChange={e => { sfx.type(); setDraft(e.target.value); }}
            placeholder="Write freely…"
            spellCheck="false"
            className="flex-1 w-full bg-[#051a05] border border-[#14FF00] p-3 text-white text-base outline-none resize-none custom-scrollbar placeholder:text-[#14FF00]/30"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setOpen(false)} className="flex-1 border border-[#14FF00]/60 p-3 uppercase text-sm hover:bg-[#14FF00]/10">Cancel</button>
            <button onClick={save} className="flex-1 border-2 border-[#14FF00] p-3 font-bold uppercase text-sm hover:bg-[#14FF00] hover:text-black">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
