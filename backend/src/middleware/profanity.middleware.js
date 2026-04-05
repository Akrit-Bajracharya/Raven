// backend/src/middleware/profanity.middleware.js

import { profanityFilter } from "../lib/profanityFilter.js";

export const profanityMiddleware = (req, res, next) => {
  const text = req.body?.text || req.body?.message || req.body?.content;
   
  console.log("FULL BODY:", req.body); // add this
    console.log("PROFANITY CHECK - text received:", text); 

  if (!text || typeof text !== "string") return next();

  const result = profanityFilter.filter(text);
   console.log("FILTER RESULT:", result);
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