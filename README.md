# 🧠 TalentIQ

A real-time collaborative coding interview platform where interviewers and candidates can write, run, and evaluate code together — live.

---

## ✨ Features

- 💻 **In-browser Code Editor** — powered by Monaco Editor (same as VS Code)
- 🤝 **Real-time Collaboration** — multiple users edit code simultaneously using Yjs
- ⚡ **Live Code Execution** — run code securely in isolated Docker containers
- 🔐 **Authentication** — JWT-based login & signup with encrypted passwords
- 🔄 **Real-time Communication** — Socket.io for live events between client and server
- 📹 **Video Calling** — WebRTC-based peer-to-peer video/audio between interviewer and candidate

---

## 🏗️ Architecture

```
┌─────────────┐        ┌─────────────┐        ┌──────────────────┐
│   Client    │◄──────►│   Server    │───────►│ Compiler Service │
│  (Vite +    │        │ (Express +  │◄───────│  (Docker sandbox)│
│  React)     │        │  Socket.io) │        └──────────────────┘
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
- **WebRTC** — peer-to-peer video & audio calling (no third-party service needed)
- **Tailwind CSS v4** — styling

### Backend
- **Node.js + Express v5** — REST API
- **MongoDB + Mongoose** — database
- **Socket.io** — real-time bi-directional communication
- **Yjs + y-websocket** — real-time collaborative editing (CRDT-based)
- **JWT + bcrypt** — authentication & password security
- **dotenv, cors, cookie-parser** — standard middleware

### Compiler Service
- **Docker** — sandboxed, secure code execution

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Docker (for compiler service)

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
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Setup the Client

```bash
cd client
npm install
npm run dev
```

### 4. Setup the Compiler Service

Make sure Docker is running. The compiler service builds a **fresh Docker container for every code submission** — each run is fully isolated and destroyed after execution.

First, pull the required Docker images for supported languages:

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
> ⏱️ First run may be slow as Docker spins up a fresh container per submission — this is by design for security.

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
│   └── package.json
├── server/              # Backend
│   ├── src/
│   │   └── app.js
│   └── package.json
├── compiler_service/    # Code execution service
│   └── Dockerfile
└── .gitignore
```

---

## 🔒 Security

- Every code submission runs in a **freshly created Docker container** that is destroyed after execution — no state is shared between runs and the host system is never exposed
- Passwords are hashed using **bcrypt**
- Auth tokens use **JWT** with expiry

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT
