// backend/src/controllers/suggest.controller.js
import { markov } from "../lib/markovChain.js";

export const getSuggestion = (req, res) => {
  const { currentInput, chatHistory } = req.body;

  if (!currentInput || currentInput.trim().length < 2) {
    return res.status(200).json({ suggestion: "" });
  }

  try {
    // Learn from this user's chat history at request time
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const sentences = chatHistory
        .filter(m => m.text && typeof m.text === "string" && m.text.trim().length > 4)
        .map(m => m.text.toLowerCase().trim());
      markov.addSentences(sentences);
    }

    const suggestion = markov.predict(currentInput.trim(), 5);
    return res.status(200).json({ suggestion });

  } catch (error) {
    console.error("Suggestion error:", error.message);
    return res.status(200).json({ suggestion: "" }); // always fail silently
  }
};
