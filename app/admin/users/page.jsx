"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/design/ui/button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check if response is OK
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`);
      }

      // Check if response has content
      const text = await res.text();
      if (!text) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const data = JSON.parse(text);
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (userId, banned) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found");
        return;
      }

      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, banned }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed: ${res.status} - ${errorText}`);
      }

      fetchUsers();
    } catch (error) {
      console.error("Error toggling ban:", error);
      alert(error.message || "Failed to update ban status");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <p className="text-gray-400">Loading users...</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!users.length) return <p className="text-gray-400">No users found</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-700 text-sm">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-2">Name</th>
            <th>Phone Number</th>
            <th>Balance</th>
            <th>Deposited</th>
            <th>Withdrawn</th>
            <th>Games</th>
            <th>Status</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-700">
              <td className="p-2">{u.firstName} {u.lastName}</td>
              <td>{u.phone || "No phone"}</td>
              <td>৳ {u.balance / 100}</td>
              <td>৳ {u.totalDeposited / 100}</td>
              <td>৳ {u.totalWithdrawn / 100}</td>
              <td>{u.gamesPlayed} ({u.wins}-{u.losses})</td>
              <td>{u.isBanned ? "Banned" : "Active"}</td>
              <td>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : "-"}</td>
              <td>
                <Button
                  size="sm"
                  variant={u.isBanned ? "secondary" : "destructive"}
                  onClick={() => toggleBan(u.id, !u.isBanned)}
                >
                  {u.isBanned ? "Unban" : "Ban"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}