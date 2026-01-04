import { Server } from "socket.io";

let io;

export function getIO(server) {
  if (!io) {
    io = new Server(server, {
      cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
      console.log("User Connected:", socket.id);

      socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit("player-joined", socket.id);
      });

      socket.on("player-move", ({ roomId, move }) => {
        socket.to(roomId).emit("update-state", move);
      });

      socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
      });
    });
  }

  return io;
}
