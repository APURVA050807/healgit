import { useState, useEffect } from "react";

export default function App() {
  const [data, setData] = useState({
    stats: { totalScans: 0, bugsHealed: 0, autoHealedFiles: 0, cleanFiles: 0, rollbacks: 0 },
    logs: [],
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard");
      const json = await res.json();
      setData(json);
      if (json.logs.length > 0 && !selectedLog) {
        setSelectedLog(json.logs[0]);
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const triggerManualHeal = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:4000/api/heal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: "test-buggy.js" }),
      });
      await fetchDashboard();
    } catch (err) {
      alert("Make sure backend server (node server.js) is running on port 4000!");
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "26px" }}>🛡️</span>
          <div>
            <h1 style={styles.title}>HealGit AI</h1>
            <p style={styles.subtitle}>Neuro-Symbolic Code Verification & Self-Healing Engine</p>
          </div>
        </div>
        <button onClick={triggerManualHeal} disabled={loading} style={styles.button}>
          {loading ? "🔄 Running Verification Loop..." : "⚡ Scan & Heal test-buggy.js"}
        </button>
      </header>

      {/* Top Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Verification Runs</span>
          <span style={styles.statValue}>{data.stats.totalScans}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Hallucinations & Bugs Caught</span>
          <span style={{ ...styles.statValue, color: "#f87171" }}>{data.stats.bugsHealed}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Files Auto-Healed by AI</span>
          <span style={{ ...styles.statValue, color: "#4ade80" }}>{data.stats.autoHealedFiles}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Zero-Token Clean Passes</span>
          <span style={{ ...styles.statValue, color: "#60a5fa" }}>{data.stats.cleanFiles}</span>
        </div>
      </div>

      {/* Activity Heatmap Strip */}
      <div style={styles.heatmapBox}>
        <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>
          📊 Verification Activity Pulse (Recent Runs):
        </span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
          {data.logs.slice(0, 30).map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              title={`${log.fileName}: ${log.status} (${new Date(log.timestamp).toLocaleTimeString()})`}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor:
                  log.status === "Auto-Healed"
                    ? "#22c55e"
                    : log.status === "Verified Clean"
                    ? "#3b82f6"
                    : "#ef4444",
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Split View: Run History + Side-by-Side Diff Viewer */}
      <div style={styles.mainGrid}>
        {/* Left Column: Audit Log List */}
        <div style={styles.sidebar}>
          <h3 style={styles.sectionTitle}>Audit Log History</h3>
          {data.logs.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              No logs yet. Click the top button to run a scan!
            </p>
          ) : (
            data.logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                style={{
                  ...styles.logItem,
                  borderColor: selectedLog?.id === log.id ? "#3b82f6" : "#1e293b",
                  backgroundColor: selectedLog?.id === log.id ? "#1e293b" : "#0f172a",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#f8fafc" }}>{log.fileName}</strong>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor:
                        log.status === "Auto-Healed"
                          ? "rgba(34, 197, 94, 0.15)"
                          : log.status === "Verified Clean"
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      color:
                        log.status === "Auto-Healed"
                          ? "#4ade80"
                          : log.status === "Verified Clean"
                          ? "#60a5fa"
                          : "#f87171",
                    }}
                  >
                    {log.status}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "6px 0 4px" }}>
                  {log.explanation}
                </p>
                <small style={{ fontSize: "11px", color: "#64748b" }}>
                  {new Date(log.timestamp).toLocaleString()} • {log.errorCount} bug(s) •{" "}
                  {log.attemptsUsed} AI cycle(s)
                </small>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Detailed Inspector & Code Diff */}
        <div style={styles.inspector}>
          {selectedLog ? (
            <>
              <div style={styles.inspectorHeader}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
                    Inspection Report: {selectedLog.fileName}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                    <strong>AI Action Summary:</strong> {selectedLog.explanation}
                  </p>
                </div>
              </div>

              {/* Deterministic Compiler Errors Caught */}
              {selectedLog.errors && selectedLog.errors.length > 0 && (
                <div style={styles.errorBox}>
                  <strong style={{ color: "#fca5a5", fontSize: "13px" }}>
                    🚨 Deterministic AST / ESLint Errors Caught on Cycle 1:
                  </strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", fontSize: "13px", color: "#fecaca" }}>
                    {selectedLog.errors.map((err, idx) => (
                      <li key={idx}>
                        Line {err.line}, Col {err.column}: {err.message} (<code>{err.ruleId}</code>)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side-by-Side Before & After Code Comparison */}
              <div style={styles.diffGrid}>
                <div style={styles.codePanel}>
                  <div style={{ ...styles.codeHeader, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>
                    ❌ Original Code (Before Verification)
                  </div>
                  <pre style={styles.pre}>{selectedLog.brokenCode}</pre>
                </div>

                <div style={styles.codePanel}>
                  <div style={{ ...styles.codeHeader, backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#86efac" }}>
                    ✅ Verified Code (After Neuro-Symbolic Loop)
                  </div>
                  <pre style={styles.pre}>{selectedLog.healedCode}</pre>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: "#64748b" }}>Select a run from the left panel to inspect the code diff.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#020617",
    color: "#e2e8f0",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "24px 32px",
    boxSizing: "border-box",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#f8fafc" },
  subtitle: { margin: "2px 0 0", fontSize: "13px", color: "#94a3b8" },
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },
  statCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statLabel: { fontSize: "13px", color: "#94a3b8" },
  statValue: { fontSize: "28px", fontWeight: 700, color: "#f8fafc" },
  heatmapBox: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "14px 20px",
    marginBottom: "24px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  sidebar: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionTitle: { margin: "0 0 8px", fontSize: "15px", color: "#f8fafc" },
  logItem: {
    border: "1px solid #1e293b",
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
  },
  badge: {
    fontSize: "11px",
    padding: "3px 8px",
    borderRadius: "999px",
    fontWeight: 600,
  },
  inspector: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "20px",
  },
  inspectorHeader: {
    borderBottom: "1px solid #1e293b",
    paddingBottom: "14px",
    marginBottom: "16px",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
  },
  diffGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  codePanel: {
    backgroundColor: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    overflow: "hidden",
  },
  codeHeader: {
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 600,
  },
  pre: {
    margin: 0,
    padding: "14px",
    fontSize: "12.5px",
    lineHeight: "1.5",
    overflowX: "auto",
    color: "#e2e8f0",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
};