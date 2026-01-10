import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { getSystemWallet } from "./services/systemWallet.service.js";
import { setupCardGame } from "./cardGame.js";
import { setupLudoGame } from "./ludoGame.js"; 
import authRoutes from "./auth/auth.routes.js";
import { recoverUnfinishedMatches } from "./recovery.service.js";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use("/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// 🔥 GLOBAL SOCKET DEBUG (KEEP THIS)
io.on("connection", (socket) => {
  console.log("🌐 [GLOBAL CONNECT]", socket.id);
});

// restore games
await recoverUnfinishedMatches(io);
await getSystemWallet();

// register games
setupCardGame(io);
setupLudoGame(io); // ✅ THIS WAS MISSING

server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});
