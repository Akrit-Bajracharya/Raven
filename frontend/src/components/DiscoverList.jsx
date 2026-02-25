import { useEffect, useState } from "react";
import { useMatchingStore } from "../store/useMatchingStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import toast from "react-hot-toast";
import { UserPlusIcon, SparklesIcon, CheckIcon } from "lucide-react";

const INTEREST_ICONS = {
  music: "🎵",
  gaming: "🎮",
  sports: "⚽",
  travel: "✈️",
  art: "🎨",
  food: "🍜",
  technology: "💻",
  movies: "🎬",
  fitness: "💪",
  reading: "📚",
};

function DiscoverCard({ match, onlineUsers }) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

 const handleAddFriend = async (e) => {
  e.stopPropagation();
  setIsAdding(true);
  try {
    await axiosInstance.post(`/friends/send/${match._id}`);
    setAdded(true);
    toast.success(`Friend request sent to ${match.fullname}!`);
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to send request");
  } finally {
    setIsAdding(false);
  }
};

  const isOnline = onlineUsers?.includes(match._id.toString());

  return (
    <div
      className="p-4 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: hovered ? "var(--bg-elevated)" : "transparent",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row — avatar, name, match score, add button */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`avatar ${isOnline ? "online" : "offline"} shrink-0`}>
          <div className="size-12 rounded-full">
            <img
              src={match.profilePic || "/avatar.png"}
              alt={match.fullname}
              className="object-cover w-full h-full rounded-full"
            />
          </div>
        </div>

        {/* Name + match score */}
        <div className="flex-1 min-w-0">
          <h4
            className="font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {match.fullname}
          </h4>
          <div className="flex items-center gap-1 mt-0.5">
            <SparklesIcon className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-medium">
              {match.matchScore}% match
            </span>
          </div>
        </div>

        {/* Add Friend button */}
        <button
          onClick={handleAddFriend}
          disabled={added || isAdding}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            backgroundColor: added
              ? "var(--bg-elevated)"
              : "var(--accent)",
            color: added ? "var(--text-secondary)" : "var(--bubble-out-text)",
            opacity: isAdding ? 0.7 : 1,
            cursor: added || isAdding ? "not-allowed" : "pointer",
          }}
        >
          {added ? (
            <>
              <CheckIcon className="w-3 h-3" />
              Sent
            </>
          ) : (
            <>
              <UserPlusIcon className="w-3 h-3" />
              {isAdding ? "..." : "Add"}
            </>
          )}
        </button>
      </div>

      {/* Interests row */}
      {match.interests?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.interests.map((interest) => (
            <span
              key={interest}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: "var(--bg-base)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <span>{INTEREST_ICONS[interest] || "✨"}</span>
              <span className="capitalize">{interest}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DiscoverList() {
  const { matches, fetchMatches, isLoadingMatches } = useMatchingStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (isLoadingMatches) return <UsersLoadingSkeleton />;

  if (matches.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        style={{ color: "var(--text-secondary)" }}
      >
        <SparklesIcon className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No matches yet</p>
        <p className="text-xs mt-1 opacity-60">
          More people will appear as they join.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <DiscoverCard
          key={match._id}
          match={match}
          onlineUsers={onlineUsers}
        />
      ))}
    </div>
  );
}

export default DiscoverList;