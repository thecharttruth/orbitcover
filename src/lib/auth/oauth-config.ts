/** Credentials are injected on the server, never embedded in a public export. */
export function resolveOAuthCredentials(
  environment: Record<string, string | undefined>,
): { clientId: string; clientSecret: string } | null {
  if (environment.VITE_AUTH_ENABLED?.trim() === "false") return null;
  const clientId = environment.GROK_AUTH_CLIENT_ID?.trim();
  const clientSecret = environment.GROK_AUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Authentication is enabled but GROK_AUTH_CLIENT_ID and GROK_AUTH_CLIENT_SECRET " +
        "have not both been configured on the server. Refusing to use shared preview credentials.",
    );
  }
  return { clientId, clientSecret };
}
