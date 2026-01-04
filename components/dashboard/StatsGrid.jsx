"use client";

export function StatsGrid({ stats }) {
  // ✅ Safe defaults (new account / loading state)
  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;

  const winRate =
    gamesPlayed === 0
      ? "0%"
      : `${Math.round((wins / gamesPlayed) * 100)}%`;

  const items = [
    { label: "Games Played", value: gamesPlayed },
    { label: "Wins", value: wins, color: "text-emerald-400" },
    { label: "Losses", value: losses, color: "text-red-400" },
    { label: "Win Rate", value: winRate },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-xl bg-gray-900/60 p-4 border border-white/10"
        >
          <p className="text-sm text-gray-400">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color ?? "text-white"}`}>
            {s.value}
          </p>
        </div>
      ))}
    </section>
  );
}
