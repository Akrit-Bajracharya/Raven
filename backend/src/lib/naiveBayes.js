// backend/src/lib/naiveBayes.js

import fs from "fs";
import { preprocess } from "./textPreprocessor.js";

class NaiveBayesClassifier {
  constructor() {
    this.wordCounts  = { toxic: {}, clean: {} };
    this.classCounts = { toxic: 0, clean: 0 };
    this.vocabulary  = new Set();
  }

  train(text, label) {
    const words = preprocess(text);
    this.classCounts[label]++;
    words.forEach(word => {
      this.vocabulary.add(word);
      this.wordCounts[label][word] =
        (this.wordCounts[label][word] || 0) + 1;
    });
  }

  predict(text) {
    const words = preprocess(text);
    const total  = this.classCounts.toxic + this.classCounts.clean;

    if (total === 0) {
      return { label: "clean", isToxic: false, confidence: "0%", toxicScore: "0", cleanScore: "0" };
    }

    const totalToxicWords = Object.values(this.wordCounts.toxic).reduce((a, b) => a + b, 0);
    const totalCleanWords = Object.values(this.wordCounts.clean).reduce((a, b) => a + b, 0);
    const vocabSize       = this.vocabulary.size;

    if (totalToxicWords === 0 || totalCleanWords === 0) {
      return { label: "clean", isToxic: false, confidence: "0%", toxicScore: "0", cleanScore: "0" };
    }

    // ── FIX: use equal priors instead of actual class counts ──────────────
    // The dataset has 131k clean vs 7.6k toxic (17:1 ratio).
    // Using real priors means cleanScore starts 2.8 log-points ahead
    // before seeing a single word — toxic phrases can never overcome that.
    // Equal priors (0.5 / 0.5) let the word evidence decide on its own.
    // ──────────────────────────────────────────────────────────────────────
    let toxicScore = Math.log(0.5);
    let cleanScore = Math.log(0.5);

    // score each word with Laplace smoothing
    words.forEach(word => {
      const toxicWordCount = (this.wordCounts.toxic[word] || 0) + 1;
      const cleanWordCount = (this.wordCounts.clean[word] || 0) + 1;

      toxicScore += Math.log(toxicWordCount / (totalToxicWords + vocabSize));
      cleanScore += Math.log(cleanWordCount / (totalCleanWords + vocabSize));
    });

    const isToxic = toxicScore > cleanScore;

    // confidence as a capped percentage
    const total2     = Math.abs(toxicScore) + Math.abs(cleanScore);
    const confidence = total2 > 0
      ? Math.min(99, Math.round((Math.abs(toxicScore - cleanScore) / total2) * 100 * 5))
      : 0;

    return {
      label:      isToxic ? "toxic" : "clean",
      isToxic,
      confidence: confidence + "%",
      toxicScore: toxicScore.toFixed(4),
      cleanScore: cleanScore.toFixed(4),
    };
  }

  save(filePath) {
    const data = {
      wordCounts:  this.wordCounts,
      classCounts: this.classCounts,
      vocabulary:  [...this.vocabulary],
    };
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log("Model saved to " + filePath);
  }

  load(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error("Model file not found at " + filePath);
    }
    const data       = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    this.wordCounts  = data.wordCounts;
    this.classCounts = data.classCounts;
    this.vocabulary  = new Set(data.vocabulary);
    console.log("Model loaded from " + filePath);
  }

  stats() {
    return {
      totalTrained:   this.classCounts.toxic + this.classCounts.clean,
      toxicExamples:  this.classCounts.toxic,
      cleanExamples:  this.classCounts.clean,
      vocabularySize: this.vocabulary.size,
    };
  }
}

export const classifier = new NaiveBayesClassifier();