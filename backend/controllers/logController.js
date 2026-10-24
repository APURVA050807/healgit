const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../heal-logs.json");

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

function saveHealLog(logData) {
  initDB();
  const logs = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  const newEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    fileName: logData.fileName,
    status: logData.healed
      ? logData.hadBugs
        ? "Auto-Healed"
        : "Verified Clean"
      : "Circuit Breaker Rollback",
    hadBugs: logData.hadBugs,
    healed: logData.healed,
    attemptsUsed: logData.attemptsUsed,
    errorCount: logData.initialErrors ? logData.initialErrors.length : 0,
    errors: logData.initialErrors || [],
    explanation: logData.explanation,
    brokenCode: logData.brokenCode,
    healedCode: logData.healedCode,
  };

  logs.unshift(newEntry);
  fs.writeFileSync(DB_PATH, JSON.stringify(logs, null, 2), "utf-8");
  console.log(`📊 [TELEMETRY] Saved report for ${logData.fileName} to database.`);
  return newEntry;
}

function getDashboardData() {
  initDB();
  const logs = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  const totalScans = logs.length;
  const bugsHealed = logs.reduce((sum, log) => sum + (log.healed ? log.errorCount : 0), 0);
  const autoHealedFiles = logs.filter((l) => l.status === "Auto-Healed").length;
  const cleanFiles = logs.filter((l) => l.status === "Verified Clean").length;
  const rollbacks = logs.filter((l) => l.status === "Circuit Breaker Rollback").length;

  return {
    stats: {
      totalScans,
      bugsHealed,
      autoHealedFiles,
      cleanFiles,
      rollbacks,
    },
    logs,
  };
}

module.exports = { saveHealLog, getDashboardData };