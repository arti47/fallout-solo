// Book tokens ([NPC], [FOE], [FACTION]…) → readable prose.
//
// The rulebook writes tokens as cross-references ("generate an [NPC]"), so a
// naive find-and-replace produces broken English: "Two Terry Weaver settlers",
// "An Assaultron" vs "a Assaultron", or "Gain a a new Side Quest". These
// helpers substitute a token *and* fix the indefinite article in front of it,
// and strip anything left over down to a plain word.

const VOWEL_SOUND = /^[aeiou]/i;
// Letters whose spoken name starts with a vowel, so an all-caps acronym takes
// "an" despite its spelling: "an NPC", "an RPG", "an S.P.E.C.I.A.L. test".
const VOWEL_LETTER_NAMES = /^[AEFHILMNORSX]/;
const isAcronym = (w: string) => /^[A-Z][A-Z.]{1,5}$/.test(w);

/** "a" or "an" to suit the word that follows, matching the original's case. */
export const indefiniteArticle = (word: string, capitalised: boolean): string => {
  const w = word.trim();
  const first = w.split(/\s+/)[0];
  const vowelSound = isAcronym(first) ? VOWEL_LETTER_NAMES.test(first) : VOWEL_SOUND.test(w);
  const art = vowelSound ? 'an' : 'a';
  return capitalised ? art.charAt(0).toUpperCase() + art.slice(1) : art;
};

export interface TokenReplacement {
  /** Matches the token, e.g. /\[NPC\]/ — flags are ignored. */
  pattern: RegExp;
  /** The concrete text to put in its place, as a BARE noun phrase (no leading
   *  "a"/"an" — the article is re-derived from the surrounding sentence). */
  value: string;
}

/** Substitutes tokens, correcting any indefinite article immediately before
 *  them so the sentence still reads. */
export const resolveTokens = (text: string, replacements: TokenReplacement[]): string => {
  let out = text;
  for (const { pattern, value } of replacements) {
    if (!value) continue;
    const src = pattern.source;
    // "a [FOE]" / "An [NPC]" — consume the article and re-pick it for the value.
    out = out.replace(
      new RegExp(`\\b(an|a)(\\s+)(?:${src})`, 'gi'),
      (_m, article: string, space: string) =>
        indefiniteArticle(value, /^[A-Z]/.test(article)) + space + value
    );
    // Any remaining bare occurrences.
    out = out.replace(new RegExp(src, 'gi'), value);
  }
  return out;
};

// Acronyms that should stay upper-case when a token is stripped rather than
// substituted ("[NPC]" must not become "Npc").
const ACRONYMS = new Set(['NPC', 'NPCS', 'XP', 'HP', 'AP', 'LP']);

/** Turns any leftover [TOKEN] into a plain word, so raw brackets never reach
 *  the player. */
export const stripTokens = (text: string): string =>
  text.replace(/\[([A-Za-z][A-Za-z ]*?)\]/g, (_m, raw: string) => {
    const word = String(raw).trim();
    if (ACRONYMS.has(word.toUpperCase())) return word.toUpperCase();
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

/** Full pass: substitute what we generated, then clean up the rest. */
export const renderTokens = (text: string, replacements: TokenReplacement[] = []): string =>
  stripTokens(resolveTokens(text, replacements));
