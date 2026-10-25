# BRAIN.md - Persistent AI Engineering Context for HealGit

## 1. Project Identity
HealGit is a neuro-symbolic AI code verification and self-healing system. It combines deterministic static/runtime analysis with targeted LLM code repair (`gemini-3.8-flash`).

## 2. Directory Structure
```text
healgit/
 ├── BRAIN.md
 ├── docs/
 │    ├── PRD.md
 │    ├── TRD.md
 │    ├── DESIGN_BRIEF.md
 │    └── APP_FLOW.md
 ├── .github/workflows/
 │    └── healgit.yml
 ├── backend/
 │    ├── controllers/
 │    │    ├── scanController.js   # 4-Gate Deterministic Engine (ESLint + Imports + Secrets + Runtime)
 │    │    ├── healController.js   # 3-Cycle Neuro-Symbolic Loop + Rollback Function
 │    │    ├── gitController.js    # Autonomous Git Pre-Commit Gate
 │    │    └── logController.js    # Persistent JSON Telemetry & Revert State Manager
 │    ├── index.js                 # Yargs CLI Entrypoint (scan, heal, commit)
 │    ├── server.js                # Express REST API (:4000)
 │    └── test-buggy.js            # Local target file for CLI/UI verification
 └── frontend/
      ├── index.html               # Custom SVG Favicon + Title + Production Meta Tags
      └── src/
           ├── components/
           │    └── AstVisualizer3D.jsx  # Three.js WebGL 3D AST Node Graph
           ├── App.jsx             # Industrial UI (Telemetry, Sandbox, Diff, Legal Views)
           └── index.css           # Carbon/Zinc Reset & Monospace Scrollbars