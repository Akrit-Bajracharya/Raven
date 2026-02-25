import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js"; // ADD THIS

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function getMatches(userId, topN = 10) {
  const currentUser = await User.findById(userId);
  if (!currentUser || currentUser.interestVector.length === 0) return [];

  // Fetch all requests involving this user
  const requests = await FriendRequest.find({
    $or: [{ sender: userId }, { receiver: userId }],
  });

  // Build a set of IDs to exclude: self + friends + anyone with any request
  const excludedIds = new Set([
    userId.toString(),
    ...currentUser.friends.map(f => f.toString()),
    ...requests.map(r =>
      r.sender.toString() === userId.toString()
        ? r.receiver.toString()
        : r.sender.toString()
    ),
  ]);

  const otherUsers = await User.find({
    _id: { $nin: [...excludedIds] }, // CHANGED: was $ne userId, now excludes everyone above
    onboarded: true,
  }).select("fullname profilePic interests interestVector");

  const scored = otherUsers
    .map(user => ({
      user,
      score: cosineSimilarity(currentUser.interestVector, user.interestVector)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(({ user, score }) => ({
    _id: user._id,
    fullname: user.fullname,
    profilePic: user.profilePic,
    interests: user.interests,
    matchScore: Math.round(score * 100)
  }));
}