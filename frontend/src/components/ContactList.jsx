import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import toast from "react-hot-toast";
import { CheckIcon, XIcon } from "lucide-react";

function PendingCard({ request, onAccept, onReject }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="p-4 rounded-lg transition-colors"
      style={{
        backgroundColor: hovered ? "var(--bg-elevated)" : "transparent",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="avatar shrink-0">
          <div className="size-12 rounded-full">
            <img
              src={request.sender.profilePic || "/avatar.png"}
              alt={request.sender.fullname}
              className="object-cover w-full h-full rounded-full"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {request.sender.fullname}
          </h4>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Wants to connect
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onAccept(request._id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--accent)", color: "var(--bubble-out-text)" }}
          >
            <CheckIcon className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => onReject(request._id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <XIcon className="w-3 h-3" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactList() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await axiosInstance.get("/friends/pending");
      setPendingRequests(res.data);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      await axiosInstance.post(`/friends/accept/${requestId}`);
      toast.success("Friend request accepted!");
      fetchPending();
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axiosInstance.post(`/friends/reject/${requestId}`);
      toast.success("Request rejected");
      fetchPending();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  if (loading) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-2">
      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center"
          style={{ color: "var(--text-secondary)" }}>
          <p className="text-sm font-medium">No pending requests</p>
          <p className="text-xs mt-1 opacity-60">When someone adds you, they'll appear here.</p>
        </div>
      ) : (
        pendingRequests.map((req) => (
          <PendingCard
            key={req._id}
            request={req}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))
      )}
    </div>
  );
}

export default ContactList;