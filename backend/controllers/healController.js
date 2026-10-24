require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const { scanFile } = require("./scanController");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function healFile(filePath, maxAttempts = 3) {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Error: File not found at ${absolutePath}`);
    return null;
  }

  // 1. SAFETY BACKUP: Save the original code before AI touches anything
  const originalCode = fs.readFileSync(absolutePath, "utf-8");
  console.log(`🛡️  Backup created in memory for ${filePath}`);

  let attempt = 1;
  let initialErrors = [];
  let lastExplanation = "No errors detected";

  // 2. THE NEURO-SYMBOLIC LOOP (Max 3 tries)
  while (attempt <= maxAttempts) {
    console.log(`\n🔄 --- Verification Cycle ${attempt} of ${maxAttempts} ---`);

    const scanResult = await scanFile(filePath);

    // Save the initial errors from Cycle 1 so we can log them to MongoDB later!
    if (attempt === 1 && !scanResult.passed) {
      initialErrors = scanResult.errors;
    }

    if (scanResult.passed) {
      console.log(`\n🎉 [SUCCESS] ${filePath} is verified clean on cycle ${attempt}!`);
      return {
        fileName: path.basename(filePath),
        healed: true,
        hadBugs: attempt > 1,
        attemptsUsed: attempt - 1,
        initialErrors,
        explanation: lastExplanation,
        brokenCode: originalCode,
        healedCode: fs.readFileSync(absolutePath, "utf-8"),
      };
    }

    console.log(`🤖 Invoking AI Repair Engine to fix ${scanResult.errors.length} deterministic error(s)...`);

    const prompt = `You are an autonomous, deterministic JavaScript code repair engine.
Fix the following JavaScript file so that all ESLint / compiler errors are resolved.

RULES:
1. If a function or variable is undefined (hallucinated), either implement its logic inline or define the missing helper function cleanly in the file based on its name and arguments.
2. If code is unreachable (e.g., after a return statement), move it before the return statement or remove it if redundant.
3. Preserve the original intent of the code.
4. Return ONLY a valid JSON object matching this exact structure:
{
  "explanation": "Brief 1-sentence summary of what you fixed",
  "fixedCode": "The complete, valid JavaScript file content"
}

BROKEN FILE CONTENT:
\`\`\`javascript
${scanResult.code}
\`\`\`

EXACT DETERMINISTIC ERRORS TO FIX:
${JSON.stringify(scanResult.errors, null, 2)}`;

    try {
      const startTime = Date.now();
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          thinkingConfig: {
            thinkingLevel: "MINIMAL", // Makes Gemini 3.8 reply in ~3-5 seconds instead of 120s!
          },
        },
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const resultJson = JSON.parse(response.text);
      lastExplanation = resultJson.explanation;
      console.log(`🛠️  AI Fix Applied in ${elapsed}s: ${resultJson.explanation}`);

      fs.writeFileSync(absolutePath, resultJson.fixedCode, "utf-8");
    } catch (apiError) {
      console.error(`⚠️ AI API Error on attempt ${attempt}:`, apiError.message);
      break;
    }

    attempt++;
  }

  // 4. Final verification after the last attempt
  const finalCheck = await scanFile(filePath);
  if (finalCheck.passed) {
    console.log(`\n🎉 [SUCCESS] ${filePath} healed and verified on final check!`);
    return {
      fileName: path.basename(filePath),
      healed: true,
      hadBugs: true,
      attemptsUsed: maxAttempts,
      initialErrors,
      explanation: lastExplanation,
      brokenCode: originalCode,
      healedCode: fs.readFileSync(absolutePath, "utf-8"),
    };
  }

  // 5. CIRCUIT BREAKER
  console.log(`\n🛑 [CIRCUIT BREAKER TRIGGERED] AI could not verify a clean fix after ${maxAttempts} attempts.`);
  console.log(`⏪ Rolling back ${filePath} to its original state to prevent corruption.`);
  fs.writeFileSync(absolutePath, originalCode, "utf-8");

  return {
    fileName: path.basename(filePath),
    healed: false,
    hadBugs: true,
    attemptsUsed: maxAttempts,
    initialErrors,
    explanation: "Circuit breaker triggered — rolled back to original code",
    brokenCode: originalCode,
    healedCode: originalCode,
  };
}

module.exports = { healFile };