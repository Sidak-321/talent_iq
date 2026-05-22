import http from "node:http";
import { executeCode, validateExecutionRequest } from "./services/execution.service.js";

const PORT = Number(process.env.COMPILER_PORT || 7000);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN || "http://localhost:5173",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

async function parseJsonBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
    if (body.length > 150_000) {
      throw new Error("Request body is too large.");
    }
  }

  return body ? JSON.parse(body) : {};
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      success: true,
      service: "TalentIQ Compiler Service"
    });
    return;
  }

  if (req.method !== "POST" || req.url !== "/execute") {
    sendJson(res, 404, {
      success: false,
      error: "Route not found."
    });
    return;
  }

  try {
    const payload = await parseJsonBody(req);
    const validationError = validateExecutionRequest(payload);

    if (validationError) {
      sendJson(res, 400, {
        success: false,
        type: "validation_error",
        output: "",
        error: validationError
      });
      return;
    }

    const result = await executeCode(payload);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      type: "internal_error",
      output: "",
      error: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`Compiler service running on port ${PORT}`);
});
