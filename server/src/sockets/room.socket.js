// store { code, version } per room
const roomCodes = new Map();

const registerRoomHandlers = (io, socket) => {

    // JOIN ROOM
    socket.on("join-room", ({ roomId, username }) => {

        socket.join(roomId);

        console.log(`${username} joined ${roomId}`);

        // notify others
        socket.to(roomId).emit("user-joined", {
            socketId: socket.id,
            username
        });

        // send room info
        const clients = io.sockets.adapter.rooms.get(roomId);

        io.to(roomId).emit("room-users", {
            users: clients ? [...clients] : []
        });

        // send current code+version for the room to the newly joined socket
        const current = roomCodes.get(roomId) || { code: "", version: 0 };
        socket.emit("receive-code", { code: current.code, version: current.version });
    });



    // LEAVE ROOM
    socket.on("leave-room", ({ roomId, username }) => {

        socket.leave(roomId);

        console.log(`${username} left ${roomId}`);

        socket.to(roomId).emit("user-left", {
            socketId: socket.id,
            username
        });

        const clients = io.sockets.adapter.rooms.get(roomId);

        io.to(roomId).emit("room-users", {
            users: clients ? [...clients] : []
        });
    });


    // CODE CHANGE with optimistic locking (versioning)
    // client should send the `version` it was based on. If it matches server's
    // version we accept and increment; otherwise we ask the client to sync.
    socket.on("code-change", ({ roomId, code, version }) => {

        const current = roomCodes.get(roomId) || { code: "", version: 0 };

        // if client's base version matches server's current version, accept
        if (typeof version === "number" && version === current.version) {
            const newVersion = current.version + 1;
            roomCodes.set(roomId, { code, version: newVersion });

            // broadcast new content+version to others in the room
            socket.to(roomId).emit("receive-code", { code, version: newVersion });

            // acknowledge sender with new version
            socket.emit("ack", { status: "ok", version: newVersion });
        } else {
            // version mismatch -> tell sender to sync to server state
            socket.emit("sync-code", { code: current.code, version: current.version });
        }
    });

};

export default registerRoomHandlers;