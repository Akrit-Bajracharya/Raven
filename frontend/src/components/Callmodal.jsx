import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useWebRTC } from "../store/useWebRTC";

export default function CallModal() {
  const {
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isRemoteCameraOff,
    callStatus,
    toggleMute,
    toggleCamera,
  } = useCallStore();

  const { endCall } = useWebRTC();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream whenever ref or stream changes
  const localVideoMount = (node) => {
    localVideoRef.current = node;
    if (node && localStream) {
      node.srcObject = localStream;
    }
  };

  const remoteVideoMount = (node) => {
    remoteVideoRef.current = node;
    if (node && remoteStream) {
      node.srcObject = remoteStream;
    }
  };

  // Also re-attach if stream arrives after mount
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const { callType, remoteUser, isGroup, groupId, groupName } = activeCall;
  const isVideo = callType === "video";

  const handleEnd = () => {
    endCall({ targetId: remoteUser, isGroup, groupId });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {isVideo ? (
        <div className="absolute inset-0">
          <video
            ref={remoteVideoMount}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {isRemoteCameraOff && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{ backgroundColor: "#0f0f1a" }}
            >
              <img
                src={activeCall?.remoteProfilePic || "/avatar.png"}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: "3px solid rgba(255,255,255,0.15)" }}
              />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Camera is off
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={activeCall?.remoteProfilePic || "/avatar.png"}
                className="w-28 h-28 rounded-full object-cover"
                style={{ border: "3px solid var(--accent)" }}
              />
              {callStatus === "calling" && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: "var(--accent)" }} />
              )}
            </div>
            <p className="text-white text-xl font-semibold">{groupName || "Voice Call"}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {callStatus === "calling" ? "Calling..." : callStatus === "connected" ? "Connected" : "Connecting..."}
            </p>
          </div>
        </div>
      )}

      {/* Bottom gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
      />

      {/* Status badge */}
      <div className="absolute top-6 left-0 right-0 flex justify-center">
        <div
          className="px-4 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {callStatus === "calling" ? "Calling..." : callStatus === "connected" ? "● Connected" : "Connecting..."}
        </div>
      </div>

      {/* Local PiP */}
      {isVideo && (
        <div
          className="absolute bottom-28 right-5 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: "2px solid rgba(255,255,255,0.2)" }}
        >
          <video
            ref={localVideoMount}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <VideoOff size={22} className="text-white/50" />
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-5">
        <button
          onClick={toggleMute}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
          style={{
            backgroundColor: isMuted ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {isMuted ? <MicOff size={20} className="text-black" /> : <Mic size={20} className="text-white" />}
        </button>

        <button
          onClick={handleEnd}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
          style={{ backgroundColor: "#ef4444" }}
        >
          <PhoneOff size={24} className="text-white" />
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: isCameraOff ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {isCameraOff ? <VideoOff size={20} className="text-black" /> : <Video size={20} className="text-white" />}
          </button>
        )}
      </div>
    </div>
  );
}