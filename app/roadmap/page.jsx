export const metadata = {
  title: "Roadmap",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Roadmap</h1>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-gray-900/70 border border-emerald-500/30">
            ✅ Ludo Game <br /> ✅ Card Game Rooms
          </div>

          <div className="p-5 rounded-xl bg-gray-900/70 border border-yellow-500/30">
            🛠 Admin Panel <br /> 🛠 Balance System
          </div>

          <div className="p-5 rounded-xl bg-gray-900/70 border border-gray-500/30">
            🔒 Wallet <br /> 🔒 Recharges <br /> 🔒 Tournaments
          </div>
        </div>
      </div>
    </div>
  );
}
