import CrashEngine from "./casino-games/crash.js";

export function setupCrash(io) {
  const engine = new CrashEngine(io); // auto-starts itself

  io.on("connection", (socket) => {
    console.log("🎮 Crash connected", socket.id);

    let userId = null;

    /* ================= JOIN / BET ================= */
    socket.on("join_crash", async ({ userId: uid, betSlot, betAmount }) => {
      try {
        userId = uid;
        socket.join(userId);

        await engine.placeBet(userId, betSlot, betAmount);
        socket.emit("bet_placed", { betSlot });
      } catch (err) {
        socket.emit("bet_failed", { message: err.message });
      }
    });
    /* ================= CASHOUT ================= */
    socket.on("crash_cashout", async ({ betSlot }) => {
      await engine.cashout(userId, betSlot);
    });


    /* ================= STATE SYNC ================= */
    socket.emit("state_sync", {
      phase:
        engine.state === "WAITING"
          ? "WAITING"
          : engine.state === "FLYING"
          ? "FLYING"
          : "CRASHED",
      multiplier: engine.multiplier,
    });

    /* ================= CLEANUP ================= */
    socket.on("disconnect", () => {
      console.log("❌ Crash disconnected", socket.id);
    });
  });
}
