# Application Flow (App Flow): HealGit

## 1. Top Navigation Bar (View Switching)
The header contains the custom SVG geometric logo, live backend connection status indicator, and four view switches:
1. `TELEMETRY & INSPECTOR` (Default operational view)
2. `LIVE SANDBOX` (Interactive browser code repair workbench)
3. `PRIVACY POLICY` (Legal compliance document)
4. `TERMS OF SERVICE` (Legal compliance document)

## 2. Flow A: Local Repository Scan & Heal (`TELEMETRY & INSPECTOR`)
1. User clicks `[RUN LOCAL VERIFICATION]` in the top right of the command bar.
2. Button state transitions to `VERIFYING AST & RUNTIME...` (disabled state to prevent duplicate execution).
3. The 3D AST Topology canvas accelerates rotation and shifts node links to active scanning mode.
4. Backend runs the 4 deterministic gates on `test-buggy.js`.
5. Upon completion, the telemetry ledger updates in place:
   * Real database counters increment (`TOTAL EXECUTIONS`, `DEFECTS RESOLVED`, `ZERO-TOKEN PASSES`, `SECRET LEAKS BLOCKED`).
   * The new run is selected at the top of the left Audit Trail list.
   * The right pane displays the exact line/column diagnostic list and the side-by-side `PRE-VERIFICATION SOURCE` vs. `POST-VERIFICATION SOURCE`.
6. If the file was modified by the AI repair engine, a `[REVERT TO ORIGINAL]` button appears in the inspector header. Clicking it restores the original file on disk and updates the badge to `REVERTED`.

## 3. Flow B: Interactive Web Sandbox (`LIVE SANDBOX`)
1. User switches to the `LIVE SANDBOX` tab.
2. User either writes custom JavaScript in the monospace editor or clicks one of three deterministic failure presets:
   * `[LOAD PRESET: HALLUCINATED API & UNREACHABLE CODE]`
   * `[LOAD PRESET: HARDCODED API SECRET LEAK]`
   * `[LOAD PRESET: RUNTIME NULL REFERENCE CRASH]`
3. User clicks `[EXECUTE NEURO-SYMBOLIC LOOP]`.
4. Backend writes the payload to an isolated sandbox file, executes the 4-gate check + Gemini repair loop, and returns the complete diagnostic trace and repaired code side-by-side.