// Generates the Android (Trusted Web Activity) Gradle project from
// twa-manifest.json into ./build/twa. The APK is a thin shell that opens the
// deployed site in Chrome, so web changes ship without a new APK; rebuild only
// when this manifest, the icons or the version change.
//
// APP_VERSION_CODE (integer, must grow with every release) and
// APP_VERSION_NAME override the manifest's version fields.
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ConsoleLog, TwaGenerator, TwaManifest } from "@bubblewrap/core";

const here = fileURLToPath(new URL(".", import.meta.url));
const outDir = `${here}build/twa`;

const manifest = await TwaManifest.fromFile(`${here}twa-manifest.json`);

if (process.env.APP_VERSION_CODE) {
  const code = Number(process.env.APP_VERSION_CODE);
  if (!Number.isInteger(code) || code < 1) {
    throw new Error(`APP_VERSION_CODE must be a positive integer, got "${process.env.APP_VERSION_CODE}"`);
  }
  manifest.appVersionCode = code;
}
if (process.env.APP_VERSION_NAME) {
  manifest.appVersionName = process.env.APP_VERSION_NAME;
}

const validationError = manifest.validate();
if (validationError) throw new Error(`twa-manifest.json is invalid: ${validationError}`);

await rm(outDir, { recursive: true, force: true });
await new TwaGenerator().createTwaProject(outDir, manifest, new ConsoleLog("twa"));

console.log(
  `Generated ${manifest.packageId} ${manifest.appVersionName} (${manifest.appVersionCode}) in ${outDir}`,
);
