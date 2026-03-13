import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId } from "../lib/socket.js";
import { io } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // 👇 modified: include publicKey in response so frontend can encrypt
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    if (!userToChatId) {
      return res.status(400).json({ error: "userToChatId is required" });
    }

    // 👇 modified: also fetch the other user's publicKey and attach to each message
    const otherUser = await User.findById(userToChatId).select("publicKey");

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Attach sender's public key to each message so frontend can decrypt
    const messagesWithKey = messages.map((msg) => ({
      ...msg.toObject(),
      senderPublicKey: otherUser?.publicKey || "",
    }));

    res.status(200).json(messagesWithKey);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    // 👇 modified: accept ciphertext + iv alongside text and image
    const { text, image, ciphertext, iv } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !ciphertext) {
      return res.status(400).json({ message: "text, image, or encrypted message is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself" });
    }

    // Only friends can message each other
    const sender = await User.findById(senderId);
    const isFriend = sender.friends.map(f => f.toString()).includes(receiverId);
    if (!isFriend) {
      return res.status(403).json({ message: "You can only message your contacts." });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // 👇 modified: save ciphertext + iv instead of plain text when encrypted
    const newMessage = new Message({
      senderId,
      receiverId,
      text: ciphertext ? undefined : text,   // plain text only if not encrypted
      ciphertext: ciphertext || undefined,    // encrypted message body
      iv: iv || undefined,                    // encryption IV
      image: imageUrl,
    });

    await newMessage.save();

    // 👇 modified: attach sender's publicKey so receiver can decrypt via socket
    const senderPublicKey = sender.publicKey || "";
    const messageToEmit = { ...newMessage.toObject(), senderPublicKey };

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageToEmit);
    }

    res.status(201).json(messageToEmit);
  } catch (error) {
    console.log("Error in SendMessage controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // 👇 modified: include publicKey in friends list so chat store can access it
    const user = await User.findById(loggedInUserId).populate("friends", "-password");
    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getChatPartners:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};