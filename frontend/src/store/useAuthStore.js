import { create } from "zustand";
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useGroupStore } from "./useGroupStore";
import encryption from "../lib/encryption";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],
  privateKey: null,
  isEncryptionReady: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      await get().initEncryption();
      await get().connectSocket();
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
      await get().initEncryption(data.password);
      await get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Signup failed");
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
      await get().initEncryption(data.password);
      await get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, privateKey: null, isEncryptionReady: false });
      toast.success("Logged out Successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logout failed");
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

  initEncryption: async (password = null) => {
    try {
      const { authUser } = get();
      if (!authUser) return;

      let privateKeyBase64 = await encryption.loadPrivateKey();

      // CASE 1: Key exists in IndexedDB and matches server public key
      if (privateKeyBase64 && authUser?.publicKey) {
        const fingerprint = localStorage.getItem("keyFingerprint");
        const serverFingerprint = authUser.publicKey.slice(-16);
        if (fingerprint === serverFingerprint) {
          console.log("Encryption keys in sync ✓");
          set({ privateKey: privateKeyBase64, isEncryptionReady: true });
          return;
        }
      }

      // CASE 2: Server has an encrypted backup — restore it using the login password
      if (
        authUser?.encryptedPrivateKey &&
        authUser?.privateKeySalt &&
        authUser?.privateKeyIv &&
        password
      ) {
        try {
          privateKeyBase64 = await encryption.decryptPrivateKeyWithPassword(
            authUser.encryptedPrivateKey,
            authUser.privateKeySalt,
            authUser.privateKeyIv,
            password
          );
          await encryption.savePrivateKey(privateKeyBase64);
          localStorage.setItem("keyFingerprint", authUser.publicKey.slice(-16));
          console.log("Private key restored from server backup ✓");
          set({ privateKey: privateKeyBase64, isEncryptionReady: true });
          return;
        } catch (e) {
          console.warn("Could not restore key from backup, regenerating:", e.message);
        }
      }

      // CASE 3: No key anywhere — generate a fresh pair and back it up
      console.log("Generating new encryption keypair...");
      const { publicKeyBase64, privateKeyBase64: newPrivateKey } = await encryption.generateKeyPair();

      await axiosInstance.post("/auth/save-public-key", { publicKey: publicKeyBase64 });

      if (password) {
        const { encryptedPrivateKey, salt, iv } = await encryption.encryptPrivateKeyWithPassword(
          newPrivateKey,
          password
        );
        await axiosInstance.post("/auth/save-encrypted-private-key", {
          encryptedPrivateKey,
          salt,
          iv,
        });
        console.log("Private key backup saved to server ✓");
      }

      localStorage.setItem("keyFingerprint", publicKeyBase64.slice(-16));
      set({
        privateKey: newPrivateKey,
        isEncryptionReady: true,
        authUser: { ...get().authUser, publicKey: publicKeyBase64 },
      });

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