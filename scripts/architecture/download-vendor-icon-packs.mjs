#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { get } from "node:https";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = resolve(repoRoot, "docs/architecture/vendor-icons/manifest.json");

async function readManifest() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest.packs)) {
    throw new Error("Vendor icon manifest must contain a packs array.");
  }
  return manifest.packs;
}

function download(url, destination) {
  return new Promise((resolveDownload, rejectDownload) => {
    get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        download(new URL(response.headers.location, url).toString(), destination)
          .then(resolveDownload)
          .catch(rejectDownload);
        return;
      }

      if (response.statusCode !== 200) {
        rejectDownload(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
        response.resume();
        return;
      }

      pipeline(response, createWriteStream(destination)).then(resolveDownload).catch(rejectDownload);
    }).on("error", rejectDownload);
  });
}

async function sha256(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

for (const pack of await readManifest()) {
  const targetPath = resolve(repoRoot, pack.repoPath);
  const tempPath = `${targetPath}.download`;

  await mkdir(dirname(targetPath), { recursive: true });
  await rm(tempPath, { force: true });

  console.log(`Downloading ${pack.vendor} icon pack...`);
  await download(pack.downloadUrl, tempPath);

  const actualHash = await sha256(tempPath);
  if (actualHash !== pack.sha256) {
    await rm(tempPath, { force: true });
    throw new Error(
      `${pack.vendor} SHA-256 mismatch: expected ${pack.sha256}, received ${actualHash}`,
    );
  }

  await rename(tempPath, targetPath);
  console.log(`Verified ${pack.vendor}: ${pack.repoPath}`);
}
