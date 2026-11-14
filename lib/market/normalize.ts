import type {
  NewsArticle,
  ResearchState,
} from "./types";

export function buildResearchStates(
  barsBySymbol: Record<string, any[]>,
  articles: any[]
): ResearchState[] {
  return Object.entries(barsBySymbol).map(([symbol, bars]) => ({
    mode: "historical",
    symbol,
    start: "2026-11-13T14:30:00Z",
    end: "2026-11-13T21:00:00Z",
    bars: bars.map((bar) => ({
      timestamp: new Date(bar.timestamp).toISOString(),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    })),
    news: articles
      .filter((article) => article.symbols?.includes(symbol))
      .map(
        (article): NewsArticle => ({
          id: String(article.id),
          headline: article.headline,
          summary: article.summary,
          source: article.source,
          url: article.url,
          symbols: article.symbols,
          publishedAt: new Date(
            article.createdAt
          ).toISOString(),
        })
      ),
  }));
}