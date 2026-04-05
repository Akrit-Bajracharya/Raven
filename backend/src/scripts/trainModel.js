// backend/src/scripts/trainModel.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { classifier } from "../lib/naiveBayes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Using chat-focused dataset instead of Wikipedia ───────────────────────
// The Wikipedia (Jigsaw) dataset caused two problems:
//   1. Words like "you", "are", "dumb" appeared far more in clean Wikipedia
//      discussion than in toxic comments, so the model always predicted clean
//   2. 17:1 class imbalance (131k clean vs 7k toxic) biased every prediction
// The chat dataset has balanced examples focused on real chat toxic phrases.
// ─────────────────────────────────────────────────────────────────────────
const DATA_PATH  = path.join(__dirname, "../data/chat_train.csv");
const MODEL_PATH = path.join(__dirname, "../data/trainedModel.json");

console.log("Reading chat dataset...");

const raw   = fs.readFileSync(DATA_PATH, "utf-8");
const lines = raw.split("\n").slice(1); // skip header

console.log("Total rows found: " + lines.length);

let trained = 0;
let skipped = 0;

function parseCSVLine(line) {
  const result = [];
  let current  = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

for (const line of lines) {
  if (!line.trim()) { skipped++; continue; }

  const cols = parseCSVLine(line);
  if (cols.length < 3) { skipped++; continue; }

  const text  = cols[1].trim();
  const label = cols[2].trim() === "1" ? "toxic" : "clean";

  if (!text) { skipped++; continue; }

  // Train each example multiple times to build stronger word weights
  // since this dataset is much smaller than the Wikipedia one
  const repeat = 20;
  for (let i = 0; i < repeat; i++) {
    classifier.train(text, label);
  }

  trained++;
}

console.log("Training complete!");
console.log("Stats:", classifier.stats());
console.log("Trained: " + trained + " unique examples (each x20)");
console.log("Skipped: " + skipped);

classifier.save(MODEL_PATH);
console.log("Done! Model saved to " + MODEL_PATH);