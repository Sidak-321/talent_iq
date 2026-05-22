import express from "express";

const router = express.Router();

const COMPILER_SERVICE_URL = process.env.COMPILER_SERVICE_URL || "http://localhost:7000";

router.post("/", async (req, res) => {
  try {
    const response = await fetch(`${COMPILER_SERVICE_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    res.status(502).json({
      success: false,
      type: "compiler_unavailable",
      output: "",
      error: `Compiler service unavailable: ${error.message}`
    });
  }
});

export default router;
