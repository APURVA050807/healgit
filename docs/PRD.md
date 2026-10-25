# Product Requirements Document (PRD): HealGit

## 1. Product Purpose (Kya Kaam Karegi)
HealGit is a deterministic-first, neuro-symbolic code verification and automated repair platform. Instead of relying on an LLM to "guess" whether code contains bugs, HealGit passes source files through four strict, non-hallucinating software gates:
1. Static AST & ESLint Rule Analysis (undefined variables, unreachable logic).
2. Dependency & Import Verification (verifying every `require` or `import` exists in `package.json` or Node builtins).
3. Secret & Credential Detection (blocking hardcoded API keys and tokens before Git commit).
4. Isolated Node.js Runtime Sandbox Execution (catching runtime crashes within a 3,000ms execution ceiling).

Only when a deterministic gate fails does HealGit invoke the LLM repair engine, passing the exact line number, rule ID, and stack trace. It then re-verifies the repaired output in a closed loop (maximum 3 cycles) with an automatic memory rollback circuit breaker.

## 2. Target Audience (Kis Ke Liye Karegi)
* Individual software engineers and students using AI code assistants (Cursor, GitHub Copilot, Claude) who frequently encounter hallucinated imports, undefined helpers, or subtle runtime crashes.
* Small engineering teams and indie founders needing an automated pre-commit and GitHub Pull Request quality gate without enterprise static-analysis overhead.
* Technical recruiters and engineering managers evaluating real-world systems engineering via the live Web Sandbox.

## 3. Core Objective (Actual Goal)
Eliminate broken commits and hallucinated code in production repositories while maintaining zero token expenditure on clean files. Every telemetry metric displayed on the platform reflects actual verification runs stored in the database—never simulated counters or placeholder marketing numbers.

## 4. User Experience Standards
* Zero marketing fluff: The application opens directly into the operational workspace (3D AST Topology Visualizer, Live Code Verification Sandbox, and Audit Telemetry).
* Deterministic transparency: Users see the exact compiler/AST error output alongside a side-by-side unified comparison of the pre-verification and post-verification source code.
* Instant reversibility: Every automated repair logged on disk can be reverted to its original byte-for-byte state with a single click.