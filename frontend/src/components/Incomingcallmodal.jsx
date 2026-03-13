import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useWebRTC } from "../store/useWebRTC";

export default function IncomingCallModal() {
  const { incomingCall } = useCallStore();
  const { acceptCall, rejectCall } = useWebRTC();

  if (!incomingCall) return null;

  const { callerInfo, callType, offer, callerId, isGroup, groupId, groupName } = incomingCall;

  const handleAccept = () => {
    acceptCall({ offer, callerId, callType, isGroup, groupId, groupName, remoteProfilePic: callerInfo?.profilePic });
    useCallStore.getState().clearIncomingCall();
  };

  const handleReject = () => {
    rejectCall(callerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-12 pointer-events-none">
      <div
        className="pointer-events-auto w-[340px] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl animate-slide-up"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Caller info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={callerInfo?.profilePic || "/avatar.png"}
              alt={callerInfo?.fullname}
              className="w-14 h-14 rounded-full object-cover"
            />
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Incoming {callType === "video" ? "Video" : "Voice"} Call
            </p>
            <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              {isGroup ? groupName : callerInfo?.fullname}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReject}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: "#ef44441a",
              color: "#ef4444",
              border: "1px solid #ef444433",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ef444433"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ef44441a"}
          >
            <PhoneOff size={15} />
            Decline
          </button>

          <button
            onClick={handleAccept}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {callType === "video" ? <Video size={15} /> : <Phone size={15} />}
            Accept
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
}