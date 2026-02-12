"use client";

import { useEffect, useState } from "react";

export default function WithdrawTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWithdraws = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token");
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
        setError(`Server error: ${res.status}`);
        setData([]);
        setLoading(false);
        return;
      }

      // Check if response has content
      const text = await res.text();
      if (!text) {
        setData([]);
        setLoading(false);
        return;
      }

      const json = JSON.parse(text);

      // Handle all common backend shapes
      const withdraws = Array.isArray(json)
        ? json
        : json.withdraws || json.data || [];

      setData(withdraws);
    } catch (err) {
      console.error("Withdraw fetch error", err);
      setError("Failed to fetch withdraws");
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
          const text = await res.text();
          if (text) err = JSON.parse(text);
        } catch {}
        throw new Error(err.error || `Failed: ${res.status}`);
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

  if (error) {
    return (
      <div>
        <p className="text-red-400 mb-2">Error: {error}</p>
        <button
          onClick={fetchWithdraws}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data.length) {
    return <p className="text-gray-400">No pending withdraws</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pending Withdrawals</h3>
        <button
          onClick={fetchWithdraws}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
        >
          Refresh
        </button>
      </div>
      <table className="w-full text-sm border border-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-2">User Phone</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Account</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((w) => (
            <tr key={w.id} className="border-t border-gray-700">
              <td className="p-2">{w.user?.phone || w.user?.phoneNumber || "Unknown"}</td>
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
    </div>
  );
}