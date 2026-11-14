// src/lib/market/live.ts

import { SYMBOLS } from "./config";
import {getAlpacaClient } from "@/lib/client"

type LiveState = {
  bars: Record<string, any[]>;
  news: Record<string, any[]>;
};

const state: LiveState = {
  bars: {},
  news: {},
};

let streamsStarted = false;

export function startLiveStreams() {
  if (streamsStarted) {
    return;
  }

  streamsStarted = true;

  const alpaca = getAlpacaClient();

  const stockStream = alpaca.marketData.stockStream({
    feed: "iex",
  });

  stockStream.onConnect(() => {
    stockStream.subscribeForBars([...SYMBOLS]);
  });

  stockStream.onBar((bar) => {
    const symbol = bar.symbol;

    state.bars[symbol] ??= [];

    state.bars[symbol].push({
      timestamp: new Date(bar.timestamp).toISOString(),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    });

    state.bars[symbol] = state.bars[symbol].slice(-100);
  });

  stockStream.onError((error) => {
    console.error("[Alpaca Stock Stream]", error);
  });

  stockStream.connect();

  const newsStream = alpaca.marketData.newsStream();

  newsStream.onConnect(() => {
    newsStream.subscribeForNews([...SYMBOLS]);
  });

  newsStream.onNews((article) => {
    for (const symbol of article.symbols ?? []) {
      state.news[symbol] ??= [];

      state.news[symbol].push({
        id: String(article.id),
        headline: article.headline,
        summary: article.summary ?? "",
        source: article.source ?? "",
        url: article.url,
        symbols: article.symbols ?? [],
        publishedAt: new Date(
          article.createdAt ?? new Date()
        ).toISOString(),
      });

      state.news[symbol] = state.news[symbol].slice(-20);
    }
  });

  newsStream.onError((error) => {
    console.error("[Alpaca News Stream]", error);
  });

  newsStream.connect();
}

export function getLiveSymbolState(symbol: string) {
  startLiveStreams();

  return {
    mode: "live" as const,
    symbol,
    timestamp: new Date().toISOString(),
    bars: state.bars[symbol] ?? [],
    news: state.news[symbol] ?? [],
  };
}