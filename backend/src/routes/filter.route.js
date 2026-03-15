// backend/src/routes/filter.route.js
import express from "express";
import { profanityFilter } from "../lib/profanityFilter.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all admin filter routes — add an admin role check here if needed
router.use(protectRoute);

// GET /api/filter/settings
router.get("/settings", (_req, res) => {
  res.json({
    enabled:   profanityFilter.enabled,
    strategy:  profanityFilter.strategy,
    wordCount: profanityFilter.words.size,
  });
});

// PATCH /api/filter/settings  { enabled?: bool, strategy?: string }
router.patch("/settings", (req, res) => {
  const { enabled, strategy } = req.body;
  if (enabled  !== undefined) profanityFilter.setEnabled(enabled);
  if (strategy !== undefined) profanityFilter.setStrategy(strategy);
  res.json({ enabled: profanityFilter.enabled, strategy: profanityFilter.strategy });
});

// GET /api/filter/words
router.get("/words", (_req, res) => {
  res.json({ words: profanityFilter.listWords() });
});

// POST /api/filter/words  { word: string }
router.post("/words", (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "word is required" });
  profanityFilter.addWord(word);
  res.status(201).json({ added: word.toLowerCase().trim(), total: profanityFilter.words.size });
});

// DELETE /api/filter/words/:word
router.delete("/words/:word", (req, res) => {
  profanityFilter.removeWord(req.params.word);
  res.json({ removed: req.params.word, total: profanityFilter.words.size });
});

// POST /api/filter/test  { text: string }
router.post("/test", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  res.json(profanityFilter.filter(text));
});

export default router;