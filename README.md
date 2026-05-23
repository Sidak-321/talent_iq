# 🧠 TalentIQ

A real-time collaborative coding interview platform where interviewers and candidates can write, run, and evaluate code together — live.

🌐 **Live Demo**: [talent-iq-blond-kappa.vercel.app](https://talent-iq-blond-kappa.vercel.app)
> ⚠️ Code execution requires Docker running locally

---

## ✨ Features

- 💻 **In-browser Code Editor** — powered by Monaco Editor (same as VS Code)
- 🤝 **Real-time Collaboration** — multiple users edit code simultaneously using Yjs
- ⚡ **Live Code Execution** — run JavaScript, Python, and C++ securely in isolated Docker containers
- 🔐 **Authentication** — JWT-based login & signup with bcrypt-encrypted passwords
- 🔄 **Real-time Communication** — Socket.io for live events between client and server
- 📹 **Video Calling** — WebRTC peer-to-peer video/audio with no third-party dependencies
- 📋 **Interviewer Evaluation** — private notes, rating rubric, and downloadable assessment report

---

## 🏗️ Architecture

```
┌─────────────┐        ┌─────────────┐        ┌──────────────────┐
│   Client    │◄──────►│   Server    │───────►│ Compiler Service │
│  (Vite +    │        │ (Express +  │◄───────│  (Docker sandbox)│
│   React)    │        │  Socket.io) │        └──────────────────┘
└─────────────┘        └──────┬──────┘          spins up a fresh
  submits code                │                 container per run
  gets result          ┌──────▼──────┐
                       │   MongoDB   │
                       └─────────────┘
```

> Client never talks to the compiler service directly. It sends code to the **Server**, which forwards it to the **Compiler Service**, gets the output, and sends it back to the Client.

The project is split into 3 independent services:

| Service | Description |
|---|---|
| `client/` | Frontend — code editor UI |
| `server/` | Backend — auth, rooms, real-time events |
| `compiler_service/` | Isolated code execution via Docker |

---

## 🛠️ Tech Stack

### Frontend
- **Vite** — build tool
- **Monaco Editor** (`@monaco-editor/react`) — VS Code-grade code editor
- **Socket.io Client** — real-time events
- **WebRTC** — peer-to-peer video & audio calling
- **Yjs** — CRDT-based real-time collaborative editing
- **Tailwind CSS v4** — styling

### Backend
- **Node.js + Express v5** — REST API
- **MongoDB + Mongoose** — database
- **Socket.io** — real-time bi-directional communication
- **Yjs + y-websocket** — real-time collaborative editing sync
- **JWT + bcrypt** — authentication & password security
- **dotenv, cors, cookie-parser** — standard middleware

### Compiler Service
- **Docker** — spins up a fresh isolated container per code submission
- Supports **JavaScript**, **Python**, and **C++**

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Docker (must be running for code execution)

### 1. Clone the repo

```bash
git clone https://github.com/Sidak-321/talent_iq.git
cd talent_iq
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev
```

### 3. Setup the Client

```bash
cd client
npm install
```

Create a `.env` file in `/client`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_YJS_WS_URL=ws://localhost:1234
```

```bash
npm run dev
```

### 4. Setup the Compiler Service

Make sure Docker is running. The compiler service spins up a **fresh Docker container per submission** — fully isolated and destroyed after execution.

First, pull the required Docker images:

```bash
docker pull node:18-alpine       # JavaScript
docker pull python:3.11-alpine   # Python
docker pull gcc:13               # C++
```

Then start the compiler service:

```bash
cd compiler_service
npm install
npm run dev
```

> ⚠️ Docker must be running in the background for code execution to work.
> ⏱️ Each submission takes ~3–5s due to container spin-up — this is by design for security.

### 5. Start Yjs WebSocket Server

```bash
cd server
npm run yjs-server
```

---

## 📁 Project Structure

```
talent_iq/
├── client/              # Frontend
│   ├── src/
│   │   ├── components/  # UI components (Editor, CallRoom, etc.)
│   │   ├── pages/       # Route pages
│   │   └── stores/      # State management
│   └── package.json
├── server/              # Backend
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Auth middleware
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── sockets/     # Socket.io + WebRTC signaling
│   │   └── app.js       # Entry point
│   └── package.json
├── compiler_service/    # Code execution service
│   ├── src/
│   └── Dockerfile
└── .gitignore
```

---

## 🔒 Security

- Every code submission runs in a **freshly created Docker container** destroyed after execution — no state shared between runs, host system never exposed
- Passwords hashed with **bcrypt**
- Auth via **JWT access + refresh tokens** stored in HTTP-only cookies
- CORS restricted to frontend origin only

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT
