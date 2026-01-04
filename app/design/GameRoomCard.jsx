export function GameRoomCard({
  gameImage,
  title,
  description,
  onJoin,
  players = "1 / 4",
  badge = "FREE",
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10
                 bg-cover bg-center h-[240px] flex flex-col justify-between
                 transition-transform duration-300 hover:scale-[1.02]"
      style={{ backgroundImage: `url(${gameImage})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

      {/* Top content */}
      <div className="relative p-4 space-y-2">
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1
                         rounded-full bg-emerald-500/20 text-emerald-300
                         border border-emerald-400/20">
          🔥 {badge}
        </span>

        <h3 className="text-2xl font-bold leading-tight text-white">
          {title}
        </h3>

        <p className="text-sm text-white/75 max-w-[90%]">
          {description}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="relative p-4 flex items-center justify-between gap-3">
        <div className="text-xs text-white/60">
          👥 Players: <span className="text-white">{players}</span>
        </div>

        <button
          onClick={onJoin}
          className="px-5 py-2 rounded-xl bg-emerald-500
                     hover:bg-emerald-600 active:scale-95
                     text-black font-semibold shadow-lg
                     transition-all"
        >
          Join
        </button>
      </div>
    </div>
  );
}
