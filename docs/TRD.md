# Technical Requirements Document (TRD): HealGit

## 1. System Stack
* Runtime & CLI Engine: Node.js (v20+ / v24), CommonJS modules for CLI compatibility.
* Deterministic Verification Stack:
  * AST & Static Analysis: `eslint` (v8.57.0) programmatic Node API (`useEslintrc: false`).
  * Runtime Execution Gate: Node `child_process.spawnSync` with a strict `3000ms` timeout and isolated `stderr` capture.
  * Dependency Verifier: Regex + `fs` lookup against target `package.json` dependencies and `module.builtinModules`.
  * Credential Scanner: Deterministic regular expression patterns for Google Cloud (`AIza`), OpenAI (`sk-`), GitHub PAT (`ghp_`), and MongoDB URI credentials.
* AI Repair Engine: `@google/genai` SDK running `gemini-3.8-flash` with `responseMimeType: "application/json"`, `temperature: 0.1`, and `thinkingLevel: "LOW"`.
* Backend Telemetry API: Express.js (`v4/v5`), CORS, persistent JSON ledger (`heal-logs.json`).
* Frontend Application: React (Vite), Three.js (`three`) for hardware-accelerated WebGL 3D AST topology visualization, `lucide-react` for industrial vector iconography.

## 3. Internal REST API Specification (`http://localhost:4000`)
* `GET /api/dashboard`
  * Returns real-time aggregated metrics (`totalScans`, `bugsHealed`, `autoHealedFiles`, `cleanFiles`, `rollbacks`, `secretsCaught`, `estimatedMinutesSaved`) and the full array of verification audit logs.
* `POST /api/heal`
  * Body: `{ "filePath": "test-buggy.js" }`
  * Executes the 4-gate verification and 3-cycle repair loop on a local repository file and records the audit entry.
* `POST /api/sandbox`
  * Body: `{ "fileName": "sandbox.js", "code": "..." }`
  * Writes submitted code to an isolated temporary workspace file, runs the full neuro-symbolic repair loop, records telemetry, and returns the verified code and cycle trace to the browser.
* `POST /api/revert/:id`
  * Restores the target file on disk to the `brokenCode` snapshot associated with log `:id` and marks the audit log status as `Reverted by User`.