import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import encryption from "../lib/encryption"; // 👈 added

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
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ── MODIFIED: decrypt messages when loading ──────────────────────
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const { selectedUser } = get();

      const myPrivateKey = await encryption.loadPrivateKey();
      const theirPublicKey = selectedUser?.publicKey;

      // If keys exist, decrypt — otherwise show as-is (fallback)
      const decryptedMessages = await Promise.all(
        res.data.map(async (msg) => {
          if (msg.ciphertext && msg.iv && myPrivateKey && theirPublicKey) {
            try {
              const plaintext = await encryption.readMessage(
                msg.ciphertext,
                msg.iv,
                myPrivateKey,
                theirPublicKey
              );
              return { ...msg, text: plaintext };
            } catch {
              return { ...msg, text: "[encrypted message]" };
            }
          }
          return msg; // unencrypted message (old messages before encryption was added)
        })
      );

      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ── MODIFIED: encrypt message before sending ─────────────────────
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    // Optimistic UI shows the plain text immediately
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    set({ messages: [...messages, optimisticMessage] });

    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    try {
      let payload = { ...messageData };

      // Encrypt text if both keys are available
      if (messageData.text && selectedUser?.publicKey) {
        const myPrivateKey = await encryption.loadPrivateKey();

        if (myPrivateKey) {
          const { ciphertext, iv } = await encryption.prepareMessage(
            messageData.text,
            myPrivateKey,
            selectedUser.publicKey
          );
          // Send encrypted — don't send plain text
          payload = { ...messageData, text: undefined, ciphertext, iv };
        }
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);

      // Replace optimistic message with real one, keep text readable in UI
      const confirmedMessage = { ...res.data, text: messageData.text };
      set({ messages: [...messages, confirmedMessage] });

    } catch (error) {
      set({ messages }); // rollback optimistic message
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ── MODIFIED: decrypt incoming socket messages ───────────────────
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", async (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Decrypt incoming message
      let displayMessage = newMessage;
      if (newMessage.ciphertext && newMessage.iv && selectedUser?.publicKey) {
        try {
          const myPrivateKey = await encryption.loadPrivateKey();
          const plaintext = await encryption.readMessage(
            newMessage.ciphertext,
            newMessage.iv,
            myPrivateKey,
            selectedUser.publicKey
          );
          displayMessage = { ...newMessage, text: plaintext };
        } catch {
          displayMessage = { ...newMessage, text: "[encrypted message]" };
        }
      }

      const { isSoundEnabled } = get();
      const currentMessages = get().messages;
      set({ messages: [...currentMessages, displayMessage] });

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
}));