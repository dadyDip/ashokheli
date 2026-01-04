export const metadata = {
  title: "How to Play",
};

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">How to Play</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900/70 p-6 rounded-xl border border-emerald-500/20">
            <h2 className="text-xl font-semibold mb-2">Card Games</h2>
            <p className="text-gray-400 text-sm">
              Create or join rooms, play turn-based card games, and
              compete with real players.
            </p>
          </div>

          <div className="bg-gray-900/70 p-6 rounded-xl border border-emerald-500/20">
            <h2 className="text-xl font-semibold mb-2">Ludo</h2>
            <p className="text-gray-400 text-sm">
              Play classic Ludo with friends or public rooms using fair
              dice logic.
            </p>
          </div>

          <div className="bg-gray-900/70 p-6 rounded-xl border border-emerald-500/20 md:col-span-2">
            <h2 className="text-xl font-semibold mb-2">
              Wallet & Bets (Coming Soon)
            </h2>
            <p className="text-gray-400 text-sm">
              Soon you’ll be able to add balance, join paid rooms, and
              compete for rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
