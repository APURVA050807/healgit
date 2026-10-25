import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Download,
  FolderCode,
  ShieldCheck,
  Bug,
  Cpu,
  History,
  FileText,
  Scale,
  ArrowRight,
} from "lucide-react";

const EXAMPLES = [
  {
    title: "Example 1: Missing Functions & Unreachable Code",
    desc: "Common bug when ChatGPT or Cursor invents helper functions that don't exist.",
    code: `function calculateOrderTotal(subtotal, promoCode) {
  // Bug 1: This function doesn't exist anywhere in the file
  const discount = getPromoDiscount(promoCode);
  const finalAmount = subtotal - discount;

  return finalAmount;

  // Bug 2: Code placed after 'return' will never run
  console.log("Order processed for amount:", finalAmount);
}

calculateOrderTotal(1500, "SAVE20");`,
  },
  {
    title: "Example 2: Leaked API Key & Missing Formatter",
    desc: "Catches hardcoded secret keys before they get pushed to GitHub.",
    code: `function sendPaymentRequest(userId, amount) {
  // Security Risk: Hardcoded secret key in source code
  const apiKey = "AIzaSyD9283749283749283749823749823";

  // Bug: Undefined payment serializer function
  const payload = formatPaymentPayload(userId, amount, apiKey);
  return payload;
}

sendPaymentRequest("user_99", 499);`,
  },
  {
    title: "Example 3: Runtime Null Crash (TypeError)",
    desc: "Code has valid syntax, but crashes the moment you run it with null data.",
    code: `function getCustomerCity(userProfile) {
  // Crashes at runtime when address is null!
  return userProfile.address.city.toUpperCase();
}

getCustomerCity({ name: "Apurva", address: null });`,
  },
];

function Spatial3DCard({ children, style, intensity = 2.5 }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState(
    "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)"
  );

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rx = (-y * intensity).toFixed(2);
    const ry = (x * intensity).toFixed(2);
    setTransform(
      `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`
    );
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transform,
        transition: "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("workbench");
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [activeFileName, setActiveFileName] = useState("test-buggy.js");
  const [localFiles, setLocalFiles] = useState(["test-buggy.js"]);

  // idle | scanning | errors_found | healing | healed | rollback
  const [stepStatus, setStepStatus] = useState("idle");
  const [detectedErrors, setDetectedErrors] = useState([]);
  const [healResult, setHealResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [dashboard, setDashboard] = useState({
    stats: {
      totalScans: 0,
      bugsHealed: 0,
      autoHealedFiles: 0,
      cleanFiles: 0,
      secretsCaught: 0,
    },
    logs: [],
  });
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);

  const refreshData = async () => {
    try {
      const [dashRes, filesRes] = await Promise.all([
        fetch("http://localhost:4000/api/dashboard"),
        fetch("http://localhost:4000/api/files"),
      ]);
      const dashJson = await dashRes.json();
      const filesJson = await filesRes.json();
      setDashboard(dashJson);
      if (filesJson.files && filesJson.files.length > 0) {
        setLocalFiles(filesJson.files);
      }
      if (dashJson.logs && dashJson.logs.length > 0 && !selectedHistoryLog) {
        setSelectedHistoryLog(dashJson.logs[0]);
      }
    } catch (err) {
      console.error("Backend connection error:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const loadLocalFile = async (fileName) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/file-content?name=${encodeURIComponent(fileName)}`
      );
      const data = await res.json();
      if (data.code) {
        setActiveFileName(data.fileName);
        setCode(data.code);
        setDetectedErrors([]);
        setHealResult(null);
        setStepStatus("idle");
      }
    } catch {
      alert("Could not load file from backend.");
    }
  };

  const handleQuickScan = async () => {
    setStepStatus("scanning");
    setHealResult(null);
    try {
      const res = await fetch("http://localhost:4000/api/scan-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: activeFileName, code }),
      });
      const result = await res.json();
      if (result.passed) {
        setDetectedErrors([]);
        setStepStatus("healed");
        setHealResult({
          healed: true,
          status: "Verified Clean",
          explanation:
            "Your code passed all 4 checks (Syntax, Imports, Secrets, Runtime) with 0 bugs!",
          healedCode: code,
          attemptsUsed: 0,
        });
      } else {
        setDetectedErrors(result.errors || []);
        setStepStatus("errors_found");
      }
    } catch {
      alert("Make sure your backend server (node server.js) is running on port 4000.");
      setStepStatus("idle");
    }
  };

 const handleAutoHeal = async () => {
    // STEP 1: First light up Box 2 (4-Gate Check) and show the bugs immediately!
    setStepStatus("scanning");
    setHealResult(null);

    try {
      const scanRes = await fetch("http://localhost:4000/api/scan-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: activeFileName, code }),
      });
      const scanData = await scanRes.json();

      // Pause briefly (400ms) so the user's eye sees Step 2 complete
      await new Promise((r) => setTimeout(r, 400));

      if (scanData.passed) {
        setDetectedErrors([]);
        setStepStatus("healed");
        setHealResult({
          healed: true,
          status: "Verified Clean",
          explanation:
            "Your code passed all 4 checks (Syntax, Imports, Secrets, Runtime) with 0 bugs!",
          healedCode: code,
          attemptsUsed: 0,
        });
        return;
      }

      // Show the exact bugs in the left red drawer RIGHT NOW before AI starts!
      setDetectedErrors(scanData.errors || []);

      // STEP 2: Now move the highlight to Box 3 (AI Auto-Fix & Re-Verify)
      setStepStatus("healing");

      const res = await fetch("http://localhost:4000/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: activeFileName, code }),
      });
      const result = await res.json();
      setHealResult(result);
      setStepStatus(result.healed ? "healed" : "rollback");
      await refreshData();
    } catch {
      alert("Make sure your backend server (node server.js) is running on port 4000.");
      setStepStatus("idle");
    }
  };

  const handleRevert = async (logId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/revert/${logId}`, {
        method: "POST",
      });
      const reverted = await res.json();
      setCode(reverted.brokenCode);
      setHealResult(null);
      setStepStatus("idle");
      await refreshData();
    } catch {
      alert("Could not revert file.");
    }
  };

  const copyFixedCode = () => {
    if (!healResult || !healResult.healedCode) return;
    navigator.clipboard.writeText(healResult.healedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFixedCode = () => {
    if (!healResult || !healResult.healedCode) return;
    const blob = new Blob([healResult.healedCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFileName || "healed-code.js";
    a.click();
  };

  const statusBannerColor = healResult && healResult.healed ? "#10b981" : "#ef4444";
  const statusBannerBg = healResult && healResult.healed ? "#052e16" : "#450a0a";

  const step2Border =
    stepStatus === "scanning" || stepStatus === "errors_found"
      ? "#f59e0b"
      : stepStatus === "healing" || stepStatus === "healed"
      ? "#10b981"
      : "#27272a";

  const step3Border =
    stepStatus === "healing"
      ? "#f59e0b"
      : stepStatus === "healed"
      ? "#10b981"
      : stepStatus === "rollback"
      ? "#ef4444"
      : "#27272a";

  return (
    <div style={styles.app}>
      <header style={styles.navbar}>
        <div style={styles.brand}>
          <div style={styles.logoBox}>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <div>
            <span style={styles.brandTitle}>HealGit</span>
            <span style={styles.brandSubtitle}>
              Automated Code Checker & Self-Healing Workspace
            </span>
          </div>
        </div>

        <nav style={styles.navTabs}>
          <button
            onClick={() => setView("workbench")}
            style={view === "workbench" ? styles.tabActive : styles.tab}
          >
            <Cpu size={15} /> Code Healer Workspace
          </button>
          <button
            onClick={() => setView("history")}
            style={view === "history" ? styles.tabActive : styles.tab}
          >
            <History size={15} /> Past Runs & Stats ({dashboard.logs.length})
          </button>
          <button
            onClick={() => setView("privacy")}
            style={view === "privacy" ? styles.tabActive : styles.tab}
          >
            <FileText size={15} /> Privacy
          </button>
          <button
            onClick={() => setView("terms")}
            style={view === "terms" ? styles.tabActive : styles.tab}
          >
            <Scale size={15} /> Terms
          </button>
        </nav>
      </header>

      {view === "workbench" && (
        <main style={styles.container}>
          <div style={styles.stepBanner}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>1</div>
              <div>
                <div style={styles.stepTitle}>Paste Code or Pick a File</div>
                <div style={styles.stepDesc}>
                  Load a preset example below or pick a .js file from your project.
                </div>
              </div>
            </div>
            <ArrowRight size={18} color="#52525b" />
            <div
              style={{
                ...styles.stepCard,
                borderColor: step2Border,
              }}
            >
              <div
                style={{
                  ...styles.stepNumber,
                  backgroundColor: "#18181b",
                  color: "#f59e0b",
                }}
              >
                2
              </div>
              <div>
                <div style={styles.stepTitle}>4-Gate Deterministic Check</div>
                <div style={styles.stepDesc}>
                  Checks Syntax, Missing Imports, Secret Keys, and Runtime Crashes.
                </div>
              </div>
            </div>
            <ArrowRight size={18} color="#52525b" />
            <div
              style={{
                ...styles.stepCard,
                borderColor: step3Border,
              }}
            >
              <div
                style={{
                  ...styles.stepNumber,
                  backgroundColor:
                    stepStatus === "healing"
                      ? "#451a03"
                      : stepStatus === "rollback"
                      ? "#450a0a"
                      : "#052e16",
                  color:
                    stepStatus === "healing"
                      ? "#f59e0b"
                      : stepStatus === "rollback"
                      ? "#ef4444"
                      : "#10b981",
                }}
              >
                3
              </div>
              <div>
                <div style={styles.stepTitle}>AI Auto-Fix & Re-Verify</div>
                <div style={styles.stepDesc}>
                  Repairs the exact bugs and re-tests the code to guarantee it runs cleanly.
                </div>
              </div>
            </div>
          </div>

          <div style={styles.toolbar}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={styles.toolbarLabel}>Try a Bug Example:</span>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCode(ex.code);
                    setActiveFileName(`example-${i + 1}.js`);
                    setDetectedErrors([]);
                    setHealResult(null);
                    setStepStatus("idle");
                  }}
                  style={styles.secondaryBtn}
                >
                  {ex.title}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FolderCode size={15} color="#a1a1aa" />
              <span style={styles.toolbarLabel}>Or Load Project File:</span>
              <select
                value={activeFileName}
                onChange={(e) => loadLocalFile(e.target.value)}
                style={styles.selectBox}
              >
                {localFiles.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.workbenchGrid}>
            <Spatial3DCard style={styles.card3D} intensity={2.5}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>1. Input Code ({activeFileName})</span>
                  <p style={styles.cardSub}>Edit code below or click a button to check for bugs</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleQuickScan}
                    disabled={stepStatus === "scanning" || stepStatus === "healing"}
                    style={styles.scanBtn}
                  >
                    <Bug size={14} />
                    {stepStatus === "scanning" ? "Checking..." : "1. Check for Bugs"}
                  </button>
                  <button
                    onClick={handleAutoHeal}
                    disabled={stepStatus === "healing"}
                    style={styles.healBtn}
                  >
                    <Sparkles size={14} />
                    {stepStatus === "healing" ? "Healing & Verifying..." : "2. Auto-Fix My Code"}
                  </button>
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={styles.editor}
                spellCheck="false"
              />

              {detectedErrors.length > 0 && (
                <div style={styles.bugDrawer}>
                  <div style={styles.bugDrawerTitle}>
                    <AlertTriangle size={15} color="#ef4444" />
                    <span>
                      Found {detectedErrors.length} Issue(s) That Will Break Your Code:
                    </span>
                  </div>
                  <div style={styles.bugList}>
                    {detectedErrors.map((err, i) => (
                      <div key={i} style={styles.bugItem}>
                        <span style={styles.lineTag}>Line {err.line}</span>
                        <span style={styles.ruleTag}>{err.ruleId}</span>
                        <span style={{ color: "#fca5a5" }}>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Spatial3DCard>

            <Spatial3DCard style={styles.card3D} intensity={2.5}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>2. Verified & Repaired Output</span>
                  <p style={styles.cardSub}>
                    {healResult
                      ? `Completed in ${healResult.attemptsUsed} AI repair cycle(s)`
                      : "Tested against ESLint, Secret Scanner & Node Runtime"}
                  </p>
                </div>

                {healResult && healResult.healedCode && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={copyFixedCode} style={styles.secondaryBtn}>
                      {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                    <button onClick={downloadFixedCode} style={styles.secondaryBtn}>
                      <Download size={14} /> Download
                    </button>
                    {healResult.id && healResult.hadBugs && (
                      <button
                        onClick={() => handleRevert(healResult.id)}
                        style={styles.revertBtn}
                      >
                        <RotateCcw size={14} /> Undo Fix
                      </button>
                    )}
                  </div>
                )}
              </div>

              {stepStatus === "healing" ? (
                <div style={styles.emptyState}>
                  <div style={styles.pulseBox}>
                    <Cpu size={28} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: "16px", marginTop: "12px" }}>
                    Running 4-Gate Verification & AI Repair Loop...
                  </h3>
                  <p style={{ color: "#a1a1aa", fontSize: "13px", maxWidth: "380px" }}>
                    Step 1: Parsing AST & finding exact line errors...
                    <br />
                    Step 2: Generating targeted fix with Gemini...
                    <br />
                    Step 3: Running code in sandbox to confirm 0 runtime crashes...
                  </p>
                </div>
              ) : healResult ? (
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      ...styles.explanationBanner,
                      backgroundColor: statusBannerBg,
                      borderColor: statusBannerColor,
                    }}
                  >
                    <CheckCircle2 size={18} color={statusBannerColor} />
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#fafafa" }}>
                      {healResult.status}: {healResult.explanation}
                    </div>
                  </div>

                  <pre style={styles.outputCode}>{healResult.healedCode}</pre>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Play size={28} color="#52525b" />
                  <h3 style={{ fontSize: "15px", color: "#d4d4d8", marginTop: "10px" }}>
                    Ready to Check or Fix Your Code
                  </h3>
                  <p style={{ fontSize: "13px", color: "#71717a", maxWidth: "360px" }}>
                    Click <strong>1. Check for Bugs</strong> on the left to run a 0.5-second
                    diagnostic scan, or click <strong>2. Auto-Fix My Code</strong> to repair all
                    bugs automatically.
                  </p>
                </div>
              )}
            </Spatial3DCard>
          </div>
        </main>
      )}

      {view === "history" && (
        <main style={styles.container}>
          <div style={styles.statsGrid}>
            <Spatial3DCard style={styles.statBox}>
              <span style={styles.statLabel}>Total Code Scans</span>
              <span style={styles.statNum}>{dashboard.stats.totalScans}</span>
              <span style={styles.statHelp}>Saved in your project history</span>
            </Spatial3DCard>
            <Spatial3DCard style={styles.statBox}>
              <span style={styles.statLabel}>Total Bugs Fixed</span>
              <span style={{ ...styles.statNum, color: "#10b981" }}>
                {dashboard.stats.bugsHealed}
              </span>
              <span style={styles.statHelp}>Undefined functions, crashes & syntax bugs</span>
            </Spatial3DCard>
            <Spatial3DCard style={styles.statBox}>
              <span style={styles.statLabel}>Files Auto-Repaired</span>
              <span style={styles.statNum}>{dashboard.stats.autoHealedFiles}</span>
              <span style={styles.statHelp}>Verified clean on re-test</span>
            </Spatial3DCard>
            <Spatial3DCard style={styles.statBox}>
              <span style={styles.statLabel}>Secret Keys Blocked</span>
              <span style={{ ...styles.statNum, color: "#f59e0b" }}>
                {dashboard.stats.secretsCaught}
              </span>
              <span style={styles.statHelp}>Replaced hardcoded keys with process.env</span>
            </Spatial3DCard>
          </div>

          <div style={styles.historySplit}>
            <div style={styles.historyList}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Past Verification Runs</span>
              </div>
              {dashboard.logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedHistoryLog(log)}
                  style={{
                    ...styles.historyItem,
                    backgroundColor:
                      selectedHistoryLog && selectedHistoryLog.id === log.id
                        ? "#18181b"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "13px" }}>{log.fileName}</strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color:
                          log.status === "Auto-Healed"
                            ? "#10b981"
                            : log.status === "Verified Clean"
                            ? "#60a5fa"
                            : "#ef4444",
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#a1a1aa", margin: "4px 0" }}>
                    {log.explanation}
                  </p>
                  <small style={{ fontSize: "11px", color: "#71717a" }}>
                    {new Date(log.timestamp).toLocaleString()} • {log.errorCount} bug(s)
                  </small>
                </div>
              ))}
            </div>

            <div style={styles.card3D}>
              {selectedHistoryLog ? (
                <div style={{ padding: "18px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>
                    Run Details: {selectedHistoryLog.fileName}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#a1a1aa", marginBottom: "16px" }}>
                    {selectedHistoryLog.explanation}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#fca5a5", marginBottom: "6px" }}>
                        Before (Original Code)
                      </div>
                      <pre style={styles.outputCode}>{selectedHistoryLog.brokenCode}</pre>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#86efac", marginBottom: "6px" }}>
                        After (Verified Code)
                      </div>
                      <pre style={styles.outputCode}>{selectedHistoryLog.healedCode}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyState}>Select a past run on the left to compare code.</div>
              )}
            </div>
          </div>
        </main>
      )}

      {view === "privacy" && (
        <main style={styles.legalCard}>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Privacy Policy</h1>
          <p style={{ fontSize: "12px", color: "#71717a", marginBottom: "20px" }}>
            Effective Date: October 25, 2026
          </p>
          <p style={styles.legalText}>
            <strong>1. Zero-Token Local Filtering:</strong> HealGit runs static ESLint AST, import
            resolution, credential regex checks, and isolated Node.js runtime verification locally
            first. Code that passes local verification is never sent to any external AI API.
          </p>
          <p style={styles.legalText}>
            <strong>2. Automatic Secret Scrubbing:</strong> Hardcoded API keys detected during
            scanning are automatically replaced with environment variable references (process.env)
            to prevent accidental credential leaks.
          </p>
          <p style={styles.legalText}>
            <strong>3. Local Audit Storage:</strong> All run logs and file snapshots are stored
            locally in heal-logs.json so you can revert changes at any time.
          </p>
        </main>
      )}

      {view === "terms" && (
        <main style={styles.legalCard}>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Terms of Service</h1>
          <p style={{ fontSize: "12px", color: "#71717a", marginBottom: "20px" }}>
            Last Updated: October 25, 2026
          </p>
          <p style={styles.legalText}>
            <strong>1. Verification Guarantee & Scope:</strong> Every automated code repair is
            tested against syntax, dependency, security, and runtime gates before being applied. You
            remain responsible for reviewing final application logic before production deployment.
          </p>
          <p style={styles.legalText}>
            <strong>2. Automatic Rollback Protection:</strong> If an automated fix cannot pass all
            verification gates within 3 attempts, HealGit automatically restores your original file
            untouched.
          </p>
        </main>
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#09090b",
    color: "#fafafa",
    display: "flex",
    flexDirection: "column",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 28px",
    borderBottom: "1px solid #27272a",
    backgroundColor: "#0c0c0f",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoBox: {
    width: "36px",
    height: "36px",
    borderRadius: "6px",
    backgroundColor: "#141418",
    border: "1px solid #27272a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: "17px",
    fontWeight: 700,
    display: "block",
  },
  brandSubtitle: {
    fontSize: "12px",
    color: "#a1a1aa",
  },
  navTabs: {
    display: "flex",
    gap: "6px",
    backgroundColor: "#141418",
    padding: "4px",
    borderRadius: "6px",
    border: "1px solid #27272a",
  },
  tab: {
    backgroundColor: "transparent",
    color: "#a1a1aa",
    border: "none",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 500,
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tabActive: {
    backgroundColor: "#27272a",
    color: "#fafafa",
    border: "none",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 600,
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  container: {
    padding: "24px 28px",
    maxWidth: "1440px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  stepBanner: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr",
    alignItems: "center",
    gap: "12px",
  },
  stepCard: {
    backgroundColor: "#121216",
    border: "1px solid #27272a",
    borderRadius: "8px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    backgroundColor: "#27272a",
    color: "#fafafa",
    fontWeight: 700,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: "13.5px",
    fontWeight: 600,
    color: "#fafafa",
  },
  stepDesc: {
    fontSize: "12px",
    color: "#a1a1aa",
    marginTop: "2px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    backgroundColor: "#121216",
    border: "1px solid #27272a",
    borderRadius: "8px",
    padding: "12px 16px",
  },
  toolbarLabel: {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#a1a1aa",
  },
  secondaryBtn: {
    backgroundColor: "#18181c",
    color: "#e4e4e7",
    border: "1px solid #27272a",
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  selectBox: {
    backgroundColor: "#18181c",
    color: "#fafafa",
    border: "1px solid #27272a",
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "12.5px",
    cursor: "pointer",
  },
  workbenchGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    alignItems: "stretch",
  },
  card3D: {
    backgroundColor: "#121216",
    border: "1px solid #27272a",
    borderRadius: "10px",
    boxShadow: "0 18px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: "480px",
  },
  cardHeader: {
    padding: "14px 18px",
    borderBottom: "1px solid #27272a",
    backgroundColor: "#16161b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#fafafa",
  },
  cardSub: {
    fontSize: "12px",
    color: "#a1a1aa",
    marginTop: "2px",
  },
  scanBtn: {
    backgroundColor: "#27272a",
    color: "#fafafa",
    border: "1px solid #3f3f46",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "12.5px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  healBtn: {
    backgroundColor: "#10b981",
    color: "#052e16",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "12.5px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  revertBtn: {
    backgroundColor: "#18181b",
    color: "#f59e0b",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  editor: {
    flex: 1,
    width: "100%",
    minHeight: "320px",
    backgroundColor: "#09090b",
    color: "#f4f4f5",
    border: "none",
    padding: "18px",
    fontSize: "13.5px",
    lineHeight: 1.6,
    outline: "none",
    resize: "none",
  },
  bugDrawer: {
    borderTop: "1px solid #7f1d1d",
    backgroundColor: "#1c0a0a",
    padding: "14px 18px",
  },
  bugDrawerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fca5a5",
    marginBottom: "8px",
  },
  bugList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  bugItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12.5px",
    fontFamily: "monospace",
  },
  lineTag: {
    backgroundColor: "#7f1d1d",
    color: "#fef2f2",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
  },
  ruleTag: {
    color: "#fbbf24",
    fontSize: "11.5px",
  },
  explanationBanner: {
    margin: "14px 18px 0",
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid #10b981",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  outputCode: {
    flex: 1,
    padding: "18px",
    backgroundColor: "#09090b",
    color: "#86efac",
    fontSize: "13.5px",
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    margin: "14px 18px 18px",
    borderRadius: "6px",
    border: "1px solid #1e293b",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px",
    gap: "8px",
  },
  pulseBox: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    backgroundColor: "#052e16",
    border: "1px solid #10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  statBox: {
    backgroundColor: "#121216",
    border: "1px solid #27272a",
    borderRadius: "10px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#a1a1aa",
    fontWeight: 500,
  },
  statNum: {
    fontSize: "32px",
    fontWeight: 700,
  },
  statHelp: {
    fontSize: "12px",
    color: "#71717a",
  },
  historySplit: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "20px",
  },
  historyList: {
    backgroundColor: "#121216",
    border: "1px solid #27272a",
    borderRadius: "10px",
    overflow: "hidden",
  },
  historyItem: {
    padding: "14px 16px",
    borderBottom: "1px solid #27272a",
    cursor: "pointer",
  },
  legalCard: {
    maxWidth: "720px",
    margin: "40px auto",
    padding: "32px",
    backgroundColor: "#121216",
    border: "1px solid #27272a",
    borderRadius: "10px",
  },
  legalText: {
    fontSize: "14px",
    color: "#d4d4d8",
    lineHeight: 1.65,
    marginBottom: "16px",
  },
};