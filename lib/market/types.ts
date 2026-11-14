export type DataMode = "live" | "historical";

export type ResearchState = {
  mode: DataMode;
  symbol: string;
  timestamp: string;
  bars: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  news: Array<{
    id: string;
    headline: string;
    summary: string;
    source: string;
    url?: string;
    symbols: string[];
    publishedAt: string;
  }>;
};

export type MarketBar = ResearchState["bars"][number];

export type NewsArticle = {
  id: string;
  headline: string;
  summary?: string;
  source?: string;
  url?: string;
  symbols: string[];
  publishedAt: string;
};


export type ResearchResult = {
  symbol: string;
  action: "buy" | "hold" | "sell";
  actionConfidence: number;
  eventType: string;
  marketImpact: number;
  riskLevel: number;
  evidenceSufficient: number;
  primaryRisk: string;
  timestamp: string;
};

export type ResearchResponse = {
  mode: DataMode;
  date?: string;
  generatedAt: string;
  results: Array<{
    symbol: string;
    success: boolean;
    state: ResearchState;
    analysis?: unknown;
    error?: string;
  }>;
};
