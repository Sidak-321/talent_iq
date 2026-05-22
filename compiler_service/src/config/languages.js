export const LANGUAGE_CONFIG = {
  javascript: {
    fileName: "main.js",
    image: "node:22-alpine",
    command: ["node", "/workspace/main.js"],
    timeoutMs: 5000
  },
  python: {
    fileName: "main.py",
    image: "python:3.12-alpine",
    command: ["python3", "/workspace/main.py"],
    timeoutMs: 5000
  },
  cpp: {
    fileName: "main.cpp",
    image: "gcc:14.2.0",
    command: [
      "sh",
      "-c",
      "g++ /workspace/main.cpp -o /main && /main"
    ],
    timeoutMs: 15000
  }
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);
