import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactCard({ contact, onlineUsers, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="p-4 rounded-lg cursor-pointer transition-colors"
      style={{
        backgroundColor: hovered ? "var(--bg-elevated)" : "transparent",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`avatar ${onlineUsers?.includes(contact._id.toString()) ? "online" : "offline"}`}>
          <div className="size-12 rounded-full">
            <img src={contact.profilePic || "/avatar.png"} alt={contact.fullname} />
          </div>
        </div>
        <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>
          {contact.fullname}
        </h4>
      </div>
    </div>
  );
}

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-2">
      {allContacts.map((contact) => (
        <ContactCard
          key={contact._id}
          contact={contact}
          onlineUsers={onlineUsers}
          onClick={() => setSelectedUser(contact)}
        />
      ))}
    </div>
  );
}

export default ContactList;