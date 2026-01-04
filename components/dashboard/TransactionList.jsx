export function TransactionList({ transactions }) {
  const filtered = transactions.filter((t) => t.amount !== 0);

  if (!filtered.length) {
    return <p className="text-white/40">No transactions yet</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Transactions</h2>

      <div className="rounded-xl bg-gray-900/50 divide-y">
        {filtered.map((t) => (
          <div key={t.id} className="flex justify-between p-4">
            <div>
              <p className="font-medium">{t.type}</p>
              <p className="text-xs text-gray-400">{t.status}</p>
            </div>
            <p
              className={`font-semibold ${
                t.amount > 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              ৳ {(t.amount / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
