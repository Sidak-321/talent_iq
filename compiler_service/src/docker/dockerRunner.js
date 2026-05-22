import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = Number(process.env.EXECUTION_TIMEOUT_MS || 5000);

function normalizeDockerMountPath(directory) {
  return directory.replace(/\\/g, "/");
}

function isDockerInfrastructureError(stderr) {
  return /docker API|docker daemon|Cannot connect to the Docker daemon|image operating system|pull access denied|not found/i.test(stderr);
}

export function runInDocker({
  image,
  command,
  workdir,
  input = "",
  timeoutMs = DEFAULT_TIMEOUT_MS
}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let settled = false;
    let timedOut = false;
    let stdout = "";
    let stderr = "";

    const args = [
      "run",
      "--rm",
      "-i",
      "--network=none",
      "--memory=256m",
      "--cpus=0.5",
      "--pids-limit=128",
      "--cap-drop=ALL",
      "--security-opt",
      "no-new-privileges",
      "--tmpfs",
      "/tmp:rw,exec,size=64m",
      "-v",
      `${normalizeDockerMountPath(workdir)}:/workspace:ro`,
      "-w",
      "/workspace",
      image,
      ...command
    ];

    const child = spawn("docker", args, {
      windowsHide: true
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        success: false,
        type: "internal_error",
        output: stdout,
        error: error.message,
        executionTime: Date.now() - startedAt
      });
    });

    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (timedOut) {
        resolve({
          success: false,
          type: "timeout",
          output: stdout,
          error: "Time Limit Exceeded",
          executionTime: Date.now() - startedAt
        });
        return;
      }

      resolve({
        success: exitCode === 0,
        type: exitCode === 0
          ? "success"
          : isDockerInfrastructureError(stderr)
            ? "internal_error"
            : "runtime_error",
        output: stdout,
        error: stderr,
        executionTime: Date.now() - startedAt
      });
    });

    if (input) {
      child.stdin.write(input);
      if (!input.endsWith("\n")) {
        child.stdin.write("\n");
      }
    }

    child.stdin.end();
  });
}
