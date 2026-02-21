import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import NoChatsFound from "./noChatsFound";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ChatCard({ chat, isOnline, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="p-4 rounded-lg cursor-pointer transition-colors"
      style={{
        backgroundColor: hovered ? "var(--bg-elevated)" : "transparent",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="size-12 rounded-full">
            <img src={chat.profilePic || "/avatar.png"} alt={chat.fullname} />
          </div>
        </div>
        <h4 className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {chat.fullname}
        </h4>
      </div>
    </div>
  );
}

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } = useChatStore();
  const {onlineUsers}= useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-2">
      {chats.map(chat => (
        <ChatCard
          key={chat._id}
          chat={chat}
          isOnline={onlineUsers?.includes(chat._id)}
          onClick={() => setSelectedUser(chat)}
        />
      ))}
    </div>
  );
}

export default ChatsList;