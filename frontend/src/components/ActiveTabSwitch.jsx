import { useChatStore } from "../store/useChatStore"

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div
      className="flex p-2 m-2 rounded-lg gap-1"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      <button
        onClick={() => setActiveTab("chats")}
        className="tab flex-1 rounded-md py-1.5 text-sm font-medium transition-all"
        style={{
          backgroundColor: activeTab === "chats" ? "var(--accent)" : "transparent",
          color: activeTab === "chats" ? "var(--bubble-out-text)" : "var(--text-secondary)",
        }}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className="tab flex-1 rounded-md py-1.5 text-sm font-medium transition-all"
        style={{
          backgroundColor: activeTab === "contacts" ? "var(--accent)" : "transparent",
          color: activeTab === "contacts" ? "var(--bubble-out-text)" : "var(--text-secondary)",
        }}
      >
        Contacts
      </button>
    </div>
  );
}

export default ActiveTabSwitch;