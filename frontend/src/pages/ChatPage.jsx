import { useChatStore } from '../store/useChatStore';
import BorderAnimatedContainer from '../components/BorderAnimated';
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceHolder from "../components/NoConversationPlaceHolder";

function ChatPage() {
  const {activeTab, selectedUser} = useChatStore();
  return (
    <div className="relative w-full max-w-6xl h-[calc(100vh-4rem)]">
      <BorderAnimatedContainer>
        {/* LEFT-SIDE */}
        <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col h-full">
          <ProfileHeader />
          <ActiveTabSwitch />
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* right side */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm h-full">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceHolder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;