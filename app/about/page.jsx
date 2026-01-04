export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* ABOUT SECTION */}
        <section>
          <h1 className="text-3xl font-bold mb-6">About Us</h1>

          <p className="text-gray-300 leading-relaxed">
            This platform was built with one clear goal: to create a fair,
            smooth, and enjoyable multiplayer gaming experience.
            <br /><br />
            We focus on transparency, skill-based gameplay, and a strong
            community-driven environment where players can compete with
            confidence.
            <br /><br />
            Our mission is to make competitive gaming accessible, secure,
            and fun for everyone in Bangladesh.
          </p>
        </section>

        {/* FAQ SECTION */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="bg-gray-900/70 p-4 rounded-lg border border-emerald-500/20">
              <h3 className="font-semibold">Is it free to play?</h3>
              <p className="text-sm text-gray-400 mt-1">
                Yes. You can start playing with free and demo modes.
                Paid matches use in-platform balance.
              </p>
            </div>

            <div className="bg-gray-900/70 p-4 rounded-lg border border-emerald-500/20">
              <h3 className="font-semibold">Are matches real multiplayer?</h3>
              <p className="text-sm text-gray-400 mt-1">
                Yes. All multiplayer matches are played against real players
                in real time.
              </p>
            </div>

            <div className="bg-gray-900/70 p-4 rounded-lg border border-emerald-500/20">
              <h3 className="font-semibold">Is my balance safe?</h3>
              <p className="text-sm text-gray-400 mt-1">
                Yes. Wallet balances and transactions are securely handled
                and transparently tracked.
              </p>
            </div>

            <div className="bg-gray-900/70 p-4 rounded-lg border border-emerald-500/20">
              <h3 className="font-semibold">What features are coming next?</h3>
              <p className="text-sm text-gray-400 mt-1">
                Tournaments, leaderboards, wallet top-ups, withdrawals,
                and more competitive modes are planned.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER / IMPORTANT INFO */}
        <footer className="border-t border-white/10 pt-6 space-y-3 text-sm text-gray-400">
          <p>
            Important: This platform is intended for skill-based gameplay only.
            Any form of cheating, exploitation, or unfair play may result in
            permanent account suspension.
          </p>

          <p>
            Demo balance is provided for practice purposes and cannot be
            withdrawn or transferred.
          </p>

          <p className="text-center text-xs text-gray-500 pt-4">
            © {new Date().getFullYear()} All rights reserved to Doffy.
          </p>
        </footer>

      </div>
    </div>
  );
}
