import { profanityFilter } from "../lib/profanityFilter.js";

export const profanityMiddleware = (req, res, next) => {
  const { text, ciphertext } = req.body; // 👈 this line was missing

  // Skip encrypted messages entirely
  if (ciphertext) return next();

  if (!text || typeof text !== "string") return next();

  const result = profanityFilter.filter(text);
  req.filterResult = result;

  if (result.action === "blocked") {
    return res.status(400).json({
      message: "Message contains prohibited language and was not sent.",
    });
  }

  if (result.action === "replaced") {
    req.body.text = result.clean;
  }

  next();
};