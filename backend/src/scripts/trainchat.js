// backend/src/scripts/trainChat.js
//
// Run this AFTER trainModel.js to inject chat-style phrases.
// It loads the existing trained model, adds chat data on top,
// then saves it back — so Wikipedia training is NOT lost.
//
// Command:
//   node --experimental-vm-modules src/scripts/trainChat.js
// Or if you have "type": "module" in package.json:
//   node src/scripts/trainChat.js

import path from "path";
import { fileURLToPath } from "url";
import { classifier } from "../lib/naiveBayes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const MODEL_PATH = path.join(__dirname, "../data/trainedModel.json");

// ── Load existing model ───────────────────────────────────────────────────
console.log("Loading existing model...");
classifier.load(MODEL_PATH);
console.log("Current stats:", classifier.stats());

// ── Chat-style training data ──────────────────────────────────────────────
// Add as many examples as you like. The more the better.
// Format: { text, label }  label = "toxic" | "clean"
// ─────────────────────────────────────────────────────────────────────────
const CHAT_DATA = [
  // ── TOXIC: insults ───────────────────────────────────────────────────────
  { text: "you are dumb",                    label: "toxic" },
  { text: "you are so dumb",                 label: "toxic" },
  { text: "you are stupid",                  label: "toxic" },
  { text: "you are an idiot",                label: "toxic" },
  { text: "you are such an idiot",           label: "toxic" },
  { text: "you are ugly",                    label: "toxic" },
  { text: "you are so ugly",                 label: "toxic" },
  { text: "you are worthless",               label: "toxic" },
  { text: "you are pathetic",                label: "toxic" },
  { text: "you are a loser",                 label: "toxic" },
  { text: "you are a failure",               label: "toxic" },
  { text: "you are trash",                   label: "toxic" },
  { text: "you are garbage",                 label: "toxic" },
  { text: "you are disgusting",              label: "toxic" },
  { text: "you are annoying",                label: "toxic" },
  { text: "you are so annoying",             label: "toxic" },
  { text: "you are a waste of space",        label: "toxic" },
  { text: "you are a waste of time",         label: "toxic" },
  { text: "you are nobody",                  label: "toxic" },
  { text: "you are nothing",                 label: "toxic" },
  { text: "you are so fat",                  label: "toxic" },
  { text: "you are fat and ugly",            label: "toxic" },
  { text: "you are a joke",                  label: "toxic" },
  { text: "you are embarrassing",            label: "toxic" },
  { text: "you are a moron",                 label: "toxic" },
  { text: "you are such a moron",            label: "toxic" },
  { text: "you are a clown",                 label: "toxic" },
  { text: "you are brainless",               label: "toxic" },
  { text: "you are hopeless",                label: "toxic" },
  { text: "you are useless",                 label: "toxic" },
  { text: "you are so useless",              label: "toxic" },
  { text: "you are terrible",                label: "toxic" },
  { text: "you are the worst",               label: "toxic" },
  { text: "you are a bad person",            label: "toxic" },
  { text: "you are selfish",                 label: "toxic" },
  { text: "you are toxic",                   label: "toxic" },
  { text: "you make me sick",                label: "toxic" },
  { text: "you disgust me",                  label: "toxic" },
  { text: "you are so fake",                 label: "toxic" },
  { text: "you are fake",                    label: "toxic" },
  { text: "you are a liar",                  label: "toxic" },
  { text: "you always lie",                  label: "toxic" },
  { text: "you never do anything right",     label: "toxic" },
  { text: "nobody likes you",                label: "toxic" },
  { text: "everyone hates you",              label: "toxic" },
  { text: "no one cares about you",          label: "toxic" },
  { text: "go away",                         label: "toxic" },
  { text: "just leave",                      label: "toxic" },
  { text: "get lost",                        label: "toxic" },
  { text: "shut up",                         label: "toxic" },
  { text: "shut your mouth",                 label: "toxic" },
  { text: "shut your face",                  label: "toxic" },
  { text: "drop dead",                       label: "toxic" },
  { text: "go to hell",                      label: "toxic" },
  { text: "i hate you",                      label: "toxic" },
  { text: "i hate you so much",              label: "toxic" },
  { text: "i despise you",                   label: "toxic" },
  { text: "i cant stand you",                label: "toxic" },
  { text: "you are so irritating",           label: "toxic" },
  { text: "stop being so stupid",            label: "toxic" },
  { text: "what is wrong with you",          label: "toxic" },
  { text: "are you that dumb",               label: "toxic" },
  { text: "are you serious right now",       label: "toxic" },
  { text: "you must be joking",              label: "toxic" },
  { text: "you are beyond stupid",           label: "toxic" },
  { text: "you have no brain",               label: "toxic" },
  { text: "you have no friends",             label: "toxic" },
  { text: "you have no life",                label: "toxic" },
  { text: "get out of here",                 label: "toxic" },
  { text: "get out of my face",              label: "toxic" },
  { text: "stop talking to me",              label: "toxic" },
  { text: "leave me alone you idiot",        label: "toxic" },
  { text: "you are an embarrassment",        label: "toxic" },
  { text: "you are so childish",             label: "toxic" },
  { text: "grow up you idiot",               label: "toxic" },
  { text: "act your age not your iq",        label: "toxic" },
  { text: "you are always wrong",            label: "toxic" },
  { text: "you are never right",             label: "toxic" },

  // ── TOXIC: threats ───────────────────────────────────────────────────────
  { text: "i will destroy you",              label: "toxic" },
  { text: "i will hurt you",                 label: "toxic" },
  { text: "i will make you pay",             label: "toxic" },
  { text: "i will find you",                 label: "toxic" },
  { text: "you will regret this",            label: "toxic" },
  { text: "you better watch out",            label: "toxic" },
  { text: "watch your back",                 label: "toxic" },
  { text: "i am going to ruin you",          label: "toxic" },
  { text: "i know where you live",           label: "toxic" },

  // ── TOXIC: self-harm related ──────────────────────────────────────────────
  { text: "go kill yourself",                label: "toxic" },
  { text: "just kill yourself",              label: "toxic" },
  { text: "you should not exist",            label: "toxic" },
  { text: "the world is better without you", label: "toxic" },
  { text: "do everyone a favour and disappear", label: "toxic" },

  // ── CLEAN: normal chat ────────────────────────────────────────────────────
  { text: "hey how are you",                 label: "clean" },
  { text: "how are you doing",               label: "clean" },
  { text: "good morning",                    label: "clean" },
  { text: "good night",                      label: "clean" },
  { text: "how was your day",                label: "clean" },
  { text: "what are you up to",              label: "clean" },
  { text: "are you free later",              label: "clean" },
  { text: "let us meet up",                  label: "clean" },
  { text: "that sounds great",               label: "clean" },
  { text: "i agree with you",                label: "clean" },
  { text: "you are right",                   label: "clean" },
  { text: "you are doing great",             label: "clean" },
  { text: "you are so talented",             label: "clean" },
  { text: "you are amazing",                 label: "clean" },
  { text: "you are very kind",               label: "clean" },
  { text: "you are a good friend",           label: "clean" },
  { text: "you are so funny",                label: "clean" },
  { text: "you are so smart",                label: "clean" },
  { text: "you are brilliant",               label: "clean" },
  { text: "you look great today",            label: "clean" },
  { text: "i really appreciate you",         label: "clean" },
  { text: "thank you so much",               label: "clean" },
  { text: "thanks for helping me",           label: "clean" },
  { text: "i am proud of you",               label: "clean" },
  { text: "keep up the good work",           label: "clean" },
  { text: "well done",                       label: "clean" },
  { text: "great job",                       label: "clean" },
  { text: "i miss you",                      label: "clean" },
  { text: "i love spending time with you",   label: "clean" },
  { text: "you mean a lot to me",            label: "clean" },
  { text: "have a great day",                label: "clean" },
  { text: "take care",                       label: "clean" },
  { text: "stay safe",                       label: "clean" },
  { text: "let me know if you need help",    label: "clean" },
  { text: "i am here for you",               label: "clean" },
  { text: "sounds like a plan",              label: "clean" },
  { text: "that is a good idea",             label: "clean" },
  { text: "i think that makes sense",        label: "clean" },
  { text: "can we talk later",               label: "clean" },
  { text: "what do you think about this",    label: "clean" },
  { text: "what time works for you",         label: "clean" },
  { text: "sure no problem",                 label: "clean" },
  { text: "of course i will help",           label: "clean" },
  { text: "happy to assist",                 label: "clean" },
  { text: "glad you reached out",            label: "clean" },
  { text: "hope you are feeling better",     label: "clean" },
  { text: "thinking of you",                 label: "clean" },
  { text: "you got this",                    label: "clean" },
  { text: "believe in yourself",             label: "clean" },
  { text: "you are doing your best",         label: "clean" },
  { text: "it will get better",              label: "clean" },
];

// ── Train on chat data ────────────────────────────────────────────────────
console.log(`\nAdding ${CHAT_DATA.length} chat examples...`);

let toxic = 0;
let clean = 0;

// Train each example multiple times to give chat data stronger weight
// against the large Wikipedia dataset
const REPEAT = 5;

for (let r = 0; r < REPEAT; r++) {
  for (const { text, label } of CHAT_DATA) {
    classifier.train(text, label);
    if (label === "toxic") toxic++;
    else clean++;
  }
}

console.log(`Added ${toxic} toxic examples, ${clean} clean examples (each x${REPEAT})`);
console.log("Updated stats:", classifier.stats());

// ── Save updated model ────────────────────────────────────────────────────
classifier.save(MODEL_PATH);
console.log("\nDone! Model updated and saved.");
console.log("Now restart your server — no other changes needed.");