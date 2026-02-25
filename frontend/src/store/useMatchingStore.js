import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useMatchingStore = create((set, get) => ({
  interests: [],
  matches: [],
  isLoadingInterests: false,
  isOnboarding: false,
  isLoadingMatches: false,

  fetchInterests: async () => {
    set({ isLoadingInterests: true });
    try {
      const res = await axiosInstance.get("/matching/interests");
      set({ interests: res.data.interests });
    } catch (error) {
      toast.error("Failed to load interests");
    } finally {
      set({ isLoadingInterests: false });
    }
  },

  onboard: async (selectedInterests) => {
    set({ isOnboarding: true });
    try {
      const res = await axiosInstance.post("/matching/onboard", {
        interests: selectedInterests,
      });
      toast.success("Interests saved!");
      return res.data.user;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save interests");
      throw error;
    } finally {
      set({ isOnboarding: false });
    }
  },

  fetchMatches: async () => {
    set({ isLoadingMatches: true });
    try {
      const res = await axiosInstance.get("/matching/matches");
      set({ matches: res.data.matches });
    } catch (error) {
      toast.error("Failed to load matches");
    } finally {
      set({ isLoadingMatches: false });
    }
  },
}));