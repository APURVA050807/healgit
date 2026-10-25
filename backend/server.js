const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { getDashboardData, revertLogEntry } = require("./controllers/logController");
const { healFile } = require("./controllers/healController");
const { scanFile } = require("./controllers/scanController");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 1. Get Dashboard History & Stats
app.get("/api/dashboard", (req, res) => {
  try {
    res.json(getDashboardData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List Local JS Files in Backend Workspace
app.get("/api/files", (req, res) => {
  try {
    const files = fs
      .readdirSync(__dirname)
      .filter((f) => f.endsWith(".js") && f !== "server.js" && f !== "index.js");
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Read a Specific Local File's Code
app.get("/api/file-content", (req, res) => {
  try {
    const fileName = path.basename(req.query.name || "test-buggy.js");
    const fullPath = path.join(__dirname, fileName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json({ fileName, code: fs.readFileSync(fullPath, "utf-8") });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Scan Only (Instant Check Without Modifying Code)
app.post("/api/scan-only", async (req, res) => {
  try {
    const { code, fileName } = req.body;
    const targetName = fileName ? path.basename(fileName) : "sandbox-target.js";
    const targetPath = path.join(__dirname, targetName);
    if (typeof code === "string") {
      fs.writeFileSync(targetPath, code, "utf-8");
    }
    const scanResult = await scanFile(targetPath);
    res.json(scanResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Full Auto-Heal (Save Code + Run 4-Gate Check + AI Fix Loop)
app.post("/api/sandbox", async (req, res) => {
  try {
    const { code, fileName } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required." });
    }
    const targetName = fileName ? path.basename(fileName) : "sandbox-target.js";
    const sandboxPath = path.join(__dirname, targetName);
    fs.writeFileSync(sandboxPath, code, "utf-8");

    const result = await healFile(sandboxPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Heal Local File by Name
app.post("/api/heal", async (req, res) => {
  try {
    const targetName = path.basename(req.body.filePath || "test-buggy.js");
    const result = await healFile(path.join(__dirname, targetName));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Revert File to Original Code
app.post("/api/revert/:id", (req, res) => {
  try {
    const updated = revertLogEntry(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER] HealGit API ready on http://localhost:${PORT}`);
});