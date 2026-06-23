import { useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { CODEX_CHAPTERS, searchCodex } from '../data/codex';
import type { CodexChapter } from '../data/codex';

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'table'; header: string[]; rows: string[][] }
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; text: string };

/** Strips markdown emphasis for plain rendering. */
const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim();

/** Parses a chapter into structured blocks: headings, tables, lists, and
 *  paragraphs (consecutive lines merged so OCR line-wrapping reads cleanly). */
const parseChapter = (content: string): Block[] => {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let table: string[][] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ').replace(/\s+/g, ' ').trim() });
      paragraph = [];
    }
  };
  const flushTable = () => {
    if (table.length) {
      const [header, ...rows] = table;
      blocks.push({ kind: 'table', header, rows });
      table = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: 'list', items: list });
      list = [];
    }
  };
  const flushAll = () => { flushParagraph(); flushTable(); flushList(); };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === '---') { flushAll(); continue; }

    if (line.startsWith('#')) {
      flushAll();
      const level = (line.match(/^#+/) ?? ['#'])[0].length;
      blocks.push({ kind: 'heading', level, text: plain(line.replace(/^#+\s*/, '')) });
      continue;
    }
    if (line.startsWith('|')) {
      flushParagraph(); flushList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      // Skip separator rows (| --- | --- |)
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
      table.push(cells);
      continue;
    }
    if (/^(\*|-|■|•)\s+/.test(line)) {
      flushParagraph(); flushTable();
      list.push(plain(line.replace(/^(\*|-|■|•)\s+/, '')));
      continue;
    }
    flushTable(); flushList();
    paragraph.push(line);
  }
  flushAll();
  return blocks;
};

/** Renders a chapter as styled Pip-Boy text with real tables. */
function ChapterContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseChapter(content), [content]);
  return (
    <div className="space-y-3 text-sm leading-relaxed normal-case">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'heading':
            if (block.level <= 2) return <h2 key={i} className="text-lg font-bold uppercase tracking-wider border-b border-[#14FF00]/50 mt-5 pb-1">{block.text}</h2>;
            if (block.level === 3) return <h3 key={i} className="text-base font-bold uppercase mt-4 text-white">{block.text}</h3>;
            return <h4 key={i} className="font-bold mt-3 text-white">{block.text}</h4>;
          case 'table':
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {block.header.map((h, j) => (
                        <th key={j} className="border border-[#14FF00]/50 bg-[#14FF00]/10 p-1.5 text-left uppercase font-bold">{plain(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className={r % 2 === 0 ? '' : 'bg-[#14FF00]/5'}>
                        {row.map((cell, c) => (
                          <td key={c} className="border border-[#14FF00]/30 p-1.5 align-top">{plain(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'list':
            return (
              <ul key={i} className="space-y-1 pl-1">
                {block.items.map((item, j) => <li key={j}>• {item}</li>)}
              </ul>
            );
          case 'paragraph':
            return <p key={i} className="opacity-90">{plain(block.text)}</p>;
        }
      })}
    </div>
  );
}

export default function CodexTab() {
  const [activeChapter, setActiveChapter] = useState<CodexChapter | null>(null);
  const [query, setQuery] = useState('');

  const results = useMemo(() => (query.trim().length >= 2 ? searchCodex(query) : []), [query]);

  if (activeChapter) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setActiveChapter(null)}
          className="flex items-center gap-1 border border-[#14FF00] px-3 py-1 uppercase text-sm hover:bg-[#14FF00] hover:text-black transition-colors"
        >
          <ChevronLeft size={16} /> Codex Index
        </button>
        <h2 className="text-xl uppercase tracking-widest border-b-2 border-[#14FF00] pb-1">
          Ch.{activeChapter.number}: {activeChapter.title}
        </h2>
        <ChapterContent content={activeChapter.content} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl uppercase tracking-widest border-b-2 border-[#14FF00] pb-1">
        Codex — Wasteland Wanderer Rulebook
      </h2>

      {/* Search */}
      <div className="flex items-center gap-2 border border-[#14FF00] px-3 py-2">
        <Search size={16} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="SEARCH THE RULEBOOK…"
          className="bg-transparent outline-none flex-1 uppercase placeholder:text-[#14FF00]/40"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="space-y-2">
          <div className="text-sm opacity-70 uppercase">{results.length} chapter(s) match</div>
          {results.map(({ chapter, excerpt }) => (
            <button
              key={chapter.id}
              onClick={() => setActiveChapter(chapter)}
              className="block w-full text-left border border-[#14FF00]/60 p-3 hover:bg-[#14FF00]/10 transition-colors"
            >
              <div className="font-bold uppercase">Ch.{chapter.number}: {chapter.title}</div>
              <div className="text-xs opacity-70 mt-1">{excerpt}</div>
            </button>
          ))}
        </div>
      )}

      {/* Chapter index */}
      <div className="space-y-2">
        {CODEX_CHAPTERS.map(chapter => (
          <button
            key={chapter.id}
            onClick={() => setActiveChapter(chapter)}
            className="block w-full text-left border-2 border-[#14FF00] p-4 hover:bg-[#14FF00] hover:text-black transition-colors group"
          >
            <div className="font-bold uppercase tracking-wider">Chapter {chapter.number}: {chapter.title}</div>
            <div className="text-xs opacity-70 group-hover:opacity-90 mt-1">{chapter.summary}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
