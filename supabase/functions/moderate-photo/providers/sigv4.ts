// Minimal AWS Signature Version 4 (header signing) on Web Crypto, so the Edge
// Function needs no AWS SDK.

const encoder = new TextEncoder();

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === "string" ? encoder.encode(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

export type SignInput = {
  method: string;
  host: string;
  path: string;
  query?: string;
  /** Extra headers to sign (lower-case names), e.g. content-type, x-amz-target. */
  headers?: Record<string, string>;
  body: string | Uint8Array;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  /** Overridable for tests. */
  now?: Date;
};

/** Returns the headers to send, including Authorization and x-amz-date. */
export async function signRequest(input: SignInput): Promise<Record<string, string>> {
  const now = input.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    ...input.headers,
    host: input.host,
    "x-amz-date": amzDate,
  };
  if (input.sessionToken) headers["x-amz-security-token"] = input.sessionToken;

  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((n) => `${n}:${headers[n].trim()}\n`).join("");
  const signedHeaders = names.join(";");
  const payloadHash = await sha256Hex(input.body);

  const canonicalRequest = [
    input.method,
    input.path,
    input.query ?? "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256Hex(canonicalRequest)].join("\n");

  const kDate = await hmac(encoder.encode(`AWS4${input.secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, input.region);
  const kService = await hmac(kRegion, input.service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = hex(await hmac(kSigning, stringToSign));

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
