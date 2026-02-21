import { MessageCircleIcon } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      {/* Icon circle */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "var(--accent-subtle)" }}
      >
        <MessageCircleIcon className="size-8" style={{ color: "var(--accent)" }} />
      </div>

      {/* Title */}
      <h3
        className="text-lg font-medium mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        Start your conversation with {name}
      </h3>

      {/* Subtitle */}
      <div className="flex flex-col space-y-3 max-w-md mb-5">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          This is the beginning of your conversation. Send a message to start chatting!
        </p>
        <div
          className="h-px w-32 mx-auto"
          style={{ backgroundColor: "var(--border)" }}
        />
      </div>

      {/* Quick reply buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {["👋 Say Hello", "🤝 How are you?", "📅 Meet up soon?"].map((label) => (
          <button
            key={label}
            className="px-4 py-2 text-xs font-medium rounded-full transition-colors"
            style={{
              color: "var(--accent)",
              backgroundColor: "var(--accent-subtle)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--accent-subtle)"}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;