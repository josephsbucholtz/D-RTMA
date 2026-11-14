
import { NaceClient } from "nace-sdk";

let client: NaceClient | undefined;

export function getNaceClient(): NaceClient {
  if (client) {
    return client;
  }

  const apiKey = process.env.NACE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NACE_API_KEY");
  }

  client = new NaceClient({
    apiKey,
    baseURL: process.env.NACE_BASE_URL ?? "https://console.nace.ai",
    defaultModel:
      process.env.NACE_DEFAULT_DECISION_MODEL ?? "drex-latest",
    timeout: 90_000,
    logLevel: "info",
  });

  return client;
}