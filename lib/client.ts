import { Alpaca } from "@alpacahq/alpaca-trade-api";

let alpacaClient: Alpaca | undefined;

/**
 * Returns the server-side Alpaca client.
 *
 * This project uses Alpaca for market/news data. Trading operations are not
 * part of the research application.
 */
export function getAlpacaClient(): Alpaca {
  const keyId = process.env.APCA_API_KEY_ID;
  const secret = process.env.APCA_API_SECRET_KEY;

  if (!keyId || !secret) {
    throw new Error(
      "Missing required environment variables: APCA_API_KEY_ID and APCA_API_SECRET_KEY"
    );
  }

  if (!alpacaClient) {
    alpacaClient = new Alpaca({
      keyId,
      secret,
      paper: process.env.APCA_PAPER !== "false",
    });
  }

  return alpacaClient;
}