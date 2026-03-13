import { useRef, useCallback } from "react";
import { useCallStore } from "./useCallStore";
import { useAuthStore } from "./useAuthStore";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Store peer connection OUTSIDE Zustand — RTCPeerConnection is not a plain object
// and Zustand's state merging breaks it
let pcRef = null;

export function useWebRTC() {

  const getLocalStream = useCallback(async (callType = "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === "video",
      audio: true,
    });
    useCallStore.getState().setLocalStream(stream);
    return stream;
  }, []);

  const createPeerConnection = useCallback((targetId) => {
    // Close any existing connection
    if (pcRef) {
      pcRef.close();
      pcRef = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = useAuthStore.getState().socket;
        socket.emit("call:ice-candidate", {
          targetId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("ontrack fired", event.streams[0]);
      useCallStore.getState().setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log("connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        useCallStore.getState().setCallStatus("connected");
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        useCallStore.getState().resetCall();
        pcRef = null;
      }
    };

    return pc;
  }, []);

  const startCall = useCallback(async ({ targetId, callType = "video", callerInfo, isGroup = false, groupId, groupName, remoteProfilePic }) => {
    const socket = useAuthStore.getState().socket;

    const stream = await getLocalStream(callType);
    const pc = createPeerConnection(targetId);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    useCallStore.getState().setActiveCall({ callType, remoteUser: targetId, isGroup, groupId, groupName, remoteProfilePic });
    useCallStore.getState().setCallStatus("calling");

    socket.emit("call:initiate", {
      targetId, offer, callType, callerInfo, isGroup, groupId, groupName,
    });
  }, []);

  const acceptCall = useCallback(async ({ offer, callerId, callType = "video", isGroup, groupId, groupName, remoteProfilePic }) => {
    const socket = useAuthStore.getState().socket;

    const stream = await getLocalStream(callType);
    const pc = createPeerConnection(callerId);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    useCallStore.getState().setActiveCall({ callType, remoteUser: callerId, isGroup, groupId, groupName, remoteProfilePic });
    useCallStore.getState().setCallStatus("connected");

    socket.emit("call:accepted", { callerId, answer });
  }, []);

  const handleAnswer = useCallback(async (answer) => {
    if (pcRef) {
      await pcRef.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (pcRef) {
      try {
        await pcRef.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("ICE candidate error:", e);
      }
    }
  }, []);

  const endCall = useCallback(({ targetId, isGroup, groupId }) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("call:ended", { targetId, isGroup, groupId });
    if (pcRef) {
      pcRef.close();
      pcRef = null;
    }
    useCallStore.getState().resetCall();
  }, []);

  const rejectCall = useCallback((callerId) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("call:rejected", { callerId });
    useCallStore.getState().clearIncomingCall();
  }, []);

  return {
    startCall,
    acceptCall,
    handleAnswer,
    handleIceCandidate,
    endCall,
    rejectCall,
  };
}