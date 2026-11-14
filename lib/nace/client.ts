import { NaceClient } from "nace-sdk";

let naceClient: NaceClient | undefined;

/**
 * Returns the server-side Nace client.
 *
 * Keep this module out of Client Components and never expose NACE_API_KEY
 * through a NEXT_PUBLIC_ environment variable.
 */
export function getNaceClient(): NaceClient {
  const apiKey = process.env.NACE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: NACE_API_KEY");
  }

  if (!naceClient) {
    naceClient = new NaceClient({
      apiKey,
      baseURL: process.env.NACE_BASE_URL,
      defaultModel:
        process.env.NACE_DEFAULT_DECISION_MODEL ?? "drex-latest",
      timeout: 90_000,
      logLevel: "warn",
    });
  }

  return naceClient;
}
