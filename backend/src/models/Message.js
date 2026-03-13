import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // for 1-on-1
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // for group messages
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: { type: String, trim: true, maxlength: 2000 },
    image: { type: String },

    // 👇 added: encrypted message fields
    ciphertext: { type: String },  // the encrypted message body
    iv: { type: String },          // the random IV used for AES encryption
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;