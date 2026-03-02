import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // for 1-on-1 (keep as is)
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // new: for group messages
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: { type: String, trim: true, maxlength: 2000 },
    image: { type: String },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;