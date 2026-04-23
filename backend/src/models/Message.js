import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: { type: String, trim: true, maxlength: 2000 },
    image: { type: String },
    ciphertext: { type: String },
    iv: { type: String },
    plaintextCache: { type: String }, // ← added
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;