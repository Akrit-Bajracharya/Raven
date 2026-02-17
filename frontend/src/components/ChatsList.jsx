import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import NoChatsFound from "./noChatsFound";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function ChatsList() {
  const {getMyChatPartners, chats, isUsersLoading, setSelectedUser, onlineUsers} = useChatStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);
 
  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />; // Changed from if (true)

  return (
    <>
      {chats.map(chat => (
        <div 
          key={chat._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(chat)} // Fixed typo: setSelecdUser -> setSelectedUser
        >
          <div className="flex items-center gap-3">
            <div className={`avatar ${onlineUsers?.includes(chat._id) ? "online" : "offline"}`}>
              <div className="size-12 rounded-full">
                <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium truncate">{chat.fullname}</h4>
          </div>
        </div>
      ))}
    </>
  );
}

export default ChatsList;