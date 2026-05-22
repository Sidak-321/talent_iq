# TalentIQ Compiler Service

Secure Docker-based code execution service for Phase 5.

## Run

```powershell
cd C:\Users\User\Desktop\talent_iq\compiler_service
npm run dev
```

The service runs on:

```txt
http://localhost:7000
```

## Endpoints

```txt
GET /health
POST /execute
```

Example request:

```json
{
  "language": "javascript",
  "code": "console.log('Hello TalentIQ')",
  "input": ""
}
```

Example response:

```json
{
  "language": "javascript",
  "success": true,
  "type": "success",
  "output": "Hello TalentIQ\n",
  "error": "",
  "executionTime": 320
}
```

## Supported Languages

```txt
javascript -> node:22-alpine
python     -> python:3.12-alpine
cpp        -> gcc:14.2.0
```

## Docker Security Limits

Every run creates a temporary container with:

```txt
--rm
--network=none
--memory=256m
--cpus=0.5
--pids-limit=128
--cap-drop=ALL
--security-opt no-new-privileges
```

The source directory is mounted read-only:

```txt
host temp dir -> /workspace:ro
```

For C++ compilation, the container gets an isolated temporary filesystem:

```txt
--tmpfs /tmp:rw,size=64m
```

## Interview Summary

The compiler service is intentionally separate from the main backend because user code execution is high-risk and resource-heavy. The main backend handles app logic, rooms, authentication, and proxying execution requests. The compiler service is stateless: it receives source code and stdin, writes a temporary file, runs the code in a locked-down Docker container, captures stdout/stderr, cleans up temporary files, and returns the result.

Frontend Monaco/Yjs handles collaborative editing. The compiler service handles execution only.
