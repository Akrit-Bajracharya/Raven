import Group from "../models/Group.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

// Create a group
export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !memberIds?.length) {
      return res.status(400).json({ message: "Name and members are required" });
    }

    const group = await Group.create({
      name,
      members: [req.user._id, ...memberIds],
      createdBy: req.user._id,
    });

    await group.populate("members", "-password");
    res.status(201).json(group);
  } catch (error) {
    console.log("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all groups for logged-in user
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate(
      "members",
      "-password"
    );
    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getUserGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages for a group
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    // make sure user is a member
    const group = await Group.findOne({
      _id: groupId,
      members: req.user._id,
    });
    if (!group) return res.status(403).json({ message: "Access denied" });

    const messages = await Message.find({ groupId }).populate(
      "senderId",
      "fullname profilePic"
    );
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "text or image is required" });
    }

    const group = await Group.findOne({ _id: groupId, members: senderId });
    if (!group) return res.status(403).json({ message: "Access denied" });

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      groupId,
      text,
      image: imageUrl,
    });

    await newMessage.populate("senderId", "fullname profilePic");

    // emit to everyone in the socket room for this group
    io.to(groupId.toString()).emit("newGroupMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};