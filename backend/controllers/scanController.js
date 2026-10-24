const { ESLint } = require("eslint");
const fs = require("fs");
const path = require("path");

async function scanFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);

  // 1. Check if the file actually exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Error: File not found at ${absolutePath}`);
    return null;     
  }

  // 2. Initialize our deterministic ESLint engine with strict rules
  // It catches syntax errors, undefined/hallucinated variables, and unreachable code
  const eslint = new ESLint({
    useEslintrc: false,
    overrideConfig: {
      env: { node: true, es2022: true },
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      rules: {
        "no-undef": "error",          // Catches hallucinated functions/variables
        "no-unused-vars": "warn",     // Catches dead code
        "no-unreachable": "error",    // Catches broken logic after return
        "no-constant-condition": "error"
      },
    },
  });

  // 3. Run the deterministic check on the target file
  const results = await eslint.lintFiles([absolutePath]);
  const fileResult = results[0];

  // Filter only hard errors (severity === 2)
  const errors = fileResult.messages.filter((msg) => msg.severity === 2);

  if (errors.length === 0) {
    console.log(`✅ [PASS] ${filePath} has 0 deterministic errors! No AI needed.`);
    return { passed: true, errors: [] };
  }

  console.log(`\n🚨 [FAIL] Found ${errors.length} bug(s) in ${filePath}:`);
  errors.forEach((err, index) => {
    console.log(
      `   ${index + 1}. Line ${err.line}, Col ${err.column}: ${err.message} (${err.ruleId || "syntax-error"})`
    );
  });

  return {
    passed: false,
    filePath: absolutePath,
    code: fs.readFileSync(absolutePath, "utf-8"),
    errors: errors.map((e) => ({
      line: e.line,
      column: e.column,
      message: e.message,
      ruleId: e.ruleId || "syntax-error",
    })),
  };
}

module.exports = { scanFile };