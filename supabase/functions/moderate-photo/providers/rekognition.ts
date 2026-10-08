import { MIN_CONFIDENCE } from "../thresholds.ts";
import type { ModerationProvider, ModerationResult } from "../types.ts";
import { verdictFromLabels } from "../verdict.ts";
import { signRequest } from "./sigv4.ts";

export type RekognitionConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  /** An EU region keeps the images in the EU, e.g. eu-west-1 (Ireland). */
  region: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Amazon Rekognition DetectModerationLabels, called directly over HTTPS. */
export class RekognitionProvider implements ModerationProvider {
  readonly name = "aws-rekognition";
  constructor(private readonly config: RekognitionConfig) {}

  async moderate(imageBytes: Uint8Array): Promise<ModerationResult> {
    const { region } = this.config;
    const host = `rekognition.${region}.amazonaws.com`;
    const body = JSON.stringify({
      Image: { Bytes: toBase64(imageBytes) },
      MinConfidence: MIN_CONFIDENCE,
    });

    const headers = await signRequest({
      method: "POST",
      host,
      path: "/",
      headers: {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-target": "RekognitionService.DetectModerationLabels",
      },
      body,
      region,
      service: "rekognition",
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    });

    const response = await (this.config.fetch ?? fetch)(`https://${host}/`, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 8000),
    });
    if (!response.ok) {
      // Never include the body in the error: it can echo request details.
      throw new Error(`rekognition responded ${response.status}`);
    }

    const json = (await response.json()) as { ModerationLabels?: unknown };
    return verdictFromLabels(json.ModerationLabels);
  }
}
