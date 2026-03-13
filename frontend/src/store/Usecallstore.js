import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useCallStore = create((set, get) => ({
  incomingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,

  isMuted: false,
  isCameraOff: false,
  isRemoteCameraOff: false,
  callStatus: null,

  setIncomingCall: (call) => set({ incomingCall: call }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setActiveCall: (call) => set({ activeCall: call }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setCallStatus: (status) => set({ callStatus: status }),
  setRemoteCameraOff: (val) => set({ isRemoteCameraOff: val }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    const newMuted = !isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    set({ isMuted: newMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff, activeCall } = get();
    const newCameraOff = !isCameraOff;

    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !newCameraOff;
      });
    }

    const socket = useAuthStore.getState().socket;
    if (socket && activeCall) {
      socket.emit("call:camera-toggle", {
        targetId: activeCall.remoteUser,
        isCameraOff: newCameraOff,
        isGroup: activeCall.isGroup,
        groupId: activeCall.groupId,
      });
    }

    set({ isCameraOff: newCameraOff });
  },

  resetCall: () => {
    const { localStream } = get();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    set({
      incomingCall: null,
      activeCall: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
      isRemoteCameraOff: false,
      callStatus: null,
    });
  },
}));