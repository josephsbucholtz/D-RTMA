import { choice, noul, score, } from "nace-sdk";

import { getNaceClient } from "./client";
import { calculateFeatures } from "@/lib/research/features";
import type {
  ResearchResult,
  ResearchState,
} from "@/lib/market/types";

export async function analyzeSymbol(
  state: ResearchState
): Promise<ResearchResult> {
  const features = calculateFeatures(state);
  const nace = getNaceClient();

  const result = await nace.systemOne({
    state: {
      symbol: state.symbol,
      bars: state.bars,
      features,
      news: state.news,
    },
    questions: {
      action: choice(
        "Choose the appropriate research signal.",
        {
          buy: "Evidence supports a positive research signal",
          hold: "Evidence is mixed or insufficient",
          sell: "Evidence supports a negative research signal",
        }
      ),

      eventType: choice(
        "Classify the most important news event.",
        {
          earnings: "Earnings or financial guidance",
          product: "Product or technology announcement",
          legal: "Legal or regulatory event",
          management: "Leadership change",
          merger: "Merger or acquisition",
          macro: "Broader market or economic event",
          other: "Other",
        }
      ),

      marketImpact: score(
        "Rate the expected short-term market impact.",
        [
          "Minimal",
          "Moderate",
          "Significant",
          "Major",
        ]
      ),

      riskLevel: score(
        "Rate the research risk of this signal.",
        [
          "Low",
          "Moderate",
          "High",
          "Extreme",
        ]
      ),

      evidenceSufficient: noul(
        "Is there enough evidence to produce a research signal?"
      ),

      primaryRisk: choice(
        "Identify the primary source of uncertainty.",
        {
          volatility: "Unusual volatility",
          conflictingNews: "Conflicting news",
          weakEvidence: "Insufficient evidence",
          marketWide: "Broader market movement",
          none: "No major risk",
        }
      ),
    },
  });

  return {
    symbol: state.symbol,
    action: result.answers.action.choice,
    actionConfidence: result.answers.action.confidence,
    eventType: result.answers.eventType.choice,
    marketImpact: result.answers.marketImpact.score,
    riskLevel: result.answers.riskLevel.score,
    evidenceSufficient:
      result.answers.evidenceSufficient.noul,
    primaryRisk: result.answers.primaryRisk.choice,
    timestamp: new Date().toISOString(),
  };
}