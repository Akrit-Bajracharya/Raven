import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import { useWebRTC } from "../store/useWebRTC";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { Users, Video, Phone } from "lucide-react";

export default function GroupChatContainer() {
  const { selectedGroup, groupMessages, fetchGroupMessages, isLoadingMessages, sendGroupMessage } = useGroupStore();
  const { authUser } = useAuthStore();
  const { callStatus } = useCallStore();
  const { startCall } = useWebRTC();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (selectedGroup) fetchGroupMessages(selectedGroup._id);
  }, [selectedGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const handleSend = async (messageData) => {
    await sendGroupMessage(selectedGroup._id, messageData);
  };

  const handleCall = (callType) => {
    if (callStatus) return;
    startCall({
      callType,
      isGroup: true,
      groupId: selectedGroup._id,
      groupName: selectedGroup.name,
      callerInfo: {
        fullname: authUser.fullname,
        profilePic: authUser.profilePic,
      },
    });
  };

  if (!selectedGroup) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Users size={18} className="text-primary-content" />
          </div>
          <div>
            <p className="font-semibold">{selectedGroup.name}</p>
            <p className="text-xs opacity-50">{selectedGroup.members.length} members</p>
          </div>
        </div>

        {/* Call buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCall("audio")}
            disabled={!!callStatus}
            title="Group voice call"
            className="p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => handleCall("video")}
            disabled={!!callStatus}
            title="Group video call"
            className="p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {isLoadingMessages ? (
          <MessagesLoadingSkeleton />
        ) : (
          groupMessages.map((msg) => {
            const isOwn = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
            return (
              <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}>
                {!isOwn && (
                  <img
                    src={msg.senderId?.profilePic || "/avatar.png"}
                    className="w-7 h-7 rounded-full self-end"
                  />
                )}
                <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-content" : "bg-base-200"}`}>
                  {!isOwn && (
                    <p className="text-xs font-semibold opacity-70 mb-1">{msg.senderId?.fullname}</p>
                  )}
                  {msg.image && <img src={msg.image} className="rounded mb-1 max-w-full" />}
                  {msg.text && <p>{msg.text}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  );
}