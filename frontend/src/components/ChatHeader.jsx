import { XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore"
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers}= useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="flex justify-between items-center max-h-[84px] px-6 flex-1"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center space-x-3">
        <div className={`avatar $(isOnline ? "online": "offline")`}>
          <div className="w-12 rounded-full">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
            />
          </div>
        </div>

        <div>
          <h3
            className="font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {selectedUser.fullname}
          </h3>
          <p className="text-sm" style={{ color: "var(--online)" }}>
            {isOnline ? "Online": "Offline"}
          </p>
        </div>
      </div>

      <button onClick={() => setSelectedUser(null)}>
        <XIcon
          className="w-5 h-5 transition-colors cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        />
      </button>
    </div>
  );
}

export default ChatHeader;