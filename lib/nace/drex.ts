// src/lib/nace/drex.ts

import { getNaceClient } from "./client";

export type DrexState = Record<string, unknown>;

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Drex error";
  }
}

export async function analyzeWithDrex(state: DrexState) {
  const nace = getNaceClient();

  // Ensure the request contains JSON-compatible data.
  const jsonState = JSON.parse(JSON.stringify(state));

  try {
    console.log("[Drex] Starting", {
      symbol: jsonState.symbol,
      newsCount: Array.isArray(jsonState.news)
        ? jsonState.news.length
        : 0,
    });

    const response = await nace.systemOne({
      state: jsonState,
      questions: {
        action: {
          type: "choice",
          instructions:
            "Choose the appropriate research signal based only on the supplied market data and news.",
          criteria: {
            buy: "Evidence supports a positive research signal.",
            hold: "Evidence is mixed or insufficient.",
            sell: "Evidence supports a negative research signal.",
          },
        },

        event_type: {
          type: "choice",
          instructions: "Classify the most important recent news event.",
          criteria: {
            earnings: "Earnings, revenue, or financial guidance.",
            product: "Product or technology announcement.",
            legal: "Legal or regulatory event.",
            management: "Leadership or executive change.",
            merger: "Merger, acquisition, or partnership.",
            macro: "Broader economic or market event.",
            other: "Other event.",
          },
        },

        market_impact: {
          type: "score",
          instructions:
            "Rate the expected short-term market impact of the news.",
          criteria: [
            "Minimal impact.",
            "Moderate impact.",
            "Significant impact.",
            "Major impact.",
          ],
        },

        risk_level: {
          type: "score",
          instructions: "Rate the research risk of this signal.",
          criteria: [
            "Low risk.",
            "Moderate risk.",
            "High risk.",
            "Extreme risk.",
          ],
        },

        evidence_sufficient: {
          type: "noul",
          instructions:
            "Is there enough reliable evidence to produce a research signal?",
        },

        primary_risk: {
          type: "choice",
          instructions:
            "Identify the primary source of uncertainty in this signal.",
          criteria: {
            volatility: "Unusual or unstable price movement.",
            conflicting_news: "The news signals conflict.",
            weak_evidence: "The evidence is incomplete or unreliable.",
            market_wide: "The movement may be caused by the broader market.",
            none: "No major source of uncertainty was identified.",
          },
        },
      },
    });

    console.log("[Drex] Completed", {
      symbol: jsonState.symbol,
      model: response.model,
    });

    return response;
  } catch (error) {
    console.error("[Drex] Failed", {
      symbol: jsonState.symbol,
      message: errorMessage(error),
      error,
    });

    throw error;
  }
}

export const analyzeSymbol = analyzeWithDrex;