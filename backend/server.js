const express = require("express");
const cors = require("cors");
const { getDashboardData } = require("./controllers/logController");
const { healFile } = require("./controllers/healController");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/dashboard", (req, res) => {
  try {
    const data = getDashboardData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/heal", async (req, res) => {
  try {
    const { filePath } = req.body;
    const result = await healFile(filePath || "test-buggy.js");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 HealGit Telemetry Server running on http://localhost:${PORT}`);
  console.log(`📡 Dashboard API Endpoint: http://localhost:${PORT}/api/dashboard`);
});