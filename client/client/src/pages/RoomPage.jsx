import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import CodeEditor from "../components/CodeEditor";
import CallRoom from "../components/call/CallRoom";
import { DEFAULT_QUESTIONS } from "../constants/defaultQuestions";
import { useUserStore } from "../stores/userStore";
import { 
  Play, Copy, Check, LogOut, ArrowLeft, RefreshCw, BookOpen, 
  Video, ClipboardList, Send, Settings, User, Award, Download, 
  Plus, ChevronRight, X, Terminal, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

export default function RoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, checkAuth } = useUserStore();

  const role = searchParams.get("role") || "interviewee";
  const username = searchParams.get("username") || (role === "interviewer" ? "Interviewer" : "Candidate");
  const initialQId = searchParams.get("qId") || "two-sum";
  const sessionTitle = searchParams.get("title") || "Technical Interview";
  const candName = searchParams.get("cand") || "Candidate";

  // Socket and Yjs refs
  const socketRef = useRef(null);
  const ytextRef = useRef(null);

  // States
  const [activeTab, setActiveTab] = useState("question"); // "question" | "call" | "notes"
  const [currentQuestion, setCurrentQuestion] = useState(
    DEFAULT_QUESTIONS.find(q => q.id === initialQId) || DEFAULT_QUESTIONS[0]
  );
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [executionResult, setExecutionResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [peerIsRunning, setPeerIsRunning] = useState(false);
  const [peerExecutor, setPeerExecutor] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  
  // Room state
  const [copied, setCopied] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  // Interviewer private states
  const [interviewerNotes, setInterviewerNotes] = useState("");
  const [ratings, setRatings] = useState({
    coding: 5,
    problemSolving: 5,
    communication: 5,
    systemDesign: 5
  });

  // Modal States
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom question form states
  const [customTitle, setCustomTitle] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState("Medium");
  const [customCategory, setCustomCategory] = useState("Algorithms");
  const [customDescription, setCustomDescription] = useState("");
  const [customExamples, setCustomExamples] = useState("");
  const [customJSStarter, setCustomJSStarter] = useState("");
  const [customPyStarter, setCustomPyStarter] = useState("");
  const [customCppStarter, setCustomCppStarter] = useState("");

  // Initialize socket connection
  useEffect(() => {
    checkAuth();
    
    // Connect socket
    const socket = io(SOCKET_URL, {
      withCredentials: true
    });
    socketRef.current = socket;

    socket.emit("join-room", { roomId, username });

    // Listeners
    socket.on("room-users", ({ users }) => {
      setActiveUsers(users);
    });

    socket.on("user-joined", ({ username: joinedUser }) => {
      // Notification could go here
    });

    socket.on("receive-question", (question) => {
      setCurrentQuestion(question);
    });

    socket.on("receive-language", (lang) => {
      setLanguage(lang);
    });

    socket.on("receive-execution-status", ({ isRunning: peerRunning, executor }) => {
      setPeerIsRunning(peerRunning);
      setPeerExecutor(executor);
    });

    socket.on("session-ended", () => {
      setIsSessionEnded(true);
    });

    return () => {
      socket.emit("leave-room", { roomId, username });
      socket.disconnect();
    };
  }, [roomId, username, checkAuth]);

  // Sync initial question to room if interviewer
  useEffect(() => {
    if (role === "interviewer" && socketRef.current) {
      socketRef.current.emit("question-update", { roomId, question: currentQuestion });
    }
  }, [roomId, role]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (socketRef.current) {
      socketRef.current.emit("language-update", { roomId, language: newLang });
    }
  };

  const handleEditorMount = (editor, ytext) => {
    ytextRef.current = ytext;
    
    // If the editor is currently empty and we are the interviewer, let's load starter code
    setTimeout(() => {
      if (ytext && ytext.toString().trim() === "" && role === "interviewer") {
        const starter = currentQuestion.starterCode[language] || "";
        ytext.insert(0, starter);
      }
    }, 1000);
  };

  const handlePushStarterCode = () => {
    const ytext = ytextRef.current;
    if (!ytext) return;
    const starter = currentQuestion.starterCode[language] || "";
    
    // Clear and insert starter
    ytext.delete(0, ytext.length);
    ytext.insert(0, starter);
  };

  const handleSelectPredefinedQuestion = (q) => {
    setCurrentQuestion(q);
    if (socketRef.current) {
      socketRef.current.emit("question-update", { roomId, question: q });
    }
    setShowQuestionModal(false);

    // Push new starter code
    setTimeout(() => {
      const ytext = ytextRef.current;
      if (ytext) {
        const starter = q.starterCode[language] || "";
        ytext.delete(0, ytext.length);
        ytext.insert(0, starter);
      }
    }, 100);
  };

  const handleCreateCustomQuestion = (e) => {
    e.preventDefault();
    if (!customTitle || !customDescription) return;

    const newQuestion = {
      id: `custom-${Date.now()}`,
      title: customTitle,
      difficulty: customDifficulty,
      category: customCategory,
      description: customDescription,
      examples: customExamples,
      starterCode: {
        javascript: customJSStarter || `function solution() {\n    // write code\n}`,
        python: customPyStarter || `def solution():\n    # write code\n    pass`,
        cpp: customCppStarter || `void solution() {\n    // write code\n}`
      }
    };

    setCurrentQuestion(newQuestion);
    if (socketRef.current) {
      socketRef.current.emit("question-update", { roomId, question: newQuestion });
    }

    // Reset editor
    setTimeout(() => {
      const ytext = ytextRef.current;
      if (ytext) {
        const starter = newQuestion.starterCode[language] || "";
        ytext.delete(0, ytext.length);
        ytext.insert(0, starter);
      }
    }, 100);

    // Reset custom form inputs
    setCustomTitle("");
    setCustomDescription("");
    setCustomExamples("");
    setCustomJSStarter("");
    setCustomPyStarter("");
    setCustomCppStarter("");
    setShowCustomForm(false);
    setShowQuestionModal(false);
  };

  const runCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);

    if (socketRef.current) {
      socketRef.current.emit("execution-status", { roomId, isRunning: true, executor: username });
    }

    try {
      const response = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language,
          code,
          input
        })
      });

      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        type: "network_error",
        output: "",
        error: error.message
      });
    } finally {
      setIsRunning(false);
      if (socketRef.current) {
        socketRef.current.emit("execution-status", { roomId, isRunning: false, executor: username });
      }
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = () => {
    if (socketRef.current) {
      socketRef.current.emit("session-ended", { roomId });
    }
    setIsSessionEnded(true);
  };

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: Number(value) }));
  };

  const downloadSummaryReport = () => {
    const totalScore = Object.values(ratings).reduce((a, b) => a + b, 0);
    const avgScore = (totalScore / Object.keys(ratings).length).toFixed(1);

    const report = `=========================================
TALENTIQ INTERVIEW ASSESSMENT REPORT
=========================================
Room Code      : ${roomId}
Session Title  : ${sessionTitle}
Date           : ${new Date().toLocaleDateString()}
Candidate Name : ${candName}

-----------------------------------------
QUESTION DETAILS
-----------------------------------------
Title      : ${currentQuestion.title}
Difficulty : ${currentQuestion.difficulty}
Category   : ${currentQuestion.category}

-----------------------------------------
CANDIDATE ASSESSMENT SCORES
-----------------------------------------
Coding Skills      : ${ratings.coding} / 10
Problem Solving    : ${ratings.problemSolving} / 10
Communication      : ${ratings.communication} / 10
System Architecture: ${ratings.systemDesign} / 10
-----------------------------------------
AVERAGE RATING     : ${avgScore} / 10

-----------------------------------------
INTERVIEWER NOTES & FEEDBACK
-----------------------------------------
${interviewerNotes || "No feedback notes recorded."}

-----------------------------------------
FINAL CANDIDATE CODE
-----------------------------------------
Language: ${language}

${code}

=========================================
End of Report
=========================================`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TalentIQ_Assessment_${candName.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-[#09090b] text-gray-200 flex flex-col font-sans overflow-hidden">
      
      {/* TOPBAR HEADER */}
      <header className="h-14 border-b border-[#222226] bg-[#0c0c0f] px-6 flex items-center justify-between z-10 shrink-0">
        
        {/* Left Info */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/40 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              {sessionTitle}
              <span className="text-xs font-normal text-gray-500">•</span>
              <span className="text-xs text-gray-400 font-medium bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">
                Candidate: {candName}
              </span>
            </h1>
          </div>
        </div>

        {/* Middle Info (Room Code) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#131316] border border-[#27272a] rounded-lg p-1 pr-2 gap-2 text-xs">
            <span className="bg-[#27272a] text-gray-300 font-semibold px-2 py-1 rounded text-[10px] uppercase font-mono">
              Room Code
            </span>
            <span className="text-white font-mono tracking-wider font-semibold">{roomId}</span>
            <button 
              onClick={handleCopyRoomCode}
              className="p-1 text-gray-400 hover:text-indigo-400 rounded hover:bg-gray-800 transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20 text-[10px] font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span>LIVE</span>
          </div>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#131316] px-2 py-1 rounded-md border border-[#27272a]">
            <User size={12} />
            <span>{activeUsers.length} Active</span>
          </div>

          {role === "interviewer" ? (
            <button 
              onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut size={13} />
              End Session
            </button>
          ) : (
            <button 
              onClick={() => navigate("/")}
              className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut size={13} />
              Leave Room
            </button>
          )}
        </div>

      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* LEFT WORKSPACE PANELS */}
        <div className="w-[42%] border-r border-[#222226] bg-[#0c0c0f] flex flex-col min-h-0">
          
          {/* TAB SELECTOR */}
          <div className="h-11 border-b border-[#222226] flex px-4 gap-1 items-center bg-[#09090b]">
            <button 
              onClick={() => setActiveTab("question")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "question" ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/25" : "text-gray-400 hover:text-white"
              }`}
            >
              <BookOpen size={13} />
              Problem
            </button>

            <button 
              onClick={() => setActiveTab("call")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "call" ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/25" : "text-gray-400 hover:text-white"
              }`}
            >
              <Video size={13} />
              Video Call
            </button>

            {role === "interviewer" && (
              <button 
                onClick={() => setActiveTab("notes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "notes" ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/25" : "text-gray-400 hover:text-white"
                }`}
              >
                <ClipboardList size={13} />
                Private Evaluation
              </button>
            )}
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            
            {activeTab === "question" && (
              <div className="space-y-6">
                
                {/* Title & Controls */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        currentQuestion.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        currentQuestion.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {currentQuestion.category}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{currentQuestion.title}</h2>
                  </div>

                  {role === "interviewer" && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowQuestionModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <Settings size={13} />
                        Change Question
                      </button>

                      <button 
                        onClick={handlePushStarterCode}
                        className="bg-[#1f1f23] hover:bg-[#2b2b30] text-gray-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 border border-[#2e2e34]"
                        title="Reset code editor with standard template for this question"
                      >
                        <RefreshCw size={13} />
                        Reset Starter
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed border-t border-[#222226] pt-5">
                  <p className="whitespace-pre-wrap">{currentQuestion.description}</p>
                </div>

                {/* Examples */}
                {currentQuestion.examples && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Examples</h3>
                    <pre className="bg-[#0f0f13] border border-[#222226] p-4 rounded-xl text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                      {currentQuestion.examples}
                    </pre>
                  </div>
                )}

              </div>
            )}

            {activeTab === "call" && (
              <div className="h-full flex flex-col">
                <CallRoom 
                  socket={socketRef.current} 
                  roomId={roomId} 
                  username={username} 
                />
              </div>
            )}

            {activeTab === "notes" && role === "interviewer" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-white text-base">Private Interviewer Assessment</h3>
                  <p className="text-xs text-gray-500 mt-1">This panel is only visible to you. These notes will not sync to the candidate.</p>
                </div>

                {/* Scoring Rubric */}
                <div className="bg-[#0f0f13] border border-[#222226] p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award size={14} className="text-indigo-400" />
                    Candidate Rubric Scores
                  </h4>

                  {/* Coding slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Coding Ability (Syntax, clean code)</span>
                      <span className="text-indigo-400">{ratings.coding} / 10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={ratings.coding} 
                      onChange={(e) => handleRatingChange("coding", e.target.value)}
                      className="w-full h-1 bg-[#222226] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Problem Solving slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Problem Solving (Logic, algorithmic approach)</span>
                      <span className="text-indigo-400">{ratings.problemSolving} / 10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={ratings.problemSolving} 
                      onChange={(e) => handleRatingChange("problemSolving", e.target.value)}
                      className="w-full h-1 bg-[#222226] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Communication slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Communication (Explaining thought process)</span>
                      <span className="text-indigo-400">{ratings.communication} / 10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={ratings.communication} 
                      onChange={(e) => handleRatingChange("communication", e.target.value)}
                      className="w-full h-1 bg-[#222226] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* System Architecture slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>System Design / Architecture</span>
                      <span className="text-indigo-400">{ratings.systemDesign} / 10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={ratings.systemDesign} 
                      onChange={(e) => handleRatingChange("systemDesign", e.target.value)}
                      className="w-full h-1 bg-[#222226] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Evaluation Notes & Feedback
                  </label>
                  <textarea
                    value={interviewerNotes}
                    onChange={(e) => setInterviewerNotes(e.target.value)}
                    placeholder="Type private candidate feedback, observations, performance notes..."
                    className="w-full h-44 bg-[#0f0f13] border border-[#222226] focus:border-indigo-500 rounded-xl p-4 text-sm text-white outline-none resize-none"
                  />
                </div>

                {/* Export Action */}
                <button
                  onClick={downloadSummaryReport}
                  className="w-full bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={16} />
                  Export Assessment Report (.txt)
                </button>

              </div>
            )}

          </div>

        </div>

        {/* RIGHT CODE EDITOR & TERMINAL */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0f0f12]">
          
          {/* EDITOR HEADER CONTROLS */}
          <div className="h-11 border-b border-[#222226] flex items-center justify-between px-6 bg-[#0c0c0f] shrink-0">
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Language:</span>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-[#17171c] border border-[#27272a] text-xs text-white rounded px-2.5 py-1 outline-none cursor-pointer font-medium"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              {peerIsRunning && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                  <span>{peerExecutor} is running code...</span>
                </div>
              )}
            </div>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800/40 text-black font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play size={12} fill="black" />
              {isRunning ? "Running..." : "Run Code"}
            </button>

          </div>

          {/* CODE EDITOR CONTAINER */}
          <div className="flex-1 min-h-0 relative">
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              roomId={roomId}
              onEditorMount={handleEditorMount}
            />
          </div>

          {/* OUTPUT CONSOLE */}
          <div className="h-[240px] border-t border-[#222226] bg-[#09090b] flex flex-col shrink-0">
            <div className="h-9 border-b border-[#222226] bg-[#0c0c0f] px-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <Terminal size={13} />
                <span>Output Console</span>
              </div>
              
              {executionResult?.executionTime !== undefined && (
                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                  {executionResult.executionTime} ms
                </span>
              )}
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap select-text">
              {isRunning ? (
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="w-2 h-2 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Executing program. Waiting for output...</span>
                </div>
              ) : executionResult ? (
                executionResult.success ? (
                  <div className="text-emerald-400">
                    {executionResult.output || "Program finished with no output (Exit code 0)."}
                  </div>
                ) : (
                  <div className="text-red-400 space-y-1">
                    <p className="font-bold">Error ({executionResult.type}):</p>
                    <p>{executionResult.error}</p>
                    {executionResult.output && (
                      <div className="mt-2 pt-2 border-t border-red-950/20 text-gray-400">
                        <p className="font-semibold text-xs mb-1">Stdout before failure:</p>
                        <pre className="text-xs bg-red-950/10 p-2 rounded">{executionResult.output}</pre>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <span className="text-gray-600">Click "Run Code" to view code execution output.</span>
              )}
            </div>

            {/* STDIN INPUT BOX */}
            <div className="h-16 border-t border-[#1a1a1f] px-5 flex items-center justify-between gap-3 bg-[#0a0a0d]">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider shrink-0">Stdin Input</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter inputs to feed into program stdin (e.g. 5, 2)"
                className="flex-1 bg-[#141417] border border-[#222226] focus:border-indigo-500 text-xs text-white rounded-lg px-3 py-2 outline-none"
              />
            </div>

          </div>

        </div>

      </div>

      {/* QUESTION SELECTION MODAL */}
      <AnimatePresence>
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#0e0e11]">
                <h3 className="font-bold text-white text-base">Select Interview Question</h3>
                <button 
                  onClick={() => {
                    setShowQuestionModal(false);
                    setShowCustomForm(false);
                  }}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              {!showCustomForm ? (
                <>
                  <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
                    {DEFAULT_QUESTIONS.map((q) => (
                      <div 
                        key={q.id}
                        onClick={() => handleSelectPredefinedQuestion(q)}
                        className={`p-4 rounded-xl border border-[#222226] bg-[#17171b]/60 hover:bg-[#1c1c22] hover:border-indigo-500/50 transition-all cursor-pointer flex justify-between items-center group ${
                          currentQuestion.id === q.id ? "border-indigo-500 bg-[#1c1c22]" : ""
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                              q.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              q.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="text-[10px] text-gray-500">{q.category}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{q.title}</h4>
                        </div>
                        <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-[#27272a] bg-[#0e0e11] flex justify-end">
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      Write Custom Question
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleCreateCustomQuestion} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Question Title</label>
                    <input 
                      type="text" required placeholder="e.g. Reverse Linked List"
                      value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-sm outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Difficulty</label>
                      <select 
                        value={customDifficulty} onChange={(e) => setCustomDifficulty(e.target.value)}
                        className="w-full bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-sm outline-none cursor-pointer"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Category</label>
                      <input 
                        type="text" placeholder="e.g. Linked List • Pointers"
                        value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Description</label>
                    <textarea 
                      required placeholder="Write question prompt, constraints, rules..."
                      value={customDescription} onChange={(e) => setCustomDescription(e.target.value)}
                      className="w-full h-24 bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-sm outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Examples (Inputs, outputs, explanation)</label>
                    <textarea 
                      placeholder="Input: head = [1,2]\nOutput: [2,1]"
                      value={customExamples} onChange={(e) => setCustomExamples(e.target.value)}
                      className="w-full h-16 bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-sm outline-none resize-none"
                    />
                  </div>

                  <div className="border-t border-[#27272a] pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Starter Templates</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-400">JavaScript Starter Code</label>
                      <textarea 
                        placeholder="function reverseList(head) {\n\n}"
                        value={customJSStarter} onChange={(e) => setCustomJSStarter(e.target.value)}
                        className="w-full h-16 bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-xs font-mono outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-400">Python Starter Code</label>
                      <textarea 
                        placeholder="def reverse_list(head):\n    pass"
                        value={customPyStarter} onChange={(e) => setCustomPyStarter(e.target.value)}
                        className="w-full h-16 bg-[#1c1c22] border border-[#27272a] rounded-lg py-2 px-3 text-white text-xs font-mono outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#27272a] bg-[#0e0e11] flex justify-between shrink-0 -mx-6 -mb-6 mt-4">
                    <button
                      type="button" onClick={() => setShowCustomForm(false)}
                      className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer"
                    >
                      Back to Presets
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer"
                    >
                      Sync & Select Question
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SESSION ENDED SUMMARY OVERLAY */}
      <AnimatePresence>
        {isSessionEnded && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-xl shadow-2xl p-8 text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                <Check size={36} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Coding Interview Finished</h2>
                <p className="text-sm text-gray-400">The session has been concluded. Thank you for using TalentIQ.</p>
              </div>

              {role === "interviewer" ? (
                <div className="border border-[#222226] bg-[#0c0c0f] p-6 rounded-xl space-y-4 text-left">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Award size={16} className="text-indigo-400" />
                    Interviewer Assessment Summary
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between border-b border-[#1f1f23] pb-1.5 text-gray-400">
                      <span>Coding Level:</span>
                      <span className="font-bold text-indigo-400">{ratings.coding} / 10</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1f1f23] pb-1.5 text-gray-400">
                      <span>Problem Solving:</span>
                      <span className="font-bold text-indigo-400">{ratings.problemSolving} / 10</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1f1f23] pb-1.5 text-gray-400">
                      <span>Communication:</span>
                      <span className="font-bold text-indigo-400">{ratings.communication} / 10</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1f1f23] pb-1.5 text-gray-400">
                      <span>System Design:</span>
                      <span className="font-bold text-indigo-400">{ratings.systemDesign} / 10</span>
                    </div>
                  </div>

                  <div className="pt-2 text-xs">
                    <p className="font-bold text-gray-400 mb-1">Feedback Notes:</p>
                    <p className="bg-[#17171b] p-3 rounded border border-[#222226] text-gray-300 font-mono text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {interviewerNotes || "No assessment notes saved."}
                    </p>
                  </div>

                  <button
                    onClick={downloadSummaryReport}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-600/10"
                  >
                    <Download size={16} />
                    Download Assessment Report (.txt)
                  </button>
                </div>
              ) : (
                <div className="bg-[#0c0c0f] border border-[#222226] p-5 rounded-xl text-left text-xs space-y-2 text-gray-400">
                  <p>Your interviewer is compiling the final feedback and will submit the assessment report to human resources.</p>
                  <p>You can close this tab now. Outstanding job today!</p>
                </div>
              )}

              <div className="pt-4 border-t border-[#222226] flex justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="bg-[#222226] hover:bg-[#3f3f46] text-white font-semibold text-xs px-6 py-2.5 rounded-lg cursor-pointer"
                >
                  Return to Lobby
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}