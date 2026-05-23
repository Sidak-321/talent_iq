import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOBBY / AUTH DASHBOARD */}
        <Route path="/" element={<Dashboard />} />

        {/* INTERACTIVE WORKSPACE */}
        <Route path="/room/:roomId" element={<RoomPage />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
