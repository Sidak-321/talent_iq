import { useEffect, useState } from "react";

import { io } from "socket.io-client";

import CallRoom from "./components/call/CallRoom";
import CodeEditor from "./components/CodeEditor";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

const socket = io(SOCKET_URL);

function App() {

    const [code, setCode] = useState("// Start coding...");
    const [language, setLanguage] = useState("javascript");
    const [input, setInput] = useState("");
    const [executionResult, setExecutionResult] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const roomId = "room1";
    const username = "Sidak";



    // JOIN ROOM
    useEffect(() => {

        socket.emit("join-room", {
            roomId,
            username
        });

        return () => {
            socket.emit("leave-room", { roomId, username });
        };

    }, []);

    const runCode = async () => {
        setIsRunning(true);
        setExecutionResult(null);

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
        }
    };

  return (
    <div className="h-screen flex flex-col">

        {/* TOPBAR */}
        <div className="h-14 bg-[#1e1e1e] border-b border-gray-700 flex items-center gap-3 px-4">

            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#2d2d2d] text-white px-3 py-2 rounded outline-none"
            >
                <option value="javascript">
                    JavaScript
                </option>

                <option value="cpp">
                    C++
                </option>

                <option value="python">
                    Python
                </option>

            </select>

            <button
                type="button"
                onClick={runCode}
                disabled={isRunning}
                className="bg-emerald-500 disabled:bg-emerald-800 disabled:text-gray-300 text-black font-semibold px-4 py-2 rounded"
            >
                {isRunning ? "Running..." : "Run"}
            </button>

        </div>


        {/* EDITOR */}
        <div className="flex-1 grid grid-cols-[minmax(0,1fr)_360px] min-h-0">

            <CodeEditor
                code={code}
                setCode={setCode}
                language={language}
                roomId={roomId}
            />

            <aside className="bg-[#181818] border-l border-gray-700 text-white flex flex-col min-h-0 overflow-y-auto">
                <CallRoom
                    socket={socket}
                    roomId={roomId}
                    username={username}
                />

                <div className="p-4 border-b border-gray-700">
                    <label className="block text-sm text-gray-300 mb-2" htmlFor="stdin">
                        Input
                    </label>
                    <textarea
                        id="stdin"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="stdin"
                        className="w-full h-24 resize-none rounded bg-[#242424] border border-gray-700 p-3 text-sm outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="p-4 min-h-72 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-gray-200">
                            Output
                        </h2>
                        {executionResult?.executionTime !== undefined && (
                            <span className="text-xs text-gray-400">
                                {executionResult.executionTime} ms
                            </span>
                        )}
                    </div>

                    <pre className="flex-1 overflow-auto rounded bg-black border border-gray-800 p-3 text-sm whitespace-pre-wrap">
                        {isRunning
                            ? "Running code..."
                            : executionResult
                                ? executionResult.success
                                    ? executionResult.output || "Program finished with no output."
                                    : executionResult.error || "Execution failed."
                                : "Run code to see output."}
                    </pre>
                </div>
            </aside>

        </div>

    </div>
);
}


export default App;
