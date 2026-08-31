import { HelpCircle, ChevronDown } from 'lucide-react';
import { useGameState } from '../store/gameState';
import { SCREEN_HINTS } from '../data/screenHints';

/** Persistent "what do I do here" signpost for a screen or Round stage.
 *
 *  Unlike the one-shot TutorialOverlay this never disappears on its own: it
 *  collapses to a single line (remembered per screen) and can be turned off
 *  entirely in Data → SYS.MGMT. */
export default function ScreenHint({ id }: { id: string }) {
  const hintsEnabled = useGameState(s => s.hintsEnabled);
  // Collapsed unless the player opens it: the Director already says what to do,
  // so these are reference, not instruction.
  const collapsed = !useGameState(s => s.expandedHints).includes(id);
  const toggleHintExpanded = useGameState(s => s.toggleHintExpanded);

  const hint = SCREEN_HINTS[id];
  if (!hintsEnabled || !hint) return null;

  return (
    <div className="border border-[#14FF00]/40 bg-[#051a05]">
      <button
        onClick={() => toggleHintExpanded(id)}
        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-[#14FF00]/10"
      >
        <HelpCircle size={14} className="shrink-0 mt-0.5 opacity-70" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">
            What to do here
          </span>
          <span className="block text-xs normal-case text-white">{hint.summary}</span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 mt-0.5 opacity-60 transition-transform ${collapsed ? '-rotate-90' : ''}`}
        />
      </button>

      {!collapsed && (
        <div className="px-3 pb-2.5 pt-0.5 border-t border-[#14FF00]/25 space-y-1">
          {hint.steps.map((s, i) => (
            <div key={i} className="text-[11px] normal-case flex gap-1.5">
              <span className="opacity-50 shrink-0">{i + 1}.</span>
              <span className="opacity-90">{s}</span>
            </div>
          ))}
          {hint.tip && (
            <div className="text-[11px] normal-case text-amber-400 pt-1 flex gap-1.5">
              <span className="shrink-0">▸</span>
              <span>{hint.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
