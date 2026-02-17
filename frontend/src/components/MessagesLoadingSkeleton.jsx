import { useAuthStore } from "../store/useAuthStore"
import { useChatStore } from "../store/useChatStore"
import { useEffect } from "react"
import ChatHeader from "./ChatHeader"
import NoChatHistoryPlaceholder from "./NoChatPlaceholder"
import MessageInput from "./MessageInput"
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton"

function ChatContainer() {
  const {selectedUser, getMessagesByUserId, messages, isMessageLoading} = useChatStore()
  const {authUser} = useAuthStore()

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
  }, [selectedUser, getMessagesByUserId])
  
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8 min-h-0">
        {isMessageLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <div 
                key={msg._id}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              > 
                <div className={`chat-bubble relative ${
                  msg.senderId === authUser._id
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-200"
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                  )}
                  {msg.text && <p className="mt-2">{msg.text}</p>}
                  <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {new Date(msg.createdAt).toISOString().slice(11, 16)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser?.fullName} />
        )}
      </div>
      <MessageInput />
    </div>
  );
}

export default ChatContainer;