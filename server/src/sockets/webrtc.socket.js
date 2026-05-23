const registerWebRTCHandlers = (io, socket) => {
    socket.on("webrtc-join-room", ({ roomId, username }) => {
        const callRoomId = `webrtc:${roomId}`;
        socket.join(callRoomId);

        const clients = io.sockets.adapter.rooms.get(callRoomId) || new Set();
        const peers = [...clients].filter((socketId) => socketId !== socket.id);

        socket.emit("webrtc-users", {
            peers,
            socketId: socket.id
        });

        socket.to(callRoomId).emit("webrtc-user-joined", {
            socketId: socket.id,
            username
        });
    });

    socket.on("webrtc-offer", ({ targetSocketId, offer }) => {
        io.to(targetSocketId).emit("webrtc-offer", {
            fromSocketId: socket.id,
            offer
        });
    });

    socket.on("webrtc-answer", ({ targetSocketId, answer }) => {
        io.to(targetSocketId).emit("webrtc-answer", {
            fromSocketId: socket.id,
            answer
        });
    });

    socket.on("webrtc-ice-candidate", ({ targetSocketId, candidate }) => {
        io.to(targetSocketId).emit("webrtc-ice-candidate", {
            fromSocketId: socket.id,
            candidate
        });
    });

    socket.on("webrtc-leave-room", ({ roomId }) => {
        const callRoomId = `webrtc:${roomId}`;
        socket.to(callRoomId).emit("webrtc-user-left", {
            socketId: socket.id
        });
        socket.leave(callRoomId);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach((socketRoom) => {
            if (socketRoom.startsWith("webrtc:")) {
                socket.to(socketRoom).emit("webrtc-user-left", {
                    socketId: socket.id
                });
            }
        });
    });
};

export default registerWebRTCHandlers;
