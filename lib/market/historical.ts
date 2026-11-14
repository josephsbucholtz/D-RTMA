import { Alpaca, TimeFrame, } from "@alpacahq/alpaca-trade-api";

const alpaca = new Alpaca({
  keyId: process.env.APCA_API_KEY_ID!,
  secret: process.env.APCA_API_SECRET_KEY!,
  paper: true,
});

const SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "META",
  "GOOGL",
  "AMD",
  "NFLX",
  "SPY",
];

const START = new Date("2026-11-13T14:30:00Z");
const END = new Date("2026-11-13T21:00:00Z");

export async function getHistoricalMarketData() {
  return alpaca.marketData.getStockBars({
    symbols: SYMBOLS,
    timeframe: TimeFrame.Minute,
    start: START,
    end: END,
  });
}

export async function getHistoricalNews() {
  return alpaca.marketData.collectNews({
    symbols: SYMBOLS,
    start: START,
    end: END,
  });
}