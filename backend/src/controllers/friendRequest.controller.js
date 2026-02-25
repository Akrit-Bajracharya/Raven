import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

// POST /api/friends/send/:userId
export const sendRequest = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.userId;

        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: "You can't add yourself." });
        }

        const existing = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        });

        if (existing) {
            return res.status(400).json({ message: "Request already exists." });
        }

        const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/friends/accept/:requestId
export const acceptRequest = async (req, res) => {
    try {
        const request = await FriendRequest.findById(req.params.requestId);

        if (!request || request.receiver.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Request not found." });
        }

        request.status = "accepted";
        await request.save();

        await User.findByIdAndUpdate(request.sender,   { $addToSet: { friends: request.receiver } });
        await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

        res.status(200).json({ message: "Request accepted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/friends/reject/:requestId
export const rejectRequest = async (req, res) => {
    try {
        const request = await FriendRequest.findById(req.params.requestId);

        if (!request || request.receiver.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Request not found." });
        }

        request.status = "rejected";
        await request.save();

        res.status(200).json({ message: "Request rejected." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/friends/pending  — incoming pending requests
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: "pending",
        }).populate("sender", "fullname profilePic interests");

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/friends/contacts  — accepted friends only
export const getContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate(
            "friends",
            "fullname profilePic email"
        );
        res.status(200).json(user.friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/friends/status/:userId  — check request status with a specific user
export const getRequestStatus = async (req, res) => {
    try {
        const request = await FriendRequest.findOne({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id },
            ],
        });

        if (!request) return res.status(200).json({ status: "none" });
        res.status(200).json({ status: request.status, requestId: request._id, sender: request.sender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};