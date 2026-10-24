const { execSync } = require("child_process");
const { healFile } = require("./healController");

async function safeCommit(commitMessage) {
  console.log("🔍 Checking Git status for modified JavaScript files...");

  // 1. Make sure we are inside a real Git repository (if not, initialize one)
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch {
    console.log("📦 No Git repo found. Initializing a new Git repository...");
    execSync("git init");
  }

  // 2. Get all modified/untracked .js files (excluding node_modules)
  const statusOutput = execSync("git status --porcelain", { encoding: "utf-8" });

  const changedJsFiles = statusOutput
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.slice(3).trim())
    .filter((file) => file.endsWith(".js") && !file.includes("node_modules"));

  if (changedJsFiles.length === 0) {
    console.log("ℹ️  No modified .js files found to heal or commit.");
    return;
  }

  console.log(`📂 Found ${changedJsFiles.length} file(s) to verify before commit:`, changedJsFiles);

  // 3. Run the Neuro-Symbolic Healer on every changed file
  for (const file of changedJsFiles) {
    console.log(`\n========================================`);
    console.log(`🛡️  Verifying & Healing: ${file}`);
    console.log(`========================================`);

    const result = await healFile(file);

    if (!result || !result.healed) {
      console.error(`\n❌ [COMMIT BLOCKED] ${file} could not be verified clean.`);
      console.error(`Please inspect ${file} manually before committing.`);
      process.exit(1);
    }
  }

  // 4. All files are verified 100% clean! Stage and commit them to real Git.
  console.log(`\n✅ All files verified clean! Staging and committing to Git...`);
  execSync("git add .");
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

  const latestCommit = execSync("git log -1 --oneline", { encoding: "utf-8" }).trim();
  console.log(`🚀 [COMMIT SUCCESSFUL] ${latestCommit}`);
}

module.exports = { safeCommit };