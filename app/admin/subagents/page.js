"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SubAgentsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteUserId, setPromoteUserId] = useState("");
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [subAgents, setSubAgents] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth(); // Get current user

  useEffect(() => {
    fetchUsers();
    fetchSubAgents();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        showMessage(data.error || "Failed to fetch users", "error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showMessage("Error fetching users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubAgents = async () => {
    try {
      const res = await fetch("/api/admin/subagents", {
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        setSubAgents(data.subAgents);
      } else {
        showMessage(data.error || "Failed to fetch sub-agents", "error");
      }
    } catch (error) {
      console.error("Error fetching sub-agents:", error);
      showMessage("Error fetching sub-agents", "error");
    }
  };

  const promoteToSubAgent = async () => {
    if (!promoteUserId.trim()) {
      showMessage("Please enter a User ID", "error");
      return;
    }

    setPromoteLoading(true);
    try {
      const res = await fetch("/api/admin/subagents/promote", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({ userId: promoteUserId }),
      });

      const data = await res.json();
      if (data.success) {
        showMessage("User promoted to Sub-Agent successfully!");
        
        // If the promoted user is the current user, update localStorage
        if (currentUser && currentUser.id === promoteUserId) {
          // Directly update localStorage with the new role
          const updatedUser = { ...currentUser, role: "sub-agent" };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          
          // Call refreshUser to update the AuthContext state
          refreshUser();
          
          // Show message that sidebar will update
          showMessage("Your role has been updated to Sub-Agent! The sidebar will update.", "info");
          
          // Force a small delay and reload to ensure everything updates
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
        
        setPromoteUserId("");
        fetchSubAgents();
        fetchUsers();
      } else {
        showMessage(data.error || "Failed to promote user", "error");
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      showMessage("Something went wrong", "error");
    } finally {
      setPromoteLoading(false);
    }
  };

  const demoteToUser = async (userId) => {
    if (!confirm("Are you sure you want to demote this sub-agent?")) return;

    try {
      const res = await fetch("/api/admin/subagents/demote", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (data.success) {
        showMessage("Sub-Agent demoted successfully!");
        
        // If the demoted user is the current user, update localStorage
        if (currentUser && currentUser.id === userId) {
          const updatedUser = { ...currentUser, role: "user" };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          refreshUser();
          
          // Show message about the change
          showMessage("You have been demoted to regular user.", "info");
          
          // Reload to update UI
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
        
        fetchSubAgents();
        fetchUsers();
      } else {
        showMessage(data.error || "Failed to demote sub-agent", "error");
      }
    } catch (error) {
      console.error("Error demoting sub-agent:", error);
      showMessage("Something went wrong", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "error" ? "bg-red-500/20 border border-red-500/30" : message.type === "info" ? "bg-blue-500/20 border border-blue-500/30" : "bg-green-500/20 border border-green-500/30"}`}>
            <p className={message.type === "error" ? "text-red-400" : message.type === "info" ? "text-blue-400" : "text-green-400"}>
              {message.text}
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8">Sub-Agent Management</h1>

        {/* Rest of your JSX - keep it simple */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-orange-500/30">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">
            Promote User to Sub-Agent
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={promoteUserId}
              onChange={(e) => setPromoteUserId(e.target.value)}
              placeholder="Enter User ID"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
            />
            <button
              onClick={promoteToSubAgent}
              disabled={promoteLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg"
            >
              {promoteLoading ? "Promoting..." : "Promote"}
            </button>
          </div>
        </div>

        {/* Sub-Agents Table */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-orange-500/30">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Current Sub-Agents</h2>
          {subAgents.length === 0 ? (
            <p className="text-gray-400">No sub-agents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Referrals</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subAgents.map((agent) => (
                    <tr key={agent.id} className="border-b border-gray-800">
                      <td className="py-3 px-4">{agent.firstName} {agent.lastName}</td>
                      <td className="py-3 px-4">{agent.phone || "N/A"}</td>
                      <td className="py-3 px-4">{agent._count?.referrals || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => demoteToUser(agent.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg"
                        >
                          Demote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Promo Code</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((user) => (
                  <tr key={user.id} className="border-b border-gray-800">
                    <td className="py-3 px-4 text-sm">{user.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${user.role === "admin" ? "bg-purple-500/20 text-purple-400" : user.role === "sub-agent" ? "bg-orange-500/20 text-orange-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.promoCode || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}