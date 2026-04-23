import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import encryption from "../lib/encryption";

const USE_PREVIEW_TEXT = true; // ← added

const PROFANITY_REGEX = /\b(ass|asshole|bastard|bitch|bollocks|bullshit|cock|crap|cunt|damn|dick|dipshit|dumbass|fag|faggot|fuck|fucker|fucking|goddamn|jackass|jerk|motherfucker|nigga|nigger|piss|prick|pussy|shit|shithead|slut|twat|whore|wanker)\b/gi;

function cleanText(text) {
  if (!text || typeof text !== "string") return text;
  return text.replace(PROFANITY_REGEX, match => "*".repeat(match.length));
}

async function decryptMsg(msg, myPrivateKey, theirPublicKey) {
  // ── use cached plaintext when available ──────────────────────
  if (USE_PREVIEW_TEXT) {
    return {
      ...msg,
      text: msg.plaintextCache
        ? cleanText(msg.plaintextCache)
        : msg.text
        ? cleanText(msg.text)
        : "✉️ [Encrypted]",
    };
  }
  // ─────────────────────────────────────────────────────────────
  if (!msg.ciphertext || !msg.iv || !myPrivateKey || !theirPublicKey) {
    return { ...msg, text: cleanText(msg.text) };
  }
  try {
    const plaintext = await encryption.readMessage(
      msg.ciphertext,
      msg.iv,
      myPrivateKey,
      theirPublicKey
    );
    return { ...msg, text: cleanText(plaintext) };
  } catch (e) {
    console.error("decryptMsg failed:", e.message);
    return { ...msg, text: "[encrypted message]" };
  }
}

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === "true",

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newValue);
    set({ isSoundEnabled: newValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const { privateKey: myPrivateKey } = useAuthStore.getState();

      if (!myPrivateKey) {
        console.warn("Private key not ready, skipping decryption");
        set({ messages: res.data });
        return;
      }

      const decryptedMessages = await Promise.all(
        res.data.map((msg) => {
          const theirPublicKey = msg.senderPublicKey || get().selectedUser?.publicKey;
          return decryptMsg(msg, myPrivateKey, theirPublicKey);
        })
      );

      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser, privateKey: myPrivateKey } = useAuthStore.getState();

    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    if (messageData.text?.trim()) {
      try {
        await axiosInstance.post("/messages/check-toxicity", {
          text: messageData.text.trim(),
        });
      } catch (error) {
        throw error;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const displayText = cleanText(messageData.text);

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: displayText,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    set({ messages: [...messages, optimisticMessage] });

    try {
      let payload = { ...messageData };

      if (messageData.text && selectedUser?.publicKey && myPrivateKey) {
        const cleaned = cleanText(messageData.text);
        const { ciphertext, iv } = await encryption.prepareMessage(
          cleaned,
          myPrivateKey,
          selectedUser.publicKey
        );
        payload = {
          ...messageData,
          text: undefined,
          ciphertext,
          iv,
          plaintextCache: cleaned, // ← added
        };
      } else if (messageData.text) {
        payload = { ...messageData, text: displayText };
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);

      const confirmedMessage = {
        ...res.data,
        text: displayText ?? cleanText(res.data.text),
      };

      set({
        messages: [
          ...get().messages.filter((m) => m._id !== tempId),
          confirmedMessage,
        ],
      });
    } catch (error) {
      set({ messages: get().messages.filter((m) => m._id !== tempId) });
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      const selectedUser = get().selectedUser;
      if (!selectedUser) return;

      const isFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) return;

      const { privateKey: myPrivateKey } = useAuthStore.getState();
      const theirPublicKey = newMessage.senderPublicKey || selectedUser.publicKey;
      const displayMessage = await decryptMsg(newMessage, myPrivateKey, theirPublicKey);

      set({ messages: [...get().messages, displayMessage] });

      const { isSoundEnabled } = get();
      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newMessage");
  },
}));