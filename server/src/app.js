import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import http from "http";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import executeRoutes from "./routes/executeRoutes.js";

import initializeSocket from "./sockets/index.js";

dotenv.config();

connectDB();

const app = express();


// MIDDLEWARE
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());


// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/execute", executeRoutes);


// TEST ROUTE
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TalentIQ API Running"
    });
});


// CREATE HTTP SERVER
const server = http.createServer(app);


// INITIALIZE SOCKET
initializeSocket(server);



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
