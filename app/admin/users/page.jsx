"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/design/ui/button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    setUsers(data || []);
    setLoading(false);
  };

  const toggleBan = async (userId, banned) => {
    const res = await fetch("/api/admin/users/ban", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ userId, banned }),
    });
    if (res.ok) fetchUsers();
    else alert("Failed to update ban status");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <p className="text-gray-400">Loading users...</p>;
  if (!users.length) return <p className="text-gray-400">No users found</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-700 text-sm">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-2">Name</th>
            <th>Email / Phone</th>
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
              <td>{u.email} {u.phone ? ` / ${u.phone}` : ""}</td>
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
