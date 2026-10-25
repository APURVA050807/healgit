# UI/UX Design Brief: HealGit Industrial Interface

## 1. Aesthetic Direction: Industrial Precision (Linear / Vercel / Raycast Standard)
HealGit strictly rejects "AI template" aesthetics. The interface is engineered like a high-precision hardware oscilloscope and compiler terminal.

## 2. Strict Anti-Bloat Rules
* NO purple or neon gradients (`linear-gradient` backgrounds are prohibited).
* NO pill-shaped buttons (`border-radius: 9999px` is prohibited; all interactive controls use crisp `2px` or `4px` radii).
* NO emojis anywhere in the UI, logs, or buttons. All visual indicators use geometric vector icons (`lucide-react`) or 1px technical badges.
* NO fake social proof, fake customer counters, AI stock imagery, or vague marketing slogans.
* NO scroll-jacking animations or custom cursor trails.

## 3. Color Palette (Carbon & Zinc Monospace System)
* Primary Surface Canvas: `#09090B` (Zinc 950)
* Elevated Panel Surface: `#121215`
* Hairline Structural Borders: `#27272A` (`1px solid`)
* Primary Typography: `#FAFAFA` (Zinc 50)
* Secondary / Muted Typography: `#A1A1AA` (Zinc 400)
* Technical Accent (Primary Control): `#10B981` (Emerald 500 - Verified State) and `#FAFAFA` high-contrast monochrome buttons.
* Diagnostic Error State: `#EF4444` (Red 500)
* Warning / Rollback State: `#F59E0B` (Amber 500)

## 4. Typography & Layout Grid
* UI Font Stack: `Inter`, `-apple-system`, `BlinkMacSystemFont`, sans-serif.
* Code & Telemetry Font Stack: `JetBrains Mono`, `SFMono-Regular`, `Menlo`, monospace (`font-variant-numeric: tabular-nums`).
* 1px Solid Grid Architecture: Panels are separated by exposed `1px solid #27272A` structural hairlines rather than drop shadows.

## 5. Interactive 3D WebGL Component
* A dedicated Three.js hardware-accelerated viewport renders the live **3D AST Verification Topology**.
* Nodes represent syntax tokens and execution gates in 3D space. Clean verification states orbit in synchronized emerald/zinc wireframe geometry; detected errors highlight affected nodes in red until the repair cycle resolves them.