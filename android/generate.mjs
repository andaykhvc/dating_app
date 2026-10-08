// Generates the Android (Trusted Web Activity) Gradle project from
// twa-manifest.json into ./build/twa. The APK is a thin shell that opens the
// deployed site in Chrome, so web changes ship without a new APK; rebuild only
// when this manifest, the icons or the version change.
//
// APP_VERSION_CODE (integer, must grow with every release) and
// APP_VERSION_NAME override the manifest's version fields. SITE_HOST (a bare
// host such as app.example.com) overrides the host the app opens; the icon and
// web-manifest URLs follow it. Unset, twa-manifest.json is used as committed.
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

if (process.env.SITE_HOST) {
  const host = process.env.SITE_HOST.trim();
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d+)?$/i.test(host)) {
    throw new Error(`SITE_HOST must be a bare host like app.example.com, got "${process.env.SITE_HOST}"`);
  }
  // The manifest keeps some of these as URL objects and some as strings.
  const moveToHost = (value) => {
    if (!value) return value;
    const url = new URL(String(value));
    url.host = host;
    return value instanceof URL ? url : url.href;
  };
  manifest.host = host;
  manifest.iconUrl = moveToHost(manifest.iconUrl);
  manifest.maskableIconUrl = moveToHost(manifest.maskableIconUrl);
  manifest.webManifestUrl = moveToHost(manifest.webManifestUrl);
  manifest.fullScopeUrl = moveToHost(manifest.fullScopeUrl);
}

const validationError = manifest.validate();
if (validationError) throw new Error(`twa-manifest.json is invalid: ${validationError}`);

await rm(outDir, { recursive: true, force: true });
await new TwaGenerator().createTwaProject(outDir, manifest, new ConsoleLog("twa"));

console.log(
  `Generated ${manifest.packageId} ${manifest.appVersionName} (${manifest.appVersionCode}) in ${outDir}`,
);
