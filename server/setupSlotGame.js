import SlotEngine from "./casino-games/slot.js";

export function setupSlot(io) {
  const engine = new SlotEngine(io);

  io.on("connection", (socket) => {
    console.log("🎰 Slot connected:", socket.id);

    let userId = null;

    /* ================= JOIN ================= */
    socket.on("slot_join", ({ userId: uid }) => {
      userId = uid;
      socket.join(`slot_${userId}`);
      socket.emit("slot_config", engine.getStats());
      console.log(`🎰 User ${userId} joined slot`);
    });

    /* ================= SPIN ================= */
    socket.on("slot_spin", async ({ betAmount }) => {
      if (!userId) {
        socket.emit("slot_error", { message: "Not authenticated" });
        return;
      }

      try {
        await engine.processSpin(userId, betAmount, socket);
        socket.emit("slot_spin_started", { betAmount });
      } catch (err) {
        socket.emit("slot_error", { message: err.message });
      }
    });

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
      console.log("🎰 Slot disconnected:", socket.id);
    });
  });

  return engine;
}