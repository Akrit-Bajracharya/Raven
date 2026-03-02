import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import BorderAnimatedContainer from '../components/BorderAnimated';
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import DiscoverList from "../components/DiscoverList";
import GroupList from "../components/GroupList";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import NoConversationPlaceHolder from "../components/NoConversationPlaceHolder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();

  const renderSidebar = () => {
    if (activeTab === "chats") return <ChatsList />;
    if (activeTab === "contacts") return <ContactList />;
    if (activeTab === "discover") return <DiscoverList />;
    if (activeTab === "groups") return <GroupList />;
  };

  const renderMain = () => {
    if (activeTab === "groups") {
      return selectedGroup ? <GroupChatContainer /> : <NoConversationPlaceHolder />;
    }
    return selectedUser ? <ChatContainer /> : <NoConversationPlaceHolder />;
  };

  return (
    <div className="relative w-full max-w-6xl h-[calc(100vh-4rem)]">
      <BorderAnimatedContainer>

        {/* LEFT SIDEBAR */}
        <div
          className="w-96 backdrop-blur-sm flex flex-col h-full"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRight: "1px solid var(--border)",
          }}
        >
          <ProfileHeader />
          <ActiveTabSwitch />
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderSidebar()}
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div
          className="flex-1 flex flex-col backdrop-blur-sm h-full"
          style={{ backgroundColor: "var(--bg-base)" }}
        >
          {renderMain()}
        </div>

      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;