// FCM HTTP v1 over plain fetch + Web Crypto: no Google SDK.
// Auth: a service-account JSON -> signed JWT (RS256) -> OAuth2 access token.

export type ServiceAccount = { project_id: string; client_email: string; private_key: string };

export function parseServiceAccount(json: string | undefined): ServiceAccount | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<ServiceAccount>;
    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return {
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      };
    }
  } catch {
    // fall through
  }
  return null;
}

const encoder = new TextEncoder();

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): ArrayBuffer {
  const base64 = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function createSignedJwt(account: ServiceAccount, now: Date = new Date()): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(`${header}.${claims}`));
  return `${header}.${claims}.${base64url(signature)}`;
}

export type FcmClient = {
  /** Resolves to "sent", or "unregistered" when FCM says the token is dead. */
  send(token: string, data: Record<string, string>): Promise<"sent" | "unregistered">;
};

export function createFcmClient(account: ServiceAccount, fetchImpl: typeof fetch = fetch): FcmClient {
  let cached: { token: string; expiresAt: number } | null = null;

  async function accessToken(): Promise<string> {
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
    const assertion = await createSignedJwt(account);
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!response.ok) throw new Error(`oauth token request failed (${response.status})`);
    const json = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error("oauth response had no access_token");
    cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return cached.token;
  }

  return {
    async send(token, data) {
      const response = await fetchImpl(
        `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${await accessToken()}`,
            "content-type": "application/json",
          },
          // Data-only: the service worker builds the notification itself.
          body: JSON.stringify({
            message: { token, data, webpush: { headers: { Urgency: "high", TTL: "86400" } } },
          }),
        },
      );
      if (response.ok) return "sent";

      const body = (await response.json().catch(() => null)) as {
        error?: { status?: string; details?: Array<{ errorCode?: string }> };
      } | null;
      const code = body?.error?.details?.find((d) => d.errorCode)?.errorCode;
      if (code === "UNREGISTERED" || body?.error?.status === "NOT_FOUND") return "unregistered";
      // Status only: never echo the response body (it can include the token).
      throw new Error(`fcm send failed (${response.status}${code ? ` ${code}` : ""})`);
    },
  };
}
