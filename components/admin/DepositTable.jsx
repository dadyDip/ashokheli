"use client";

import { useEffect, useState } from "react";

export default function DepositTable() {
  const [data, setData] = useState([]);

  const fetchDeposits = async () => {
    const res = await fetch("/api/admin/deposits", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const json = await res.json();
    setData(json || []);
  };

  const approveDeposit = async (id) => {
    try {
      const res = await fetch("/api/deposit/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ id }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        alert(data.error || "Failed to approve deposit");
        return;
      }

      alert("Deposit approved");
      fetchDeposits();
    } catch {
      alert("Network error");
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  if (!data.length) {
    return <p className="text-gray-400">No pending deposits</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-700 text-sm">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-2">User</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Trx ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-t border-gray-700">
              <td className="p-2">{d.user.email}</td>
              <td>{d.method}</td>
              <td>৳ {d.amount / 100}</td>
              <td>{d.trxId}</td>
              <td>
                <button
                  onClick={() => approveDeposit(d.id)}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700"
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
