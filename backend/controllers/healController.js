const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");
const { scanFile } = require("./scanController");
const { saveHealLog } = require("./logController");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function safeParseJson(rawText) {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function healFile(filePath, maxAttempts = 3) {
  const startTotal = Date.now();
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, "..", filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`[ERROR] File not found at ${absolutePath}`);
    return null;
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("[CRITICAL] GEMINI_API_KEY is missing from backend/.env!");
  }

  const originalCode = fs.readFileSync(absolutePath, "utf-8");
  let attempt = 1;
  let initialErrors = [];
  let lastExplanation = "All 4 checks passed (Syntax, Imports, Secrets, Runtime).";
  let lastApiError = null;

  while (attempt <= maxAttempts) {
    console.log(`\n--- Verification Cycle ${attempt} of ${maxAttempts} ---`);
    const scanResult = await scanFile(absolutePath);

    if (attempt === 1 && !scanResult.passed) {
      initialErrors = scanResult.errors;
    }

    if (scanResult.passed) {
      console.log(`[PASS] ${path.basename(absolutePath)} verified clean on cycle ${attempt}!`);
      const finalReport = {
        fileName: path.basename(absolutePath),
        filePath: absolutePath,
        healed: true,
        hadBugs: attempt > 1,
        attemptsUsed: attempt - 1,
        durationMs: Date.now() - startTotal,
        initialErrors,
        explanation: lastExplanation,
        brokenCode: originalCode,
        healedCode: fs.readFileSync(absolutePath, "utf-8"),
      };
      return saveHealLog(finalReport);
    }

    const prompt = `You are a deterministic JavaScript code repair engine.
Fix the broken JavaScript file below so that every listed error is resolved and the file runs cleanly in Node.js without crashing.

STRICT RULES:
1. If a function or variable is undefined (no-undef), define a working helper function at the top of the file that returns a sensible value.
2. If unreachable code exists (no-unreachable), move the unreachable statement BEFORE the return statement.
3. If a hardcoded secret or API key is flagged (security/no-hardcoded-secrets), replace the string literal with: process.env.SECRET_KEY || "safe_fallback"
4. If a runtime crash occurred (runtime/crash), add optional chaining (?.) and fallback values so it never throws TypeError on null/undefined.
5. Return ONLY a valid JSON object with these exact keys:
{
  "explanation": "1-sentence summary of what you fixed",
  "fixedCode": "The complete, valid JavaScript code"
}

BROKEN CODE:
${scanResult.code}

ERRORS TO FIX:
${JSON.stringify(scanResult.errors, null, 2)}`;

    try {
      const cycleStart = Date.now();
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          thinkingConfig: {
            thinkingLevel: "LOW",
          },
        },
      });

      const elapsed = ((Date.now() - cycleStart) / 1000).toFixed(1);
      const resultJson = safeParseJson(response.text);

      if (resultJson && resultJson.fixedCode) {
        lastExplanation = resultJson.explanation || "Fixed detected code issues.";
        console.log(`[AI FIX APPLIED in ${elapsed}s] ${lastExplanation}`);
        fs.writeFileSync(absolutePath, resultJson.fixedCode, "utf-8");
      }
    } catch (apiError) {
      lastApiError = apiError.message;
      console.error(`[API ERROR on Attempt ${attempt}]:`, apiError.message);
    }

    attempt++;
  }

  const finalCheck = await scanFile(absolutePath);
  if (finalCheck.passed) {
    const finalReport = {
      fileName: path.basename(absolutePath),
      filePath: absolutePath,
      healed: true,
      hadBugs: true,
      attemptsUsed: maxAttempts,
      durationMs: Date.now() - startTotal,
      initialErrors,
      explanation: lastExplanation,
      brokenCode: originalCode,
      healedCode: fs.readFileSync(absolutePath, "utf-8"),
    };
    return saveHealLog(finalReport);
  }

  fs.writeFileSync(absolutePath, originalCode, "utf-8");

  const failedReport = {
    fileName: path.basename(absolutePath),
    filePath: absolutePath,
    healed: false,
    hadBugs: true,
    attemptsUsed: maxAttempts,
    durationMs: Date.now() - startTotal,
    initialErrors,
    explanation: lastApiError
      ? `AI API Error: ${lastApiError}`
      : "Could not verify a clean fix after 3 attempts. Restored original code.",
    brokenCode: originalCode,
    healedCode: originalCode,
  };
  return saveHealLog(failedReport);
}

module.exports = { healFile };