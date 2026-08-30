import { useState } from 'react';
import { useGameState, getInitialGameData } from '../store/gameState';
import { useUIState } from '../store/uiState';
import AnswerBox from './AnswerBox';
import { downloadStory } from '../utils/storyExport';
import { Download, Skull, Trophy, Home, ScrollText } from 'lucide-react';

// The Epilogue (pg.142). Every adventure ends one of three ways — the Main
// Quest completed, death by Injuries, or simply deciding to settle down — and
// the book asks for one final journal entry covering the last moments of your
// character's adventure.
//
// The app used to *tell* the player to write an Epilogue with nowhere to write
// it, and then (on death) delete the character and the whole journal. This is
// the missing flow: guided prompts → export → an explicit, separate wipe.

export type EpilogueKind = 'quest' | 'death' | 'settle';

const KIND_META: Record<EpilogueKind, { title: string; icon: typeof Trophy; accent: string; opening: string }> = {
  quest: {
    title: 'The Quest Is Done',
    icon: Trophy,
    accent: 'text-amber-400 border-amber-400',
    opening: 'You set out to do a thing, and you did it. How did it actually end — and was it what you imagined when you left the Vault?'
  },
  death: {
    title: 'This Is It',
    icon: Skull,
    accent: 'text-red-500 border-red-500',
    opening: 'Write the last moments. Where were you, what was the final thing that happened, and did you see it coming?'
  },
  settle: {
    title: 'You Settle Down',
    icon: Home,
    accent: 'text-[#14FF00] border-[#14FF00]',
    opening: 'You stop wandering. Where did you choose, and what finally made it worth staying?'
  }
};

/** The book's Epilogue is open-ended; these four prompts are the scaffold. */
const PROMPTS = (kind: EpilogueKind) => [
  KIND_META[kind].opening,
  'What did the road cost you? Name the losses — people, pieces of yourself, things you cannot take back.',
  'What outlives you? Who or what in the Wasteland is different because you passed through it?',
  'The last thing your Dweller would want recorded. Say it in their voice.'
];

interface EpilogueModalProps {
  kind: EpilogueKind;
  /** Close without ending the campaign (the character survives in the save). */
  onClose: () => void;
}

export default function EpilogueModal({ kind, onClose }: EpilogueModalProps) {
  const { name, round, level, appendJournal, journalEntries } = useGameState();
  const { showConfirm } = useUIState();
  const [exported, setExported] = useState(false);

  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const prompts = PROMPTS(kind);
  const written = prompts.filter((_, i) => journalEntries.some(e => e.id === `epilogue-${i}` && e.answer.trim())).length;

  const handleExport = () => {
    downloadStory();
    setExported(true);
    appendJournal('Story exported.');
  };

  const handleNewDweller = () => {
    const warn = exported
      ? 'Start a new Dweller? This permanently erases the current character and their journal.'
      : 'You have NOT exported this story yet — starting a new Dweller erases it permanently, with no way back. Export first?\n\nContinue anyway?';
    showConfirm(warn, () => {
      useGameState.setState(getInitialGameData());
      useGameState.persist.clearStorage();
      window.location.reload();
    });
  };

  return (
    <div className="fixed inset-0 z-[65] bg-black/95 overflow-y-auto custom-scrollbar">
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div className={`w-full max-w-lg border-2 bg-black p-5 space-y-5 ${meta.accent}`}>
          {/* Header */}
          <div className="text-center space-y-2">
            <Icon size={40} className={`mx-auto ${meta.accent.split(' ')[0]}`} />
            <h2 className={`text-2xl font-bold uppercase tracking-widest ${meta.accent.split(' ')[0]}`}>{meta.title}</h2>
            <p className="text-xs uppercase opacity-60">
              {name || 'Unknown Dweller'} • Level {level} • {round - 1} round{round - 1 === 1 ? '' : 's'} survived
            </p>
          </div>

          <p className="text-sm normal-case opacity-80 border-y border-current/30 py-3">
            One last entry. Answer as many of these as you want — none of them are required, and none of
            them are wrong. Take your time; this is the part you will re-read.
          </p>

          {/* The four prompts */}
          <div className="space-y-4">
            {prompts.map((q, i) => (
              <div key={i}>
                <div className="text-xs font-bold uppercase opacity-50 mb-1">Part {i + 1} of 4</div>
                <AnswerBox
                  id={`epilogue-${i}`}
                  type="epilogue"
                  question={q}
                  showQuestion
                  placeholder="Tap to write…"
                />
              </div>
            ))}
          </div>

          {/* Export — always before any wipe */}
          <div className="border-2 border-[#14FF00] p-3 space-y-2">
            <div className="text-xs normal-case opacity-80">
              Your story exports as a single Markdown file: character, vault, quests, everyone you met,
              the map you explored, and every word you wrote — including this Epilogue.
            </div>
            <button
              onClick={handleExport}
              className="w-full border-2 border-[#14FF00] text-[#14FF00] p-3 font-bold uppercase text-sm hover:bg-[#14FF00] hover:text-black transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} /> {exported ? 'Export again' : 'Export my story'}
            </button>
            {exported && (
              <div className="text-xs normal-case text-[#14FF00] text-center">
                Saved. Keep that file somewhere safe.
              </div>
            )}
          </div>

          {/* Exits */}
          <div className="space-y-2">
            <button
              onClick={onClose}
              className="w-full border border-[#14FF00] p-3 uppercase text-sm hover:bg-[#14FF00] hover:text-black transition-colors flex items-center justify-center gap-2"
            >
              <ScrollText size={16} />
              {written > 0 ? 'Save and close' : 'Close'}
            </button>
            <button
              onClick={handleNewDweller}
              className="w-full border-2 border-red-500 text-red-500 p-3 font-bold uppercase text-sm hover:bg-red-500 hover:text-black transition-colors"
            >
              Begin a new Dweller (erases this one)
            </button>
            <p className="text-[11px] normal-case opacity-50 text-center">
              Closing keeps everything. Your character stays in the save until you choose to erase them,
              so you can come back and add to the Epilogue later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
