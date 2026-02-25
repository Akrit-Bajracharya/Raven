import User from "../models/User.js";
import { buildInterestVector } from "../constants/interests.js";
import { getMatches } from "../services/matching.service.js";
import { INTERESTS } from "../constants/interests.js";

// GET /api/matching/interests  — returns the full list of available interests
export const getInterests = (req, res) => {
  res.status(200).json({ interests: INTERESTS });
};

// POST /api/matching/onboard  — saves user's picked interests
export const onboard = async (req, res) => {
  try {
    const { interests } = req.body;

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ message: "Please select at least one interest" });
    }

    const vector = buildInterestVector(interests);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        interests,
        interestVector: vector,
        onboarded: true
      },
      { new: true }
    ).select("-password");

    res.status(200).json({ message: "Interests saved", user });
  } catch (error) {
    console.error("Error in onboard controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/matching/matches  — returns top matched users
export const getMatchedUsers = async (req, res) => {
  try {
    const matches = await getMatches(req.user._id);
    res.status(200).json({ matches });
  } catch (error) {
    console.error("Error in getMatchedUsers controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};