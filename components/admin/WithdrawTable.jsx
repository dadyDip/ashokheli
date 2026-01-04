"use client";

import { useEffect, useState } from "react";

export default function WithdrawTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdraws = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/withdraws", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Withdraw fetch failed:", res.status);
        setData([]);
        setLoading(false);
        return;
      }

      const json = await res.json();

      // 🔥 handle all common backend shapes
      const withdraws = Array.isArray(json)
        ? json
        : json.withdraws || json.data || [];

      setData(withdraws);
    } catch (err) {
      console.error("Withdraw fetch error", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const approveWithdraw = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Unauthorized");

      const res = await fetch("/api/withdraw/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        let err = {};
        try {
          err = await res.json();
        } catch {}
        throw new Error(err.error || "Failed");
      }

      alert("Withdraw approved");
      fetchWithdraws();
    } catch (err) {
      alert(err.message || "Approve failed");
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading withdraws...</p>;
  }

  if (!data.length) {
    return <p className="text-gray-400">No pending withdraws</p>;
  }

  return (
    <table className="w-full text-sm border border-gray-700">
      <thead className="bg-gray-800">
        <tr>
          <th>User</th>
          <th>Method</th>
          <th>Amount</th>
          <th>Account</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {data.map((w) => (
          <tr key={w.id} className="border-t border-gray-700">
            <td>{w.user?.email || "Unknown"}</td>
            <td>{w.method}</td>
            <td>৳ {Math.floor((w.amount || 0) / 100)}</td>
            <td>{w.account}</td>
            <td>
              <button
                onClick={() => approveWithdraw(w.id)}
                className="px-3 py-1 bg-emerald-600 rounded hover:bg-emerald-700"
              >
                Approve
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
