// backend/src/lib/profanityFilter.js

const DEFAULT_WORDS = [
  "ass", "asshole", "bastard", "bitch", "bollocks", "bullshit",
  "cock", "crap", "cunt", "damn", "dick", "dipshit", "dumbass",
  "fag", "faggot", "fuck", "fucker", "fucking", "goddamn",
  "jackass", "jerk", "motherfucker", "nigga", "nigger",
  "piss", "prick", "pussy", "shit", "shithead", "slut", "twat",
  "whore", "wanker",
];

const NORMALISE_MAP = {
  "@": "a", "4": "a", "3": "e", "1": "i", "!": "i",
  "0": "o", "5": "s", "$": "s", "7": "t", "+": "t",
};

class ProfanityFilter {
  constructor() {
    this.words    = new Set(DEFAULT_WORDS);
    this.strategy = "replace"; // replace | block | warn | flag
    this.enabled  = true;
  }

  _normalise(text) {
    return text
      .toLowerCase()
      .split("")
      .map(c => NORMALISE_MAP[c] ?? c)
      .join("")
      .replace(/[^a-z0-9\s]/g, "");
  }

  _wordRegex(word) {
    const escaped = word.split("").join("[\\s\\W]*");
    return new RegExp(`\\b${escaped}\\b`, "gi");
  }

  filter(text) {
    if (!this.enabled || !text || typeof text !== "string") {
      return { clean: text, hasProfanity: false, flaggedWords: [], action: "none" };
    }

    const normalised = this._normalise(text);
    const flagged    = [...this.words].filter(w => this._wordRegex(w).test(normalised));

    if (!flagged.length) {
      return { clean: text, hasProfanity: false, flaggedWords: [], action: "none" };
    }

    switch (this.strategy) {
      case "block":
        return { clean: null, hasProfanity: true, flaggedWords: flagged, action: "blocked" };

      case "replace": {
        let clean = text;
        for (const word of flagged) {
          clean = clean.replace(this._wordRegex(word), "*".repeat(word.length));
        }
        return { clean, hasProfanity: true, flaggedWords: flagged, action: "replaced" };
      }

      case "warn":
        return { clean: text, hasProfanity: true, flaggedWords: flagged, action: "warned" };

      case "flag":
        return { clean: text, hasProfanity: true, flaggedWords: flagged, action: "flagged" };

      default:
        return { clean: text, hasProfanity: false, flaggedWords: [], action: "none" };
    }
  }

  addWord(word)    { this.words.add(word.toLowerCase().trim()); }
  removeWord(word) { this.words.delete(word.toLowerCase().trim()); }
  listWords()      { return [...this.words].sort(); }
  setStrategy(s)   { this.strategy = s; }
  setEnabled(val)  { this.enabled = Boolean(val); }
}

export const profanityFilter = new ProfanityFilter();