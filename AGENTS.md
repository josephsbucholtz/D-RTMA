# D-RTMA agent instructions

## Project overview

D-RTMA is a Next.js application using the App Router, TypeScript, React, and Tailwind CSS. The repository is currently a minimal starter application. The implemented page is a simple home page at `/home`, and `/` redirects to `/home`.

The intended product is a quantitative research and decision-support dashboard for market data and financial news. It produces explainable research signals such as buy, hold, or sell. It must not place real trades or contain brokerage execution logic without explicit project-owner approval.

## Current repository structure

```text
app/
├── home/
│   └── page.tsx            # Current home page
├── globals.css             # Global Tailwind CSS import
└── layout.tsx              # Root layout, metadata, and Geist fonts
└── api/
│       ├── research/
│       │   └── route.ts
│       ├── replay/
│       │   └── route.ts
│       └── symbols/
│           └── [symbol]/
│               └── route.ts
├── home/
│   └── page.tsx            # Current home page
├── globals.css             # Global Tailwind CSS import
└── layout.tsx              # Root layout, metadata, and Geist fonts

├── components/
│   ├── dashboard/
│   │   ├── SymbolGrid.tsx
│   │   ├── SymbolCard.tsx
│   │   ├── SignalBadge.tsx
│   │   ├── NewsTimeline.tsx
│   │   └── ResearchPanel.tsx
│   └── charts/
│       └── PriceChart.tsx
│
├── lib/
│   ├── nace/
│   │   ├── client.ts
│   │   ├── drex.ts
│   │   └── ndi.ts
│   ├── market/
│   │   ├── source.ts
│   │   ├── historical.ts
│   │   └── types.ts
│   ├── research/
│   │   ├── analyze-symbol.ts
│   │   ├── features.ts
│   │   └── policy.ts
│   ├── replay/
│   │   └── replay-engine.ts
│   └── validation/
│       └── schemas.ts
│
public/                     # Static assets and starter SVGs
types/
├── cache-life.d.ts         # Next.js generated type declarations
├── root-params.d.ts        # Next.js generated type declarations
├── routes.d.ts             # Next.js generated route declarations
└── validator.ts            # TypeScript validation declarations

eslint.config.mjs
next.config.ts
package.json
README.md
tsconfig.json
```
Non-negotiable boundaries
Server-only code
The following must never be imported by client components:
- src/lib/nace/**
- Any module that reads process.env secrets
- Any module that calls Nace or another external service
API keys must remain server-side. Never use NEXT_PUBLIC_ for credentials.

Use Route Handlers under src/app/api/** as the boundary between the browser and approved Nace services.
Nace-only integration boundary
All AI, document understanding, search, news retrieval, and market-data retrieval must use approved Nace capabilities or supplied project data.
- Use Drex for structured decisions and classifications.
- Use NDI for unstructured documents such as filings, PDFs, and reports.
- Use Nace Search or another explicitly approved Nace capability for permitted research retrieval.
- Use project-provided historical JSON fixtures when a Nace market-data feed is unavailable.
- Do not imply that Nace provides a native stock-exchange feed unless the current Nace documentation or hackathon rules explicitly confirm it.
- If live market prices cannot be obtained through an approved Nace capability, the application must clearly label the mode as historical or unavailable rather than silently using another provider.
Research-only behavior
- Do not add order placement, brokerage execution, or real-money trading logic.
- A buy, hold, or sell value is a research signal, not a trade instruction.
- Use terms such as research signal, confidence, evidence, risk, and historical outcome in the UI.
- Do not claim that a signal is profitable or financially guaranteed.
- Deterministic policy code must apply confidence and evidence thresholds before a signal is marked publishable.
Data flow conventions
Approved live/supplied data and historical data must use the same internal types and processing pipeline.
Approved Nace source or historical replay
        ↓
Normalized market/news event
        ↓
Feature calculation
        ↓
Drex analysis
        ↓
Research policy
        ↓
UI result
Do not create a separate analysis implementation for historical replay. Historical replay should only replace the data source and preserve the rest of the pipeline.

Use an explicit mode type:
type DataMode = "live" | "historical";
Every normalized event should preserve its mode and timestamp.
Drex guidance
Use Drex for structured evaluation of a symbol's market and news state.
- Use choice for buy, hold, and sell.
- Use choice for event categories and risk categories.
- Use score for ordered concepts such as market impact, risk, or volatility.
- Use noul for yes/no questions such as whether evidence is sufficient.
- Include enough context in the question instructions to make the criteria unambiguous.
- Do not ask Drex to perform arithmetic that ordinary TypeScript can perform reliably.
- Do not treat the highest-probability answer as automatically publishable.
- Preserve confidence and probability distributions in the result.
Preferred decision shape:
type ResearchResult = {
  symbol: string;
  timestamp: string;
  action: "buy" | "hold" | "sell";
  actionConfidence: number;
  eventType: string;
  marketImpact: number;
  riskLevel: number;
  evidenceSufficient: number;
  primaryRisk: string;
  supportingNews: NewsArticle[];
};
NDI is intended for unstructured documents such as filings, PDFs, earnings reports, and presentations. Do not route already structured market JSON through NDI unnecessarily. Send structured market/news state directly to Drex.
Validation
Validate all external input at the boundary using schemas in src/lib/validation/schemas.ts.

Validate at least:
- Symbol names
- Date ranges
- Replay speed
- Market-bar fields
- News article fields
- Drex response fields before displaying or persisting them
Never trust client-provided symbols, dates, or provider response shapes without validation.
API route conventions
API routes should:
1. Validate request input.
2. Call a typed function in src/lib/**.
3. Return a consistent JSON response.
4. Use appropriate HTTP status codes.
5. Avoid leaking provider credentials or raw internal errors.
6. Include a useful error identifier in logs.
Prefer response shapes like:
{ data: result }
or:
{ error: "Human-readable message", code: "stable_error_code" }
Do not put provider-specific logic directly in React components or route handlers when it belongs in src/lib/market, src/lib/nace, or src/lib/research.
Components and UI
- Default to React Server Components.
- Add "use client" only for stateful or browser-interactive components.
- Keep data fetching and secrets out of client components.
- Use Tailwind utility classes consistently.
- Keep signal presentation visually clear: action, confidence, risk, evidence status, and timestamp should be distinct.
- Always show whether the data is live or historical.
- Historical replay controls belong in the UI, but replay execution belongs on the server or in a controlled worker.
- Charts should receive typed, normalized data rather than raw provider responses.
Historical replay
Historical replay is the primary demonstration and testing path when an approved Nace live market-data source is unavailable.
- Use saved historical market bars and news events.
- Replay market data and news in timestamp order.
- Preserve the original event timestamps while tracking the current replay time separately.
- Support a configurable playback speed.
- Make replay deterministic when possible.
- Use the same Drex analysis and policy code used by live mode.
Parallel symbol analysis
The application may analyze approximately ten symbols concurrently.
- Use Promise.allSettled so one failed symbol does not fail the entire portfolio response.
- Keep each symbol's result and error independent.
- Add concurrency limits before scaling beyond the hackathon.
- Avoid calling Drex repeatedly for duplicate news events.
- Deduplicate news by provider and article ID where available.
Error handling and observability
Log enough information to debug without logging secrets:
- Symbol
- Data mode
- Provider event ID
- Nace request ID when available
- Error code
- Timestamp
- Duration
Do not log API keys, secrets, full credentials, or unnecessary private article content.
Testing priorities
At minimum, test:
- Normalization of market bars
- Normalization of news events
- Feature calculations
- Historical replay ordering and speed
- Drex response parsing
- Policy threshold behavior
- One-symbol analysis failure isolation
- API validation failures
Use fixtures in src/data or a test-specific fixture directory. Tests should not depend on live market hours or live news availability.
Commands
npm run dev
npm run build
npm run start
npm run lint
Before submitting changes:
1. Run the linter.
2. Run the production build.
3. Test historical replay.
4. Confirm that no secret is exposed to the client bundle.
5. Confirm that live and historical modes use the same analysis pipeline.