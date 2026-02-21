import { create } from "zustand";
import { themes } from "../lib/theme";

const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.setAttribute("data-theme", theme.id);
};

const getSavedTheme = () => {
  const savedId = localStorage.getItem("chat-theme");
  return themes.find((t) => t.id === savedId) || themes[0];
};

const useThemeStore = create((set) => {
  const initial = getSavedTheme();
  applyTheme(initial);

  return {
    currentTheme: initial,
    themes,
    setTheme: (theme) => {
      applyTheme(theme);
      localStorage.setItem("chat-theme", theme.id);
      set({ currentTheme: theme });
    },
  };
});

export default useThemeStore;