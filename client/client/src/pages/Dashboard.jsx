import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/userStore";
import { DEFAULT_QUESTIONS } from "../constants/defaultQuestions";
import { LogOut, User, Key, Mail, UserPlus, Briefcase, Users, PlusCircle, ArrowRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, error, login, signup, logout, checkAuth, clearError } = useUserStore();

  // Auth form states
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");

  // Role & Room states
  const [role, setRole] = useState("interviewer"); // "interviewer" | "interviewee"
  
  // Interviewer states
  const [title, setTitle] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState(DEFAULT_QUESTIONS[0].id);

  // Interviewee states
  const [roomCode, setRoomCode] = useState("");
  const [candidateDisplayName, setCandidateDisplayName] = useState("");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      setCandidateDisplayName(user.username);
    }
  }, [user]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      await login(authEmail, authPassword);
    } else {
      await signup(authUsername, authEmail, authPassword);
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!title || !candidateName) return;

    // Generate room code: IQ-XXXXXX
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedCode = `IQ-${randomChars}`;

    // Find starter question info
    const question = DEFAULT_QUESTIONS.find(q => q.id === selectedQuestionId) || DEFAULT_QUESTIONS[0];

    // Redirect to Room with state
    navigate(`/room/${generatedCode}?role=interviewer&username=${encodeURIComponent(user.username)}&title=${encodeURIComponent(title)}&cand=${encodeURIComponent(candidateName)}&qId=${selectedQuestionId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCode) return;
    const formattedCode = roomCode.trim().toUpperCase();
    const finalName = candidateDisplayName.trim() || user?.username || "Candidate";
    navigate(`/room/${formattedCode}?role=interviewee&username=${encodeURIComponent(finalName)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // AUTHENTICATION MODE UI
  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden font-sans">
        {/* Decorative Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#131316] border border-[#27272a] rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-md"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600/10 text-indigo-400 rounded-xl mb-4 border border-indigo-500/20">
              <Briefcase size={24} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TalentIQ</h1>
            <p className="text-sm text-gray-400 mt-2">
              {isLogin ? "Sign in to access your interview portal" : "Create an account to start hosting interviews"}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300" htmlFor="username">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <User size={16} />
                  </span>
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="john_doe"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-[#1c1c21] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300" htmlFor="email">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#1c1c21] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300" htmlFor="password">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Key size={16} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#1c1c21] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center border-t border-[#27272a] pt-4">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                clearError();
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOGGED IN PORTAL / DASHBOARD
  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans relative overflow-hidden flex flex-col">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* TOPBAR */}
      <header className="h-16 border-b border-[#1f1f23] bg-[#0c0c0e]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            TalentIQ
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#141417] px-3 py-1.5 rounded-full border border-[#27272a] text-sm text-gray-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>{user.username}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* DASHBOARD HERO */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 z-10 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight"
          >
            Interview workspace lobby
          </motion.h2>
          <p className="text-gray-400 mt-2 text-base max-w-lg mx-auto">
            Choose your role to host a coding session or join an active interview room as a candidate.
          </p>
        </div>

        {/* ROLE PICKER TABS */}
        <div className="flex bg-[#121215] p-1 rounded-xl border border-[#222226] mb-8 w-full max-w-md">
          <button
            onClick={() => setRole("interviewer")}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === "interviewer"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Briefcase size={16} />
            Interviewer
          </button>
          <button
            onClick={() => setRole("interviewee")}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === "interviewee"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users size={16} />
            Interviewee
          </button>
        </div>

        {/* FORMS */}
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {role === "interviewer" ? (
              <motion.form
                key="interviewer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleCreateRoom}
                className="bg-[#0f0f12] border border-[#222226] p-8 rounded-2xl shadow-xl space-y-5"
              >
                <div className="flex items-center gap-3 border-b border-[#222226] pb-4 mb-2">
                  <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Create Coding Session</h3>
                    <p className="text-xs text-gray-500">Configure interview room parameters</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300" htmlFor="title">
                    Session Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    placeholder="e.g. Google L4 UI/UX Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2 px-3 text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300" htmlFor="candName">
                    Candidate Name
                  </label>
                  <input
                    id="candName"
                    type="text"
                    required
                    placeholder="e.g. Alexis Carter"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2 px-3 text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300" htmlFor="question">
                    Select Initial Question
                  </label>
                  <div className="relative">
                    <select
                      id="question"
                      value={selectedQuestionId}
                      onChange={(e) => setSelectedQuestionId(e.target.value)}
                      className="w-full bg-[#17171c] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2 px-3 text-white text-sm outline-none transition-colors appearance-none cursor-pointer"
                    >
                      {DEFAULT_QUESTIONS.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({q.difficulty})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                      <BookOpen size={16} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-3 text-sm transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                >
                  Create & Launch Room
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="interviewee"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleJoinRoom}
                className="bg-[#0f0f12] border border-[#222226] p-8 rounded-2xl shadow-xl space-y-5"
              >
                <div className="flex items-center gap-3 border-b border-[#222226] pb-4 mb-2">
                  <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Join Coding Room</h3>
                    <p className="text-xs text-gray-500">Enter code provided by the interviewer</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300" htmlFor="roomCode">
                    Interview Room Code
                  </label>
                  <input
                    id="roomCode"
                    type="text"
                    required
                    placeholder="e.g. IQ-AD48X2"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2.5 px-3 text-white text-sm font-mono tracking-wider outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300" htmlFor="displayName">
                    Your Name / Handle
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    placeholder={user.username}
                    value={candidateDisplayName}
                    onChange={(e) => setCandidateDisplayName(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#27272a] focus:border-indigo-500 rounded-lg py-2.5 px-3 text-white text-sm outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-3 text-sm transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                >
                  Join Active Room
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-[#121215] text-center text-xs text-gray-600 z-10">
        © 2026 TalentIQ Engineering. Powered by Yjs Collaborative Engine.
      </footer>
    </div>
  );
}
