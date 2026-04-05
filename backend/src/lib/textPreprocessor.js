// backend/src/lib/textPreprocessor.js

// ── IMPORTANT CHANGE ────────────────────────────────────────────────────────
// Removed toxic-signal words from stop words:
//   "you", "your", "he", "she", "they", "are", "is", "am"
// These words carry meaning in toxic phrases like:
//   "you are dumb", "you are ugly", "he is an idiot"
// Removing them was causing the classifier to lose all context.
// ────────────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // personal pronouns that don't add toxic signal — kept minimal
  "me", "my", "myself", "we", "our", "ours", "ourselves",
  "yours", "yourself", "him", "his", "her", "hers",
  "its", "them", "their",
  "what", "which", "who", "whom", "this", "that", "these",
  "those", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "shall",
  "a", "an", "the", "and", "but", "if", "or", "as", "at",
  "by", "for", "with", "about", "into", "through", "of",
  "to", "in", "on", "so", "then", "than", "too", "very",
]);

export function preprocess(text) {
  if (!text || typeof text !== "string") return [];

  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(word =>
      word.length > 1 &&        // lowered from >2 so "go" "up" etc. are kept
      !STOP_WORDS.has(word)
    );
}