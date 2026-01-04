import { getIO } from "@/lib/socket";

export const GET = async (req) => {
  if (!global._ioInitialized) {
    getIO(req.socket?.server);
    global._ioInitialized = true;
  }

  return new Response("Socket Server Running");
};
