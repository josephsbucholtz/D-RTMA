import { getNaceClient } from "./client";
import type { DrexState } from "./drex";

type AgentName = "market" | "news" | "risk";
type AgentResponse = { model: string; answers: Record<string, unknown>; request_id?: string };

const agentInstructions: Record<AgentName, { role: string; questions: Record<string, unknown> }> = {
  market: {
    role: "Evaluate price action and market impact only. Ignore unsupported assumptions and do not use news to invent price data.",
    questions: {
      action: { type: "choice", instructions: "Choose a research signal from the supplied price and volume state.", criteria: { buy: "Price action supports a positive research signal.", hold: "Price action is mixed or insufficient.", sell: "Price action supports a negative research signal." } },
      market_impact: { type: "score", instructions: "Rate the expected short-term market impact from the supplied state.", criteria: ["Minimal impact.", "Moderate impact.", "Significant impact.", "Major impact."] },
    },
  },
  news: {
    role: "Classify the supplied news evidence. Do not infer facts that are not present in the articles.",
    questions: {
      event_type: { type: "choice", instructions: "Classify the most important recent news event.", criteria: { earnings: "Earnings, revenue, or guidance.", product: "Product or technology announcement.", legal: "Legal or regulatory event.", management: "Leadership or executive change.", merger: "Merger, acquisition, or partnership.", macro: "Broader economic or market event.", other: "Other or no clear event." } },
      evidence_sufficient: { type: "noul", instructions: "Is there enough reliable news evidence to support a research signal?" },
    },
  },
  risk: {
    role: "Evaluate uncertainty and downside risk. Be conservative when evidence is incomplete or conflicting.",
    questions: {
      risk_level: { type: "score", instructions: "Rate the research risk of this state.", criteria: ["Low risk.", "Moderate risk.", "High risk.", "Extreme risk."] },
      primary_risk: { type: "choice", instructions: "Identify the primary source of uncertainty.", criteria: { volatility: "Unusual or unstable price movement.", conflicting_news: "News signals conflict.", weak_evidence: "Evidence is incomplete or unreliable.", market_wide: "Movement may be caused by the broader market.", none: "No major uncertainty identified." } },
    },
  },
};

async function runAgent(name: AgentName, state: DrexState): Promise<AgentResponse> {
  const nace = getNaceClient();
  const config = agentInstructions[name];
  const response = await nace.systemOne({
    state: { ...state, agent_role: config.role },
    questions: config.questions,
  });
  return response as unknown as AgentResponse;
}

export async function analyzeWithDrexAgents(state: DrexState) {
  const entries = await Promise.all(
    (Object.keys(agentInstructions) as AgentName[]).map(async (name) => [
      name,
      await runAgent(name, state),
    ] as const)
  );
  const agents = Object.fromEntries(entries) as Record<AgentName, AgentResponse>;
  const answers = {
    action: agents.market.answers.action,
    market_impact: agents.market.answers.market_impact,
    event_type: agents.news.answers.event_type,
    evidence_sufficient: agents.news.answers.evidence_sufficient,
    risk_level: agents.risk.answers.risk_level,
    primary_risk: agents.risk.answers.primary_risk,
  };

  return {
    model: agents.market.model,
    answers,
    agents: Object.fromEntries(
      (Object.entries(agents) as Array<[AgentName, AgentResponse]>).map(([name, result]) => [name, { model: result.model, request_id: result.request_id }])
    ),
  };
}
