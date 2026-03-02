import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isLoadingGroups: false,
  isLoadingMessages: false,

  fetchGroups: async () => {
    set({ isLoadingGroups: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isLoadingGroups: false });
    }
  },

  createGroup: async (name, memberIds) => {
    try {
      const res = await axiosInstance.post("/groups", { name, memberIds });
      set((state) => ({ groups: [res.data, ...state.groups] }));
      toast.success("Group created!");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    }
  },

  selectGroup: (group) => set({ selectedGroup: group, groupMessages: [] }),

  fetchGroupMessages: async (groupId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      set((state) => ({ groupMessages: [...state.groupMessages, res.data] }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  },

  addIncomingMessage: (message) => {
    const { selectedGroup } = get();
    if (selectedGroup?._id === message.groupId) {
      set((state) => ({ groupMessages: [...state.groupMessages, message] }));
    }
  },
}));