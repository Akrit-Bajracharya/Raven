import {create} from "zustand";
import {axiosInstance} from "../lib/axios"
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useGroupStore } from "./useGroupStore";
import encryption from "../lib/encryption"; // 👈 added

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000": "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      // 👇 added: if user has no key stored locally, regenerate and save
      await get().initEncryption();
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully!");
      // 👇 added: generate keys for new user
      await get().initEncryption();
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully!");
      // 👇 added: generate/restore keys on login
      await get().initEncryption();
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out Successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile", error);
      toast.error(error?.response?.data?.message || "Profile update failed");
      throw error;
    }
  },

  // 👇 added: generates keys if none exist, then saves public key to server
  initEncryption: async () => {
    try {
      const existingKey = await encryption.loadPrivateKey();

      if (!existingKey) {
        // First time on this device — generate a fresh key pair
        const { publicKeyBase64 } = await encryption.generateKeyPair();
        await axiosInstance.post("/auth/save-public-key", { publicKey: publicKeyBase64 });
      }
      // If key already exists in IndexedDB, nothing to do —
      // the public key is already on the server from a previous session
    } catch (error) {
      console.error("Encryption init failed:", error);
    }
  },

  connectSocket: async () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, { withCredentials: true });
    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("newGroupMessage", (message) => {
      useGroupStore.getState().addIncomingMessage(message);
    });

    try {
      const res = await axiosInstance.get("/groups");
      const groupIds = res.data.map((g) => g._id);
      if (groupIds.length > 0) {
        socket.emit("joinGroups", groupIds);
      }
    } catch (e) {
      // no groups yet
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.off("newGroupMessage");
      socket.disconnect();
    }
  },
}));