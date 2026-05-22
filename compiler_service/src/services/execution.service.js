import { LANGUAGE_CONFIG, SUPPORTED_LANGUAGES } from "../config/languages.js";
import { runInDocker } from "../docker/dockerRunner.js";
import {
  cleanupExecutionDir,
  createExecutionDir,
  writeSourceFile
} from "../utils/tempDir.js";

const MAX_CODE_SIZE = Number(process.env.MAX_CODE_SIZE || 100_000);
const MAX_INPUT_SIZE = Number(process.env.MAX_INPUT_SIZE || 20_000);

export function validateExecutionRequest(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body must be a JSON object.";
  }

  if (!SUPPORTED_LANGUAGES.includes(payload.language)) {
    return `Unsupported language. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}.`;
  }

  if (typeof payload.code !== "string" || payload.code.trim().length === 0) {
    return "Code is required.";
  }

  if (payload.code.length > MAX_CODE_SIZE) {
    return `Code exceeds ${MAX_CODE_SIZE} characters.`;
  }

  if (payload.input && typeof payload.input !== "string") {
    return "Input must be a string.";
  }

  if ((payload.input || "").length > MAX_INPUT_SIZE) {
    return `Input exceeds ${MAX_INPUT_SIZE} characters.`;
  }

  return null;
}

export async function executeCode({ language, code, input = "" }) {
  const config = LANGUAGE_CONFIG[language];
  let executionDir;

  try {
    executionDir = await createExecutionDir();
    await writeSourceFile(executionDir, config.fileName, code);

    const result = await runInDocker({
      image: config.image,
      command: config.command,
      workdir: executionDir,
      input,
      timeoutMs: config.timeoutMs
    });

    return {
      language,
      ...result
    };
  } finally {
    await cleanupExecutionDir(executionDir);
  }
}
