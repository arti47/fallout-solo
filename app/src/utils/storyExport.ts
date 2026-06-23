// Story Export — compiles the character, world, and journal into a shareable
// Markdown document.
import { useGameState } from '../store/gameState';

const SPECIAL_NAMES: Record<string, string> = {
  S: 'Strength', P: 'Perception', E: 'Endurance', C: 'Charisma',
  I: 'Intelligence', A: 'Agility', L: 'Luck'
};

export const buildStoryMarkdown = (): string => {
  const s = useGameState.getState();
  const lines: string[] = [];

  lines.push(`# ${s.name || 'Unknown Vault Dweller'} — A Wasteland Story`);
  lines.push('');
  lines.push(`*Fallout: Wasteland Wanderer — ${s.round - 1} round${s.round - 1 === 1 ? '' : 's'} survived, Level ${s.level}*`);
  lines.push('');

  // ---- Character ----
  lines.push('## The Dweller');
  if (s.appearance) lines.push(`**Appearance:** ${s.appearance}  `);
  if (s.personality) lines.push(`**Personality:** ${s.personality}  `);
  if (s.motivation) lines.push(`**Motivation:** ${s.motivation}  `);
  lines.push('');
  lines.push(`| S.P.E.C.I.A.L. | Value |`);
  lines.push(`| --- | --- |`);
  Object.entries(s.special).forEach(([k, v]) => lines.push(`| ${SPECIAL_NAMES[k]} | ${v} |`));
  lines.push('');
  const ranked = s.skills.filter(sk => sk.rank > 0);
  if (ranked.length) {
    lines.push(`**Skills:** ${ranked.map(sk => `${sk.isTag ? '★' : ''}${sk.name} ${sk.rank}`).join(', ')}`);
    lines.push('');
  }
  if (s.perks.length) {
    lines.push(`**Perks:** ${s.perks.map(p => p.rank > 1 ? `${p.name} (Rank ${p.rank})` : p.name).join(', ')}`);
    lines.push('');
  }
  if (s.injuries.length) {
    lines.push(`**Injuries carried:** ${s.injuries.join('; ')}`);
    lines.push('');
  }
  lines.push(`**Final state:** ${s.hp}/${Math.max(1, s.maxHp - s.rads)} HP, ${s.caps} Stacks of Caps, ${s.supplies} Supplies${s.rads > 0 ? `, ${s.rads} Rads` : ''}`);
  lines.push('');

  // ---- Origin ----
  if (s.vault) {
    lines.push('## The Vault');
    lines.push(`**Vault ${s.vault.number}** — ${s.vault.region ?? 'Unknown region'}`);
    lines.push(`- Experiment: ${s.vault.experiment}`);
    lines.push(`- Population: ${s.vault.population}`);
    lines.push(`- Reputation back home: ${s.vault.reputation}`);
    if (s.vault.npcName) lines.push(`- Left behind: ${s.vault.npcName}${s.vault.npcDetails ? ` (${s.vault.npcDetails})` : ''}`);
    if (s.vault.truths?.length) lines.push(`- Truths: ${s.vault.truths.join(', ')}`);
    lines.push('');
  }

  // ---- Quests ----
  if (s.mainQuest) {
    lines.push('## The Main Quest');
    lines.push(`**${s.mainQuest.goal}** — ${s.mainQuest.goalDesc ?? ''}`);
    lines.push(`- Blocker: ${s.mainQuest.blocker}`);
    lines.push(`- Status: ${s.mainQuest.status}`);
    lines.push('');
  }
  const finishedQuests = s.sideQuests.filter(q => q.status !== 'Active');
  const openQuests = s.sideQuests.filter(q => q.status === 'Active');
  if (s.sideQuests.length) {
    lines.push('## Side Quests');
    finishedQuests.forEach(q => lines.push(`- ✔ [${q.goalType}] ${q.goal} *(${q.status}${q.giver ? `, for ${q.giver}` : ''})*`));
    openQuests.forEach(q => lines.push(`- ◻ [${q.goalType}] ${q.goal} *(unfinished${q.giver ? `, for ${q.giver}` : ''})*`));
    lines.push('');
  }

  // ---- People ----
  if (s.npcs.length) {
    lines.push('## People of the Wasteland');
    s.npcs.forEach(n => lines.push(`- **${n.name}** (Square ${n.location}) — ${n.description.split('\n')[0]}`));
    lines.push('');
  }

  // ---- Map ----
  const explored = Object.entries(s.sectorData).filter(([, info]) => info.explored);
  if (explored.length) {
    lines.push('## The Map');
    lines.push(`${explored.length}/21 locations explored.`);
    lines.push('');
    explored
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([num, info]) => {
        const kind = Number(num) === 13 ? 'The Vault' : info.isSettlement ? `Settlement (${info.faction ?? 'unknown faction'}${info.reputation ? `, ${info.reputation}` : ''})` : 'Wasteland';
        lines.push(`- **Square ${num}** — ${kind}${info.icon ? `, ${info.icon}` : ''}${info.truths?.length ? ` — *${info.truths.join('; ')}*` : ''}`);
      });
    lines.push('');
  }

  // ---- Journal ----
  lines.push('## The Journal');
  lines.push('');
  lines.push(s.journalText.trim());
  lines.push('');
  lines.push('---');
  lines.push('*War. War never changes.*');

  return lines.join('\n');
};

export const downloadStory = () => {
  const markdown = buildStoryMarkdown();
  const name = useGameState.getState().name || 'vault-dweller';
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-wasteland-story.md`;
  a.click();
  URL.revokeObjectURL(url);
};
