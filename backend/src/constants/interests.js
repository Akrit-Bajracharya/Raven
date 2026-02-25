export const INTERESTS = [
  "music",
  "gaming",
  "sports",
  "travel",
  "art",
  "food",
  "technology",
  "movies",
  "fitness",
  "reading"
];

export function buildInterestVector(userInterests) {
  return INTERESTS.map(interest =>
    userInterests.includes(interest) ? 1 : 0
  );
}