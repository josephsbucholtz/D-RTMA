import type { ResearchState } from "@/lib/market/types";
import { calculateFeatures } from "./features";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null
    ? (value as RecordValue)
    : {};
}

function numeric(value: unknown, fallback = 0) {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function answer(analysis: unknown, name: string) {
  return record(record(analysis).answers)[name];
}

function normalizedScore(value: unknown) {
  const score = numeric(value);
  return score > 1 ? clamp(score / 3) : clamp(score);
}

export function buildResearchInsights(state: ResearchState, analysis: unknown) {
  const actionAnswer = record(answer(analysis, "action"));
  const eventAnswer = record(answer(analysis, "event_type"));
  const impactAnswer = record(answer(analysis, "market_impact"));
  const riskAnswer = record(answer(analysis, "risk_level"));
  const evidenceAnswer = record(answer(analysis, "evidence_sufficient"));
  const primaryRiskAnswer = record(answer(analysis, "primary_risk"));
  const features = calculateFeatures(state);

  const action = ["buy", "hold", "sell"].includes(String(actionAnswer.choice))
    ? String(actionAnswer.choice)
    : "hold";
  const actionConfidence = clamp(numeric(actionAnswer.confidence));
  const riskLevel = normalizedScore(riskAnswer.score);
  const marketImpact = normalizedScore(impactAnswer.score);
  const evidenceSufficient = clamp(
    numeric(evidenceAnswer.noul, actionConfidence)
  );
  const eventType = String(eventAnswer.choice ?? "other");
  const primaryRisk = String(primaryRiskAnswer.choice ?? "weak_evidence");
  const direction = features.return30m >= 0 ? "upward" : "downward";
  const volumeNote =
    features.volumeVsAverage > 1.25
      ? "volume is elevated"
      : "volume is near its recent average";

  const conclusions = [
    `${state.symbol} has a ${action} research signal with ${Math.round(actionConfidence * 100)}% Drex confidence.`,
    `The latest 30-minute move is ${direction} (${(features.return30m * 100).toFixed(2)}%) and ${volumeNote}.`,
    `${eventType.replaceAll("_", " ")} is the leading event classification; estimated risk is ${Math.round(riskLevel * 100)}%.`,
  ];

  return {
    action,
    actionConfidence,
    eventType,
    marketImpact,
    riskLevel,
    evidenceSufficient,
    primaryRisk,
    features,
    conclusions,
    model: typeof record(analysis).model === "string" ? record(analysis).model : "Drex",
    requestId: typeof record(analysis).request_id === "string" ? record(analysis).request_id : undefined,
  };
}
