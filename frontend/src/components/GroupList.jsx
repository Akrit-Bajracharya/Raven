import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { Users, Plus, X } from "lucide-react";

export default function GroupList() {
  const { groups, fetchGroups, createGroup, selectGroup, selectedGroup, isLoadingGroups } = useGroupStore();
  const { allContacts, getAllContacts } = useChatStore();
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchGroups();
    getAllContacts();
  }, []);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    await createGroup(groupName, selectedMembers);
    setShowModal(false);
    setGroupName("");
    setSelectedMembers([]);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-semibold opacity-50 uppercase tracking-wider">Groups</span>
        <button onClick={() => setShowModal(true)} className="btn btn-xs btn-ghost">
          <Plus size={14} />
        </button>
      </div>

      {isLoadingGroups ? (
        <span className="text-xs opacity-40 px-1">Loading...</span>
      ) : groups.length === 0 ? (
        <span className="text-xs opacity-40 px-1">No groups yet. Create one!</span>
      ) : (
        groups.map((group) => (
          <button
            key={group._id}
            onClick={() => selectGroup(group)}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-base-200 ${
              selectedGroup?._id === group._id ? "bg-base-300" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Users size={18} className="text-primary-content" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-medium truncate">{group.name}</p>
              <p className="text-xs opacity-50">{group.members.length} members</p>
            </div>
          </button>
        ))
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-xl p-6 w-80 flex flex-col gap-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base">New Group</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-xs">
                <X size={16} />
              </button>
            </div>

            <input
              className="input input-bordered w-full"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              <p className="text-xs opacity-50 mb-1">Select members:</p>
              {allContacts.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center gap-3 cursor-pointer p-2 hover:bg-base-200 rounded-lg"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
                  />
                  <img
                    src={user.profilePic || "/avatar.png"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-sm">{user.fullname}</span>
                </label>
              ))}
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleCreate}
              disabled={!groupName.trim() || selectedMembers.length === 0}
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}