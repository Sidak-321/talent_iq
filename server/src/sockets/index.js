import { Server } from "socket.io";

import registerRoomHandlers from "./room.socket.js";

const initializeSocket = (server) => {

   const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

    io.on("connection", (socket) => {

        console.log(`User Connected: ${socket.id}`);

        // register room events
        registerRoomHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`User Disconnected: ${socket.id}`);
        });

    });

    return io;
};

export default initializeSocket;