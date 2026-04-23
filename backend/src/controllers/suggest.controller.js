// backend/src/controllers/suggest.controller.js
import { markov } from "../lib/markovChain.js";

export const getSuggestion = (req, res) => {
  // currentInput: the raw plaintext the user is currently typing
  // decryptedHistory: array of already-decrypted plaintext strings sent by the frontend
  //                   (frontend decrypts messages before sending here)
  // chatHistory is kept for backwards compat but ignored if decryptedHistory is present
  const { currentInput, decryptedHistory, chatHistory } = req.body;

  if (!currentInput || currentInput.trim().length < 2) {
    return res.status(200).json({ suggestion: "" });
  }

  try {
    // ── Prefer decryptedHistory (array of plain strings) ──────────────────
    // If the frontend sends decryptedHistory, use it directly.
    // Fallback to chatHistory for any non-encrypted legacy messages.
    const historySource = Array.isArray(decryptedHistory) && decryptedHistory.length > 0
      ? decryptedHistory
      : (Array.isArray(chatHistory) ? chatHistory : []);

    if (historySource.length > 0) {
      let sentences;

      if (
        Array.isArray(decryptedHistory) &&
        decryptedHistory.length > 0 &&
        typeof decryptedHistory[0] === "string"
      ) {
        // decryptedHistory is already an array of plain strings
        sentences = decryptedHistory.filter(
          s => typeof s === "string" && s.trim().length > 4
        );
      } else {
        // Legacy chatHistory: array of message objects with a .text field
        // Only use messages that have a plain text field (not encrypted ones)
        sentences = historySource
          .filter(m =>
            m.text &&
            typeof m.text === "string" &&
            m.text.trim().length > 4 &&
            !m.ciphertext   // skip encrypted messages — we can't read them here
          )
          .map(m => m.text.toLowerCase().trim());
      }

      if (sentences.length > 0) {
        markov.addSentences(sentences);
      }
    }

    const suggestion = markov.predict(currentInput.trim(), 5);
    return res.status(200).json({ suggestion });

  } catch (error) {
    console.error("Suggestion error:", error.message);
    return res.status(200).json({ suggestion: "" }); // always fail silently
  }
};