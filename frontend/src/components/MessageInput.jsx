// frontend/src/components/MessageInput.jsx

import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const CLIENT_WORDS = [
  "ass", "asshole", "bastard", "bitch", "bollocks", "bullshit",
  "cock", "crap", "cunt", "damn", "dick", "dipshit", "dumbass",
  "fag", "faggot", "fuck", "fucker", "fucking", "goddamn",
  "jackass", "jerk", "motherfucker", "nigga", "nigger",
  "piss", "prick", "pussy", "shit", "shithead", "slut", "twat",
  "whore", "wanker",
];

const NORMALISE_MAP = {
  "@": "a", "4": "a", "3": "e", "1": "i", "!": "i",
  "0": "o", "5": "s", "$": "s", "7": "t", "+": "t",
};

function normalise(text) {
  return text.toLowerCase().split("").map(c => NORMALISE_MAP[c] || c).join("").replace(/[^a-z0-9\s]/g, "");
}

function buildRegex(word) {
  return new RegExp(`\\b${word.split("").join("[\\s\\W]*")}\\b`, "gi");
}

function clientFilter(text) {
  if (!text) return { hasProfanity: false };
  const normalised = normalise(text);
  const flagged = CLIENT_WORDS.filter(w => buildRegex(w).test(normalised));
  return { hasProfanity: flagged.length > 0 };
}

function MessageInput({ onSend }) {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText]                         = useState("");
  const [imagePreview, setImagePreview]         = useState(null);
  const [profanityWarning, setProfanityWarning] = useState(false);
  const [suggestion, setSuggestion]             = useState("");

  // ── Moderation state ───────────────────────────────────────
  const [isBanned, setIsBanned]       = useState(false);
  const [banTimeLeft, setBanTimeLeft] = useState("");
  const [banUntil, setBanUntil]       = useState(null);
  // ──────────────────────────────────────────────────────────

  const fileInputRef = useRef(null);
  const debounceRef  = useRef(null);
  const suggestRef   = useRef(null);
  const banTimerRef  = useRef(null);

  const { sendMessage, messages, isSoundEnabled, socket } = useChatStore();
  const { socket: authSocket } = useAuthStore(); // use whichever store holds your socket

  // ── Listen for moderation events from the server ──────────
  useEffect(() => {
    // Try both stores since socket may live in either
    const activeSocket = socket || authSocket;
    if (!activeSocket) return;

    // Server sends this on strike 1 or 2
    activeSocket.on("moderation:warning", ({ message, strikes, strikesLeft }) => {
      toast.error(message, {
        duration: 6000,
        style: {
          background: "#1a1a1a",
          color: "#f59e0b",
          border: "1px solid #f59e0b",
          borderRadius: "10px",
          fontSize: "13px",
        },
        icon: "⚠️",
      });
    });

    // Server sends this on strike 3 or when already banned
    activeSocket.on("moderation:banned", ({ message, bannedUntil, timeLeft }) => {
      setIsBanned(true);
      setBanTimeLeft(timeLeft);
      setBanUntil(new Date(bannedUntil));

      toast.error(message, {
        duration: 10000,
        style: {
          background: "#1a1a1a",
          color: "#ef4444",
          border: "1px solid #ef4444",
          borderRadius: "10px",
          fontSize: "13px",
        },
        icon: "🚫",
      });
    });

    return () => {
      activeSocket.off("moderation:warning");
      activeSocket.off("moderation:banned");
    };
  }, [socket, authSocket]);

  // ── Count down the ban timer every minute ─────────────────
  useEffect(() => {
    if (!isBanned || !banUntil) return;

    banTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now >= banUntil.getTime()) {
        // ban has expired
        setIsBanned(false);
        setBanTimeLeft("");
        setBanUntil(null);
        clearInterval(banTimerRef.current);
        toast.success("Your mute has been lifted. You can send messages again.", {
          duration: 5000,
          icon: "✅",
        });
      } else {
        const ms   = banUntil.getTime() - now;
        const mins = Math.ceil(ms / 60000);
        setBanTimeLeft(mins <= 1 ? "less than a minute" : `${mins} minutes`);
      }
    }, 30000); // update every 30 seconds

    return () => clearInterval(banTimerRef.current);
  }, [isBanned, banUntil]);

  // ─────────────────────────────────────────────────────────

  const fetchSuggestion = useCallback(async (value) => {
    if (!value || value.trim().length < 3) { setSuggestion(""); return; }
    try {
      const chatHistory = (messages || [])
        .slice(-10)
        .filter(m => m.text && typeof m.text === "string")
        .map(m => ({ text: m.text, fromMe: !!m.senderId }));

      const res = await axiosInstance.post("/suggest", { currentInput: value, chatHistory });
      setSuggestion(res.data.suggestion || "");
    } catch {
      setSuggestion("");
    }
  }, [messages]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    setSuggestion("");
    if (isSoundEnabled) playRandomKeyStrokeSound();

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setProfanityWarning(clientFilter(value).hasProfanity);
    }, 300);

    clearTimeout(suggestRef.current);
    suggestRef.current = setTimeout(() => {
      fetchSuggestion(value);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setText(prev => prev + suggestion);
      setSuggestion("");
    }
    if (e.key === "Escape") setSuggestion("");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // ── Block send if banned ──────────────────────────────
    if (isBanned) {
      toast.error(`You are muted for ${banTimeLeft}. You cannot send messages.`, {
        duration: 4000,
        icon: "🚫",
      });
      return;
    }
    // ─────────────────────────────────────────────────────

    if (isSoundEnabled) playRandomKeyStrokeSound();

    try {
      const sender = onSend || sendMessage;
      await sender({ text: text.trim(), image: imagePreview });

      setText("");
      setImagePreview(null);
      setProfanityWarning(false);
      setSuggestion("");
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err) {
      // ── Handle HTTP moderation errors ──────────────────
      const data = err?.response?.data;

      if (data?.error === "toxic") {
        // warning already sent via socket, but fallback toast if socket missed
        toast.error(data.message, {
          duration: 6000,
          icon: "⚠️",
          style: {
            background: "#1a1a1a",
            color: "#f59e0b",
            border: "1px solid #f59e0b",
            borderRadius: "10px",
            fontSize: "13px",
          },
        });
      } else if (data?.error === "banned") {
        setIsBanned(true);
        setBanTimeLeft(data.timeLeft || "60 minutes");
        if (data.bannedUntil) setBanUntil(new Date(data.bannedUntil));

        toast.error(data.message, {
          duration: 10000,
          icon: "🚫",
          style: {
            background: "#1a1a1a",
            color: "#ef4444",
            border: "1px solid #ef4444",
            borderRadius: "10px",
            fontSize: "13px",
          },
        });
      } else {
        toast.error("Failed to send message.");
      }
      // ─────────────────────────────────────────────────
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg"
              style={{ border: "1px solid var(--border)" }} />
            <button onClick={removeImage} type="button"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Ban banner ──────────────────────────────────────── */}
      {isBanned && (
        <div className="max-w-3xl mx-auto mb-3 px-4 py-3 rounded-lg flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444" }}>
          <span style={{ fontSize: "16px" }}>🚫</span>
          <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600 }}>
            You are muted for {banTimeLeft}. Messaging is disabled.
          </p>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────── */}

      {profanityWarning && !isBanned && (
        <div className="max-w-3xl mx-auto mb-2">
          <p style={{ color: "#f59e0b", fontSize: "12px" }}>
            ⚠️ Your message may contain inappropriate language.
          </p>
        </div>
      )}

      {suggestion && (
        <div className="max-w-3xl mx-auto mb-1">
          <p style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
            Press <kbd style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "3px", padding: "0 4px", fontSize: "11px" }}>Tab</kbd> to accept suggestion
          </p>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-4">
        <div className="relative flex-1">
          <div aria-hidden="true" style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            padding: "8px 16px", pointerEvents: "none",
            whiteSpace: "pre", overflow: "hidden",
            fontSize: "inherit", fontFamily: "inherit", color: "transparent",
            borderRadius: "0.5rem",
          }}>
            {text}
            <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
              {suggestion}
            </span>
          </div>

          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={isBanned}
            className="w-full rounded-lg py-2 px-4 outline-none"
            style={{
              backgroundColor: "var(--bg-input)",
              border: isBanned
                ? "1px solid #ef4444"
                : profanityWarning
                  ? "1px solid #f59e0b"
                  : "1px solid var(--border)",
              color: "var(--text-primary)",
              position: "relative",
              zIndex: 1,
              background: "transparent",
              opacity: isBanned ? 0.5 : 1,
              cursor: isBanned ? "not-allowed" : "text",
            }}
            placeholder={isBanned ? `Muted for ${banTimeLeft}…` : "Type your message..."}
          />
        </div>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        <button type="button" onClick={() => fileInputRef.current?.click()}
          disabled={isBanned}
          className="rounded-lg px-4 transition-colors"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: imagePreview ? "var(--accent)" : "var(--text-secondary)",
            border: "1px solid var(--border)",
            opacity: isBanned ? 0.4 : 1,
            cursor: isBanned ? "not-allowed" : "pointer",
          }}>
          <ImageIcon className="w-5 h-5" />
        </button>

        <button type="submit"
          disabled={(!text.trim() && !imagePreview) || isBanned}
          className="rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--accent)", color: "var(--bubble-out-text)" }}>
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;