export function GameRoomCard({
  gameImage,
  title,
  description,
  onJoin,
  players = "3 / 4",
  badge = "Instant",
}) {
  return (
    <button
      onClick={onJoin}
      className="relative rounded-2xl overflow-hidden border border-white/10
                 bg-cover bg-center h-[240px] flex flex-col justify-between
                 text-left cursor-pointer
                 transition-all duration-300
                 hover:scale-[1.03] hover:border-emerald-500/40
                 active:scale-[0.99]"
      style={{ backgroundImage: `url(${gameImage})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

      {/* Top content */}
      <div className="relative p-4 space-y-2">
        <span
          className="inline-flex items-center gap-1 text-xs px-3 py-1
                     rounded-full bg-emerald-500/20 text-emerald-300
                     border border-emerald-400/30 backdrop-blur"
        >
          ⚡ {badge}
        </span>

        <h3 className="text-2xl font-bold leading-tight text-white">
          {title}
        </h3>

        <p className="text-sm text-white/75 max-w-[92%]">
          {description}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="relative p-4 flex items-center justify-between">
        <div className="text-xs text-white/70">
          👥 Players <span className="text-white font-medium">{players}</span>
        </div>

        {/* Visual CTA (no separate click target) */}
        <div
          className="px-4 py-1.5 rounded-lg
                     bg-emerald-500/90 text-black
                     text-sm font-semibold
                     shadow-lg"
        >
          Play Now →
        </div>
      </div>
    </button>
  );
}
