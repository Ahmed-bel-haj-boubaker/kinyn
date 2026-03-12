const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  /* Initialize Socket.IO on the HTTP server */
  const io = new SocketIOServer(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("join-admin", (adminId) => {
      if (adminId && typeof adminId === "string") {
        socket.join(`admin:${adminId}`);
        console.log(`[Socket.IO] Admin ${adminId} joined room`);
      }
    });

    socket.on("join-admin-room", () => {
      socket.join("admin-room");
      console.log(`[Socket.IO] ${socket.id} joined admin-room`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  /* Expose io instance globally so lib/socket.ts can pick it up */
  globalThis.__socketIO = io;

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO listening on /api/socketio`);
  });
});
