
export const SYMBOLS = [
  "AAPL",
  "AMD",
  "AMZN",
  "GOOGL",
  "META",
  "MSFT",
  "NFLX",
  "NVDA",
  "SPY",
  "TSLA",
] as const;

export type Symbol = (typeof SYMBOLS)[number];

export function isSupportedSymbol(
  symbol: string
): symbol is Symbol {
  return SYMBOLS.includes(
    symbol.toUpperCase() as Symbol
  );
}