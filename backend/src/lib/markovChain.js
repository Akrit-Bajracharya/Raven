// backend/src/lib/markovChain.js

const TRAINING_DATA = [
  "how are you doing today",
  "I am doing well thank you",
  "what are you up to",
  "I will be there soon",
  "can we talk later today",
  "let me know when you are free",
  "sounds good to me",
  "I was just thinking about you",
  "do you want to meet up",
  "that sounds like a great idea",
  "I am on my way now",
  "see you in a bit",
  "what do you think about this",
  "I totally agree with you",
  "sorry for the late reply",
  "no worries at all",
  "have you eaten yet",
  "I am feeling really tired today",
  "that is so funny",
  "I cannot wait to see you",
  "are you free this weekend",
  "let us catch up soon",
  "I miss talking to you",
  "hope you are doing well",
  "just got home from work",
  "it was a long day today",
  "what time works for you",
  "I will call you later",
  "can you send me the details",
  "thanks for letting me know",
  "I appreciate your help",
  "no problem at all",
  "happy to help you out",
  "that makes a lot of sense",
  "I was thinking the same thing",
  "let me check and get back to you",
  "sure that works for me",
  "looking forward to it",
  "have a great day",
  "take care of yourself",
  "talk to you soon",
  "good morning how are you",
  "good night sleep well",
  "what are your plans for today",
  "I need to tell you something",
  "can you help me with something",
  "I just wanted to say hello",
  "been really busy lately",
  "things have been going well",
  "I am so happy for you",
  "that is really great news",
  "I am sorry to hear that",
  "everything will be okay",
  "do not worry about it",
  "I understand how you feel",
  "that must have been tough",
  "I am here for you",
  "you can count on me",
  "we should hang out sometime",
  "it has been a while",
  "just wanted to check in",
  "are you feeling better now",
  "I hope things get better",
  "let me know if you need anything",
  "I will get back to you soon",
  "thanks for the update",
  "good luck with everything",
  "you are going to do great",
  "I believe in you",
  "that is a really good point",
  "you are absolutely right",
  "what do you mean by that",
  "I am not sure about that",
  "it depends on the situation",
  "that could work out well",
  "we will figure it out",
  "one step at a time",
  "it will all work out",
  "just do your best",
  "I am proud of you",
  "you did a great job",
  "keep up the good work",
  "I am running a bit late",
  "be there in five minutes",
  "stuck in traffic right now",
  "just leaving the house now",
  "where do you want to meet",
  "I will meet you there",
  "what should we do tonight",
  "how about we grab some food",
  "I am really hungry right now",
  "what are you in the mood for",
  "I could go for some pizza",
  "sounds delicious to me",
  "I will see you tomorrow",
  "have fun tonight",
  "be safe out there",
  "let me know when you get home",
  "I was wondering if you could help",
  "that is a wonderful idea",
  "I completely understand what you mean",
  "we can work something out",
  "I will think about it",
  "that is not a problem at all",
  "I am looking forward to seeing you",
  "it was really nice talking to you",
];

class MarkovChain {
  constructor(order = 3) {
    this.order = order; // trigram  uses last 3 words as key
    this.chain = new Map();
    this.unigramFreq = new Map(); //  frequency table for fallback
    this._train(TRAINING_DATA);
  }

  //  Private: build chain from array of sentences 
  _train(sentences) {
    for (const sentence of sentences) {
      const words = sentence.toLowerCase().trim().split(/\s+/);

      // Build unigram frequency table
      for (const word of words) {
        this.unigramFreq.set(word, (this.unigramFreq.get(word) || 0) + 1);
      }

      if (words.length < this.order + 1) continue;

      for (let i = 0; i <= words.length - this.order - 1; i++) {
        const key  = words.slice(i, i + this.order).join(" ");
        const next = words[i + this.order];
        if (!this.chain.has(key)) this.chain.set(key, new Map());
        const nextMap = this.chain.get(key);
        nextMap.set(next, (nextMap.get(next) || 0) + 1); //  store frequency not array
      }
    }
  }

  //  Public: add new sentences at runtime (learns from chat history) 
  addSentences(sentences) {
    if (!sentences || !Array.isArray(sentences)) return;
    this._train(sentences);
  }

  //  Private: pick best next word from a frequency map 
  _pickBest(freqMap) {
    if (!freqMap || freqMap.size === 0) return null;
    let bestWord  = null;
    let bestCount = 0;
    for (const [word, count] of freqMap) {
      if (count > bestCount) {
        bestCount = count;
        bestWord  = word;
      }
    }
    return bestWord;
  }

  //  Public: predict next maxWords words given input string 
  predict(input, maxWords = 5) {
    if (!input || typeof input !== "string") return "";

    const words   = input.toLowerCase().trim().split(/\s+/);
    if (words.length === 0) return "";

    const result  = [];
    let   current = [...words];

    for (let i = 0; i < maxWords; i++) {
      // Try trigram first, then bigram fallback, then unigram fallback
      let next = null;

      // Trigram lookup (order = 3)
      if (current.length >= 3) {
        const key3 = current.slice(-3).join(" ");
        next = this._pickBest(this.chain.get(key3));
      }

      // Bigram fallback (order = 2)
      if (!next && current.length >= 2) {
        const key2 = current.slice(-2).join(" ");
        next = this._pickBest(this.chain.get(key2));
      }

      // Unigram fallback (order = 1)
      if (!next && current.length >= 1) {
        const key1 = current.slice(-1).join(" ");
        // find any trigram/bigram key ending with this word
        for (const [key, freqMap] of this.chain) {
          if (key.endsWith(key1)) {
            next = this._pickBest(freqMap);
            break;
          }
        }
      }

      if (!next) break; // no prediction found, stop

      result.push(next);
      current.push(next);
    }

    return result.join(" ");
  }

  //  Public: stats for debugging 
  stats() {
    return {
      keys:     this.chain.size,
      unigrams: this.unigramFreq.size,
      order:    this.order,
    };
  }
}

// Singleton  shared across all requests
export const markov = new MarkovChain(3);
