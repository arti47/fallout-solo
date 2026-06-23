// In-app Codex: the complete "Fallout: Wasteland Wanderer" rulebook text,
// bundled so the app is fully self-contained without the physical book.
import chapter1 from './codex/chapter1.md?raw';
import chapter2 from './codex/chapter2.md?raw';
import chapter3 from './codex/chapter3.md?raw';
import chapter4 from './codex/chapter4.md?raw';
import chapter5 from './codex/chapter5.md?raw';
import chapter6 from './codex/chapter6.md?raw';
import { buildAppendixMarkdown } from './codexAppendix';

// Chapter 7 is generated from the app's typed game data (always clean & in sync).
const chapter7 = buildAppendixMarkdown();

export interface CodexChapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  content: string;
}

export const CODEX_CHAPTERS: CodexChapter[] = [
  {
    id: 'introduction',
    number: 1,
    title: 'Introduction',
    summary: 'What Wasteland Wanderer is, what you need to play, and the Pip-Boy Sheets (Stats & Inventory, Data, and Map Tabs).',
    content: chapter1
  },
  {
    id: 'wasteland-of-america',
    number: 2,
    title: 'The Wasteland of America',
    summary: 'The world of Fallout: regions from the West Coast to Appalachia, the Factions and their plot hooks, and the themes of every Wasteland story.',
    content: chapter2
  },
  {
    id: 'character-creation',
    number: 3,
    title: 'Character Creation',
    summary: 'The seven stages of building a Vault Dweller: Vault, S.P.E.C.I.A.L., Skills, HP & Luck, Equipment, Description, and the Main Quest. Plus Advancement.',
    content: chapter3
  },
  {
    id: 'how-to-play',
    number: 4,
    title: 'How to Play',
    summary: 'The core 2d20 rules: Skill Tests, Criticals and Complications, Action Points, Truths, The Oracle, Luck, Health, Damage, Injuries, Death, and Combat.',
    content: chapter4
  },
  {
    id: 'telling-your-story',
    number: 5,
    title: 'Telling Your Story',
    summary: 'The Round loop: Travel, Encounter, Take Action, and Journal — with every Safe and Dangerous Action explained in detail.',
    content: chapter5
  },
  {
    id: 'quests',
    number: 6,
    title: 'Quests',
    summary: 'How Side Quests are generated: Reward, Goal, and Location.',
    content: chapter6
  },
  {
    id: 'appendices',
    number: 7,
    title: 'Appendices',
    summary: 'Perks, every Roll Table (locations, encounters, loot, NPCs, quests, injuries), and all Foe Stat Blocks.',
    content: chapter7
  }
];

/** Case-insensitive full-text search across all chapters. Returns matching
 *  chapters with a short excerpt around the first hit. */
export const searchCodex = (query: string): { chapter: CodexChapter; excerpt: string }[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { chapter: CodexChapter; excerpt: string }[] = [];
  for (const chapter of CODEX_CHAPTERS) {
    const idx = chapter.content.toLowerCase().indexOf(q);
    if (idx === -1) continue;
    const start = Math.max(0, idx - 80);
    const end = Math.min(chapter.content.length, idx + q.length + 160);
    const excerpt = `${start > 0 ? '…' : ''}${chapter.content.slice(start, end).replace(/\s+/g, ' ').trim()}${end < chapter.content.length ? '…' : ''}`;
    results.push({ chapter, excerpt });
  }
  return results;
};
