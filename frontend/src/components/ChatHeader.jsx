import { XIcon, Video, Phone } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useWebRTC } from "../store/useWebRTC";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { callStatus } = useCallStore();
  const { startCall } = useWebRTC();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  const handleCall = (callType) => {
    if (callStatus) return; // already in a call
    startCall({
      targetId: selectedUser._id,
      callType,
      callerInfo: {
        fullname: authUser.fullname,
        profilePic: authUser.profilePic,
      },
      isGroup: false,
      remoteProfilePic: selectedUser.profilePic,
    });
  };

  const iconStyle = {
    color: "var(--text-muted)",
    transition: "color 0.15s",
  };

  return (
    <div
      className="flex justify-between items-center max-h-[84px] px-6 flex-1"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center space-x-3">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-12 rounded-full">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
            />
          </div>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
            {selectedUser.fullname}
          </h3>
          <p className="text-sm" style={{ color: "var(--online)" }}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Voice call */}
        <button
          onClick={() => handleCall("audio")}
          disabled={!!callStatus}
          title="Voice call"
          className="p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <Phone className="w-5 h-5" />
        </button>

        {/* Video call */}
        <button
          onClick={() => handleCall("video")}
          disabled={!!callStatus}
          title="Video call"
          className="p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <Video className="w-5 h-5" />
        </button>

        {/* Close */}
        <button onClick={() => setSelectedUser(null)}>
          <XIcon
            className="w-5 h-5 transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;