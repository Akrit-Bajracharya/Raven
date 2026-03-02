import { useChatStore } from "../store/useChatStore"

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  const tabs = [
    { id: "chats", label: "Chats" },
    { id: "contacts", label: "Contacts" },
    { id: "discover", label: "Discover" },
    { id: "groups", label: "Groups" },  // ✅ just add this line
  ];

  return (
    <div
      className="flex p-2 m-2 rounded-lg gap-1"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="tab flex-1 rounded-md py-1.5 text-sm font-medium transition-all"
          style={{
            backgroundColor: activeTab === tab.id ? "var(--accent)" : "transparent",
            color: activeTab === tab.id ? "var(--bubble-out-text)" : "var(--text-secondary)",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ActiveTabSwitch;