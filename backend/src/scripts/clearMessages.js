import mongoose from "mongoose";
import { ENV } from "../lib/env.js";
import Message from "../models/Message.js";

await mongoose.connect(ENV.MONGODB_URI);

const result = await Message.updateMany(
  { ciphertext: { $exists: true } },
  { $unset: { ciphertext: 1, iv: 1 }, $set: { text: "[message unavailable]" } }
);

console.log("Done:", result.modifiedCount, "messages cleared");
await mongoose.disconnect();